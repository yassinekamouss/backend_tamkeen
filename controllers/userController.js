const Personne = require("../models/Personne");
const TestElegibilite = require("../models/TestElegibilite");
const asyncHandler = require("../utils/asyncHandler");
const api = require("../utils/apiResponse");
const Admin = require("../models/Admin");
const ExcelJS = require("exceljs");
const { logActivity } = require("../utils/activity");

// Obtenir toutes les personnes
exports.getAllUsers = asyncHandler(async (req, res) => {
  const personnes = await Personne.find().populate(
    "consultantAssocie",
    "username"
  );

  return res.status(200).json(personnes);
});

exports.exportUsers = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, applicantType, adminId } = req.query;

    const filter = {};
    if (applicantType && applicantType !== "all") {
      filter.applicantType = applicantType;
    }
    if (adminId) {
      filter.consultantAssocie = adminId;
    }

    // Récupérer les personnes
    const personnes = await Personne.find(filter)
      .populate("consultantAssocie", "username")
      .lean();

    // Préparer le filtre des tests
    const testFilter = {
      personne: { $in: personnes.map((p) => p._id) },
    };

    // Si on a reçu un domaine de date (intervalle)
    if (startDate && endDate) {
      testFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Charger les tests liés avec le filtre date
    const tests = await TestElegibilite.find(testFilter).lean();

    // Associer chaque test à sa personne
    const testsMap = {};
    tests.forEach((t) => {
      testsMap[t.personne.toString()] = t;
    });

    // Création Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Clients");

    // Colonnes
    worksheet.columns = [
      { header: "prenom", key: "prenom", width: 20 },
      { header: "nom", key: "nom", width: 25 },
      { header: "nom_entreprise", key: "nom_entreprise", width: 30 },
      { header: "type", key: "type", width: 25 },
      { header: "telephone", key: "telephone", width: 20 },
      { header: "zone", key: "zone", width: 25 },
      { header: "statut_juridique", key: "statut_juridique", width: 20 },
      { header: "secteur_activite", key: "secteur_activite", width: 30 },
      { header: "annee_creation", key: "annee_creation", width: 15 },
      { header: "chiffre_affaires", key: "chiffre_affaires", width: 25 },
      { header: "est_eligible", key: "est_eligible", width: 15 },
    ];

    // Style des en-têtes
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // Texte blanc gras
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" }, // Bleu foncé
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Remplir les données : UNE LIGNE PAR TEST
    tests.forEach((test) => {
      const personne = personnes.find(
        (p) => p._id.toString() === test.personne.toString()
      );
      if (!personne) return; // sécurité

      worksheet.addRow({
        prenom: personne.prenom || "N/A",
        nom: personne.nom || "N/A",
        nom_entreprise: personne.nomEntreprise || "N/A",
        type: personne.applicantType || "N/A",
        telephone: personne.telephone || "N/A",
        zone: test.region || "N/A",
        statut_juridique: test.statutJuridique || "N/A",
        secteur_activite: test.secteurTravail || "N/A",
        annee_creation: test.anneeCreation || "N/A",
        chiffre_affaires: test.chiffreAffaires
          ? formatChiffreAffaires(test.chiffreAffaires)
          : "N/A",
        est_eligible: test.programmesEligibles?.length > 0 ? 1 : 0,
      });
    });

    // Appliquer style sur les données (bordures + alignement + N/A + zebra)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // on saute l'entête

      const isEvenRow = rowNumber % 2 === 0; // pour alterner les couleurs
      row.eachCell((cell) => {
        // Bordure et alignement
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Zebra stripe
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: isEvenRow ? "FFF2F2F2" : "FFFFFFFF" }, // gris clair / blanc
        };

        // Style spécial pour N/A
        if (cell.value === "N/A") {
          cell.font = { bold: true, color: { argb: "FF666666" } }; // texte gris foncé gras
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isEvenRow ? "FFF2F2F2" : "FFFFFFFF" }, // deux tons de gris clair pour alterner
          };
        }
      });
    });

    // Fonctions utilitaires
    function formatChiffreAffaires(ca) {
      if (ca.chiffreAffaire2024 !== undefined) {
        if (ca.chiffreAffaire2024 === 0) return "FAUX";
        if (ca.chiffreAffaire2024 > 0 && ca.chiffreAffaire2024 <= 1000000)
          return "entre 0 et 1 Mdhs";
        return ca.chiffreAffaire2024.toString();
      }
      return "";
    }

    // Envoi du fichier
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=Clients.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erreur exportUsers :", err);
    res.status(500).json({ message: "Erreur lors de l'export Excel." });
  }
});

