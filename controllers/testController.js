const Personne = require("../models/Personne");
const TestElegibilite = require("../models/TestElegibilite");
const Program = require("../models/Program");
const getPrograms = require("../utils/eligibilityHelpers");
const asyncHandler = require("../utils/asyncHandler");
const api = require("../utils/apiResponse");
const sendEmail = require("../utils/email");
const { logActivity } = require("../utils/activity");

exports.verifierElegibilite = asyncHandler(async (req, res) => {
  try {
    const data = req.body;

    let personne = await Personne.findOne({ email: data.email });

    if (personne) {
      if (data.applicantType === "physique") {
        const infosIdentiques =
          personne.nom === data.nom &&
          personne.prenom === data.prenom &&
          Number(personne.age) === Number(data.age) &&
          personne.sexe === data.sexe &&
          personne.telephone === data.telephone;

        if (!infosIdentiques) {
          return api.error(
            res,
            "Cet email est déjà utilisé par une autre personne physique avec des informations différentes.",
            400
          );
        }
      } else if (data.applicantType === "morale") {
        const infosIdentiques =
          personne.nomEntreprise === data.nomEntreprise &&
          personne.email === data.email &&
          personne.telephone === data.telephone;

        if (!infosIdentiques) {
          return api.error(
            res,
            "Cet email est déjà utilisé par une autre entreprise avec des informations différentes.",
            400
          );
        }
      } else {
        return api.error(res, "Type de demandeur inconnu ou non valide.", 400);
      }
    } else {
      // Créer la personne si elle n'existe pas
      personne = await Personne.create({
        applicantType: data.applicantType,
        nom: data.nom,
        prenom: data.prenom,
        age: data.age,
        sexe: data.sexe,
        nomEntreprise: data.nomEntreprise,
        email: data.email,
        telephone: data.telephone,
      });
    }

    // Récupérer tous les programmes actifs
    const activePrograms = await Program.find({ isActive: true });

    // Trouver les programmes éligibles
    const eligibleProgramNamesAndLinks = getPrograms(activePrograms, data);

    // Créer un nouveau test pour cette personne
    const created = await TestElegibilite.create({
      personne: personne._id,
      secteurTravail: data.secteurTravail,
      region: data.region,
      statutJuridique: data.statutJuridique,
      anneeCreation: data.anneeCreation,
      chiffreAffaires: {
        chiffreAffaire2022: parseFloat(data.chiffreAffaire2022) || undefined,
        chiffreAffaire2023: parseFloat(data.chiffreAffaire2023) || undefined,
        chiffreAffaire2024: parseFloat(data.chiffreAffaire2024) || undefined,
      },
      montantInvestissement: data.montantInvestissement,
      programmesEligibles: eligibleProgramNamesAndLinks.map((p) => p.name),
    });

    // Émettre l'événement aux admins connectés (si Socket.IO est initialisé)
    try {
      const io = req.app.get("io");
      if (io) {
        io.to("admins").emit("form:submitted", {
          id: String(created._id),
          createdAt: created.createdAt,
          applicant: {
            id: String(personne._id),
            type: personne.applicantType,
            name:
              personne.applicantType === "morale"
                ? personne.nomEntreprise
                : `${personne.nom || ""} ${personne.prenom || ""}`.trim(),
            email: personne.email,
          },
          formType: "eligibility",
          region: created.region,
          eligible: eligibleProgramNamesAndLinks.length > 0,
          summary: eligibleProgramNamesAndLinks.length
            ? `${eligibleProgramNamesAndLinks.length} programme(s) éligible(s)`
            : "Aucun programme éligible",
        });
      }
    } catch (e) {
      console.warn("Socket emit failed:", e?.message || e);
    }

    // Logger l'activité unifiée
    try {
      const applicantName =
        personne.applicantType === "morale"
          ? personne.nomEntreprise
          : `${personne.nom || ""} ${personne.prenom || ""}`.trim();
      await logActivity(req, {
        type: "test_submitted",
        title: "Nouveau test d'éligibilité",
        message: `${applicantName || "Utilisateur"} • ${created.region} • ${
          eligibleProgramNamesAndLinks.length
            ? `${eligibleProgramNamesAndLinks.length} programme(s) éligible(s)`
            : "Aucun programme éligible"
        }`,
        entity: { kind: "test", id: String(created._id) },
        meta: {
          region: created.region,
          eligible: eligibleProgramNamesAndLinks.length > 0,
          applicant: {
            id: String(personne._id),
            type: personne.applicantType,
            name: applicantName,
            email: personne.email,
          },
        },
        actor: null,
      });
    } catch (e) {
      console.warn("Activity log failed (test_submitted):", e?.message || e);
    }

      //  Gérer les noms en fonction du type
      let blocNom;
    if (personne.applicantType === "morale") {
      blocNom = `<li><strong>Nom de l'entreprise :</strong> ${personne.nomEntreprise || "—"}</li>`;
    } else {
      blocNom = `
        <li><strong>Nom :</strong> ${personne.nom || "—"}</li>
        <li><strong>Prénom :</strong> ${personne.prenom || "—"}</li>
      `;
    }

      //  Affichage clair des chiffres d'affaires
      let chiffresAffairesTxt = "";
      const ca = created.chiffreAffaires || {};
      if (ca.chiffreAffaire2022 || ca.chiffreAffaire2023 || ca.chiffreAffaire2024) {
        chiffresAffairesTxt +=
          `2022 : ${ca.chiffreAffaire2022 ?? "—"} DH\n` +
          `2023 : ${ca.chiffreAffaire2023 ?? "—"} DH\n` +
          `2024 : ${ca.chiffreAffaire2024 ?? "—"} DH`;
      } else {
        chiffresAffairesTxt = "Non renseigné";
      }

      const emailSubject = "Résultat de votre test d’éligibilité";

      // Email si éligible
const emailEligible = `
  <div style="background:#f4f4f4;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;
                padding:30px 40px;box-shadow:0 4px 12px rgba(0,0,0,0.05);
                color:#333;line-height:1.6;font-size:16px;">
      
      <h2 style="color:#4CAF50;text-align:center;margin-top:0;margin-bottom:25px;
                 font-size:24px;font-weight:bold;">
        ✅ Résultat de votre test d’éligibilité
      </h2>

      <p>Bonjour,</p>

      <p>Nous avons le plaisir de vous informer que vous êtes
         <strong style="color:#4CAF50;">éligible</strong> aux programmes de subvention proposés.</p>

      <h3 style="margin-top:30px;color:#4CAF50;">Récapitulatif de vos données :</h3>
      <ul style="padding-left:20px;margin-top:15px;">
        ${blocNom}
        <li><strong>Téléphone :</strong> ${personne.telephone || "—"}</li>
        <li><strong>Email :</strong> ${personne.email || "—"}</li>
        <li><strong>Ville :</strong> ${created.region || "—"}</li>
        <li><strong>Statut Juridique :</strong> ${created.statutJuridique || "—"}</li>
        <li><strong>Secteur d’activité :</strong> ${created.secteurTravail || "—"}</li>
        <li><strong>Date de création :</strong> ${created.anneeCreation || "—"}</li>
        <li><strong>Chiffres d'affaires :</strong><br>${chiffresAffairesTxt.replace(/\n/g, "<br>")}</li>
        <li><strong>Montant d'investissement :</strong> ${created.montantInvestissement || "—"}</li>
      </ul>

      <p style="margin-top:20px;">Notre équipe prendra contact avec vous prochainement pour :</p>
      <ul style="padding-left:20px;">
        <li>vous présenter les programmes adaptés,</li>
        <li>vous accompagner dans les démarches,</li>
        <li>répondre à vos questions.</li>
      </ul>

      <p>En attendant, préparez les documents relatifs à votre projet/entreprise
         afin de faciliter la suite du processus.</p>

      <p>Nous restons à votre disposition pour tout complément d’information.</p>

      <p style="margin-top:30px;">Bien cordialement,</p>

      <div style="text-align:center;margin-top:30px;">
        <img src="${process.env.FRONTEND_ORIGIN}/tamkeen.png" alt="Tamkeen Center"
             width="150" style="display:block;margin:0 auto 10px;" />
        <p style="font-weight:bold;font-size:16px;margin:0;">L’équipe Tamkeen</p>
      </div>

    </div>
  </div>
`;


      //  Email si NON éligible
const emailNonEligible = `
  <div style="background:#f4f4f4;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;
                padding:30px 40px;box-shadow:0 4px 12px rgba(0,0,0,0.05);
                color:#333;line-height:1.6;font-size:16px;">
      
      <h2 style="color:#E53935;text-align:center;margin-top:0;margin-bottom:25px;
                 font-size:24px;font-weight:bold;">
        ❌ Résultat de votre test d’éligibilité
      </h2>

      <p>Bonjour,</p>

      <p>Suite à votre test d’éligibilité, nous vous informons que vous ne répondez pas actuellement
         aux critères requis pour accéder aux programmes de subvention proposés.</p>

      <h3 style="margin-top:30px;color:#E53935;">Récapitulatif de vos données :</h3>
      <ul style="padding-left:20px;margin-top:15px;">
        ${blocNom}
        <li><strong>Téléphone :</strong> ${personne.telephone || "—"}</li>
        <li><strong>Email :</strong> ${personne.email || "—"}</li>
        <li><strong>Ville :</strong> ${created.region || "—"}</li>
        <li><strong>Statut Juridique :</strong> ${created.statutJuridique || "—"}</li>
        <li><strong>Secteur d’activité :</strong> ${created.secteurTravail || "—"}</li>
        <li><strong>Date de création :</strong> ${created.anneeCreation || "—"}</li>
        <li><strong>Chiffres d'affaires :</strong><br>${chiffresAffairesTxt.replace(/\n/g, "<br>")}</li>
        <li><strong>Montant d'investissement :</strong> ${created.montantInvestissement || "—"}</li>
      </ul>

      <p style="margin-top:20px;">Cependant, d’autres solutions et dispositifs d’accompagnement peuvent
         être adaptés à votre profil. Notre équipe reste à votre disposition pour vous orienter
         vers les alternatives les plus pertinentes.</p>

      <p>N’hésitez pas à nous contacter pour toute question ou besoin d’accompagnement.</p>

      <p style="margin-top:30px;">Bien cordialement,</p>

      <div style="text-align:center;margin-top:30px;">
        <img src="${process.env.FRONTEND_ORIGIN}/tamkeen.png" alt="Tamkeen Center"
             width="150" style="display:block;margin:0 auto 10px;" />
        <p style="font-weight:bold;font-size:16px;margin:0;">L’équipe Tamkeen</p>
      </div>

    </div>
  </div>
`;


      //  Envoi
      if (eligibleProgramNamesAndLinks.length > 0) {
        await sendEmail(data.email, emailSubject, emailEligible);
      } else {
        await sendEmail(data.email, emailSubject, emailNonEligible);
      }



    return api.created(res, { programs: eligibleProgramNamesAndLinks });
  } catch (err) {
    //  Gestion spécifique des erreurs de clé dupliquée
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.telephone) {
        return api.error(
          res,
          "Ce numéro de téléphone est déjà utilisé par une autre personne physique ou entreprise avec des informations différentes.",
          400
        );
      }
    }

    console.error(err);
    return api.error(res, "Erreur lors de la vérification d'éligibilité", 500);
  }
});