// Obtenir une personne par ID
exports.getUserById = asyncHandler(async (req, res) => {
  const personne = await Personne.findById(req.params.id);
  if (!personne) {
    return res.status(404).json({ message: "Personne non trouvée" });
  }
  // Frontend expects a raw document
  return res.status(200).json(personne);
});

// Mettre à jour une personne
exports.updateUser = asyncHandler(async (req, res) => {
  try {
    const { consultantAssocie, ...rest } = req.body; // consultantAssocie peut être un ID ou un objet {_id, username}
    const consultantAssocieId =
      consultantAssocie && typeof consultantAssocie === "object"
        ? consultantAssocie._id
        : consultantAssocie;

    // Vérifier si l'admin existe
    const admin = await Admin.findById(consultantAssocieId);
    if (!admin) {
      return res.status(404).json({ message: "Consultant (Admin) non trouvé" });
    }

    // Garder l'ancien état pour détecter un changement d'état
    const previous = await Personne.findById(req.params.id).select("etat");

    // Mettre à jour la personne avec l'état + référence de l'admin
    const updated = await Personne.findByIdAndUpdate(
      req.params.id,
      {
        ...rest,
        consultantAssocie: admin._id, // on stocke la référence
      },
      { new: true }
    ).populate("consultantAssocie"); // pour retourner l'admin comme objet peuplé

    if (!updated) {
      return res.status(404).json({ message: "Personne non trouvée" });
    }

    // Émettre un événement temps réel aux admins si l'état a changé
    try {
      const io = req.app.get("io");
      if (io && previous && previous.etat !== updated.etat) {
        io.to("admins").emit("user:updated", {
          _id: updated._id,
          etat: updated.etat,
          consultantAssocie: updated.consultantAssocie
            ? {
                _id: String(updated.consultantAssocie._id),
                username: updated.consultantAssocie.username,
              }
            : null,
          applicantType: updated.applicantType,
          nom: updated.nom,
          prenom: updated.prenom,
          nomEntreprise: updated.nomEntreprise,
          email: updated.email,
          telephone: updated.telephone,
          createdAt: updated.createdAt,
        });
      }
    } catch (emitErr) {
      // Ne pas bloquer la réponse HTTP si l'émission échoue
      console.error("Socket emit error (user:updated):", emitErr);
    }

    // Log activité unifiée si l'état a changé
    try {
      if (previous && previous.etat !== updated.etat) {
        const name =
          updated.applicantType === "morale"
            ? updated.nomEntreprise
            : `${updated.prenom || ""} ${updated.nom || ""}`.trim();
        await logActivity(req, {
          type: "user_updated",
          title: "Utilisateur mis à jour",
          message: `${name || "Utilisateur"} • état: ${previous.etat} → ${
            updated.etat
          }`,
          entity: { kind: "user", id: String(updated._id) },
          meta: {
            from: previous.etat,
            to: updated.etat,
            consultantAssocie: updated.consultantAssocie
              ? {
                  _id: String(updated.consultantAssocie._id),
                  username: updated.consultantAssocie.username,
                }
              : null,
          },
          actor: req.admin || null,
        });
      }
    } catch (e) {
      console.warn("Activity log failed (user_updated):", e?.message || e);
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
  }
});

// Supprimer une personne
/*
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await Personne.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Personne non trouvée" });
    }
    res.json({ message: "Personne supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
  }
};


*/