// Définitions des fonctions
exports.getTestsByPersonneId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tests = await TestElegibilite.find({ personne: id })
    .populate("personne")
    .sort({ createdAt: -1 });

  if (!tests || tests.length === 0) {
    return api.error(res, "Aucun test trouvé pour cette personne.", 404);
  }

  return api.ok(res, { tests });
});

// Liste paginée de tous les tests avec filtres simples
// Query params: q, applicantType, eligible (true|false), region, page, limit
exports.getAllTests = asyncHandler(async (req, res) => {
  const {
    q,
    applicantType,
    eligible,
    region,
    page = 1,
    limit = 20,
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const match = {};
  if (region) match.region = region;

  let eligibilityExpr = null;
  if (eligible === "true") {
    eligibilityExpr = { $gt: [{ $size: "$programmesEligibles" }, 0] };
  } else if (eligible === "false") {
    eligibilityExpr = { $eq: [{ $size: "$programmesEligibles" }, 0] };
  }

  const textOr = [];
  if (q && typeof q === "string" && q.trim().length > 0) {
    const regex = new RegExp(q.trim(), "i");
    textOr.push(
      { "personne.nom": regex },
      { "personne.prenom": regex },
      { "personne.email": regex }
    );
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "personnes",
        localField: "personne",
        foreignField: "_id",
        as: "personne",
      },
    },
    { $unwind: "$personne" },
  ];

  const matchSecond = {};
  if (applicantType) matchSecond["personne.applicantType"] = applicantType;
  if (textOr.length > 0) matchSecond.$or = textOr;
  if (eligibilityExpr) matchSecond.$expr = eligibilityExpr;
  if (Object.keys(matchSecond).length > 0)
    pipeline.push({ $match: matchSecond });

  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({
    $facet: {
      data: [{ $skip: skip }, { $limit: limitNum }],
      total: [{ $count: "count" }],
    },
  });

  const agg = await TestElegibilite.aggregate(pipeline);
  const data = agg?.[0]?.data || [];
  const total = agg?.[0]?.total?.[0]?.count || 0;

  return api.ok(res, {
    tests: data,
    page: pageNum,
    limit: limitNum,
    total,
    hasMore: skip + data.length < total,
  });
});
