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

    // Important: autoriser le même email sur des types différents
    let personne = await Personne.findOne({
      email: data.email,
      applicantType: data.applicantType,
    });

    if (personne) {
      if (data.applicantType === "physique") {
        const infosIdentiques =
          personne.nom === data.nom &&
          personne.prenom === data.prenom &&
          Number(personne.age) === Number(data.age) &&
          personne.sexe === data.sexe;

        if (!infosIdentiques) {
          return api.error(
            res,
            "Cet email est déjà utilisé par une autre personne physique avec des informations différentes (hors numéro).",
            400
          );
        }
      } else if (data.applicantType === "morale") {
        const infosIdentiques =
          personne.nomEntreprise === data.nomEntreprise &&
          personne.email === data.email;

        if (!infosIdentiques) {
          return api.error(
            res,
            "Cet email est déjà utilisé par une autre entreprise avec des informations différentes (hors numéro).",
            400
          );
        }
      } else {
        return api.error(res, "Type de demandeur inconnu ou non valide.", 400);
      }

      // Mettre à jour la liste des téléphones si un nouveau numéro est fourni
      if (data.telephone) {
        const currentPhones = Array.isArray(personne.telephones)
          ? personne.telephones
          : [];
        if (!currentPhones.includes(data.telephone)) {
          currentPhones.push(data.telephone);
          personne.telephones = currentPhones;
          // Sanitize etat for legacy documents that might have an empty string
          const allowedEtats = ["En traitement", "En attente", "Terminé"];
          if (!allowedEtats.includes(personne.etat)) {
            personne.etat = "En attente";
          }
          await personne.save();
        }
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
        telephones: data.telephone ? [data.telephone] : [],
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
      blocNom = `<li><strong>Nom de l'entreprise :</strong> ${
        personne.nomEntreprise || "—"
      }</li>`;
    } else {
      blocNom = `
        <li><strong>Nom :</strong> ${personne.nom || "—"}</li>
        <li><strong>Prénom :</strong> ${personne.prenom || "—"}</li>
      `;
    }

    //  Affichage clair des chiffres d'affaires
    let chiffresAffairesTxt = "";
    const ca = created.chiffreAffaires || {};
    if (
      ca.chiffreAffaire2022 ||
      ca.chiffreAffaire2023 ||
      ca.chiffreAffaire2024
    ) {
      chiffresAffairesTxt +=
        `2022 : ${ca.chiffreAffaire2022 ?? "—"} DH\n` +
        `2023 : ${ca.chiffreAffaire2023 ?? "—"} DH\n` +
        `2024 : ${ca.chiffreAffaire2024 ?? "—"} DH`;
    } else {
      chiffresAffairesTxt = "Non renseigné";
    }

    const emailSubject = "Résultat de votre test d’éligibilité";
    const emailEligible = `
  <div style="background:#f5f5f5;padding:40px 0;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;
                padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.06);
                color:#2d3748;line-height:1.7;font-size:15px;">
      
      <div style="text-align:center;margin-bottom:30px;">
        <h2 style="color:#2f855a;margin:0;font-size:26px;font-weight:600;">
          ✅ Résultat de votre test d'éligibilité
        </h2>
        <div style="width:60px;height:3px;background:#2f855a;margin:16px auto;border-radius:2px;"></div>
      </div>

      <p>Bonjour,</p>

      <p>Nous avons le plaisir de vous informer que vous êtes
         <strong style="color:#2f855a;background:#f0fff4;padding:3px 8px;border-radius:4px;">éligible</strong> 
         aux programmes de subvention proposés.</p>

      <h3 style="margin-top:28px;color:#2f855a;font-size:18px;font-weight:600;">Récapitulatif de vos données :</h3>
      <div style="background:#fafafa;border-radius:8px;padding:18px;margin:16px 0;border:1px solid #e5e7eb;">
        <ul style="padding-left:18px;margin:0;list-style-type:none;">
          ${blocNom}
          <li style="margin-bottom:6px;"><strong>Téléphone :</strong> ${
            data.telephone || personne.telephones?.[0] || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Email :</strong> ${
            personne.email || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Ville :</strong> ${
            created.region || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Statut Juridique :</strong> ${
            created.statutJuridique || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Secteur d'activité :</strong> ${
            created.secteurTravail || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Date de création :</strong> ${
            created.anneeCreation || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Chiffres d'affaires :</strong><br>${chiffresAffairesTxt.replace(
            /\n/g,
            "<br>"
          )}</li>
          <li><strong>Montant d'investissement :</strong> ${
            created.montantInvestissement || "—"
          }</li>
        </ul>
      </div>

      <p style="margin-top:18px;">Notre équipe prendra contact avec vous prochainement pour :</p>
      <ul style="padding-left:18px;margin:8px 0;">
        <li>vous présenter les programmes adaptés,</li>
        <li>vous accompagner dans les démarches,</li>
        <li>répondre à vos questions.</li>
      </ul>

      <p>En attendant, préparez les documents relatifs à votre projet/entreprise afin de faciliter la suite du processus.</p>

      <p>Nous restons à votre disposition pour tout complément d'information.</p>

      <p style="margin-top:24px;">Bien cordialement,</p>

      <div style="border-top:1px solid #e2e8f0;margin-top:32px;padding-top:24px;text-align:center;">
        <img src="${
          process.env.FRONTEND_ORIGIN
        }/tamkeen.png" alt="Tamkeen Center"
             width="120" style="display:block;margin:0 auto 14px;" />
        <p style="font-weight:600;font-size:16px;margin:0 0 4px;color:#2d3748;">L'équipe Tamkeen</p>
        <p style="font-size:13px;color:#6b7280;margin:0 0 12px;">Centre d'accompagnement & développement</p>
        
        <div style="margin-top:12px;">
          <a href="https://www.facebook.com/share/16W7DLrytf/?mibextid=wwXIfr" style="display:inline-block;margin:0 6px;" target="_blank">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="26" style="border-radius:50%;background:#f3f4f6;padding:6px;"/>
          </a>
          <a href="https://www.linkedin.com/company/tamkeen-center/" style="display:inline-block;margin:0 6px;" target="_blank">
            <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" width="26" style="border-radius:50%;background:#f3f4f6;padding:6px;"/>
          </a>
          <a href="https://www.instagram.com/tamkeen_center_consulting?igsh=NjllczJzNDRsdWRq" style="display:inline-block;margin:0 6px;" target="_blank">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="26" style="border-radius:50%;background:#f3f4f6;padding:6px;"/>
          </a>
        </div>
      </div>

    </div>
  </div>
`;

    const emailNonEligible = `
  <div style="background:#f5f5f5;padding:40px 0;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;
                padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.06);
                color:#2d3748;line-height:1.7;font-size:15px;">
      
      <div style="text-align:center;margin-bottom:30px;">
        <h2 style="color:#c53030;margin:0;font-size:26px;font-weight:600;">
          ❌ Résultat de votre test d'éligibilité
        </h2>
        <div style="width:60px;height:3px;background:#c53030;margin:16px auto;border-radius:2px;"></div>
      </div>

      <p>Bonjour,</p>

      <p>Suite à votre test d'éligibilité, nous vous informons que vous ne répondez pas actuellement
         aux critères requis pour accéder aux programmes de subvention proposés.</p>

      <h3 style="margin-top:28px;color:#c53030;font-size:18px;font-weight:600;">Récapitulatif de vos données :</h3>
      <div style="background:#fafafa;border-radius:8px;padding:18px;margin:16px 0;border:1px solid #e5e7eb;">
        <ul style="padding-left:18px;margin:0;list-style-type:none;">
          ${blocNom}
          <li style="margin-bottom:6px;"><strong>Téléphone :</strong> ${
            data.telephone || personne.telephones?.[0] || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Email :</strong> ${
            personne.email || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Ville :</strong> ${
            created.region || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Statut Juridique :</strong> ${
            created.statutJuridique || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Secteur d'activité :</strong> ${
            created.secteurTravail || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Date de création :</strong> ${
            created.anneeCreation || "—"
          }</li>
          <li style="margin-bottom:6px;"><strong>Chiffres d'affaires :</strong><br>${chiffresAffairesTxt.replace(
            /\n/g,
            "<br>"
          )}</li>
          <li><strong>Montant d'investissement :</strong> ${
            created.montantInvestissement || "—"
          }</li>
        </ul>
      </div>

      <p style="margin-top:18px;">Cependant, d'autres solutions et dispositifs d'accompagnement peuvent
         être adaptés à votre profil. Notre équipe reste à votre disposition pour vous orienter
         vers les alternatives les plus pertinentes.</p>

      <p>N'hésitez pas à nous contacter pour toute question ou besoin d'accompagnement.</p>

      <p style="margin-top:24px;">Bien cordialement,</p>

      <div style="border-top:1px solid #e2e8f0;margin-top:32px;padding-top:24px;text-align:center;">
        <img src="${
          process.env.FRONTEND_ORIGIN
        }/tamkeen.png" alt="Tamkeen Center"
             width="120" style="display:block;margin:0 auto 14px;" />
        <p style="font-weight:600;font-size:16px;margin:0 0 4px;color:#2d3748;">L'équipe Tamkeen</p>
        <p style="font-size:13px;color:#6b7280;margin:0 0 12px;">Centre d'accompagnement & développement</p>
        
        <div style="margin-top:12px;">
          <a href="https://www.facebook.com/share/16W7DLrytf/?mibextid=wwXIfr" style="display:inline-block;margin:0 6px;" target="_blank">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="26" style="border-radius:50%;background:#f3f4f6;padding:6px;"/>
          </a>
          <a href="https://www.linkedin.com/company/tamkeen-center/" style="display:inline-block;margin:0 6px;" target="_blank">
            <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" width="26" style="border-radius:50%;background:#f3f4f6;padding:6px;"/>
          </a>
          <a href="https://www.instagram.com/tamkeen_center_consulting?igsh=NjllczJzNDRsdWRq" style="display:inline-block;margin:0 6px;" target="_blank">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="26" style="border-radius:50%;background:#f3f4f6;padding:6px;"/>
          </a>
        </div>
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

    return api.created(res, {
      programs: eligibleProgramNamesAndLinks,
      testId: created._id,
    });
  } catch (err) {
    //  Gestion spécifique des erreurs de clé dupliquée
    if (err.code === 11000) {
      // Ancien index unique éventuel sur `telephone` (legacy)
      if (
        err.keyPattern &&
        (err.keyPattern.telephone || err.keyPattern.telephones)
      ) {
        return api.error(
          res,
          "Conflit de numéro de téléphone existant. Veuillez réessayer ou contacter le support.",
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

exports.updateContactPreference = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const test = await TestElegibilite.findByIdAndUpdate(
      id,
      { wannaBeContacted: true },
      { new: true } // retourne l'objet mis à jour
    );

    if (!test) {
      return res.status(404).json({ message: "Test non trouvé" });
    }

    res.json({ success: true, test });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Nouveau: récupérer les numéros existants par email (tous types confondus)
exports.getPhonesByEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    return api.error(res, "Paramètre email manquant", 400);
  }
  const personnes = await Personne.find({ email }).lean();
  if (!personnes || personnes.length === 0) {
    return api.ok(res, { found: false, telephones: [] });
  }
  const set = new Set();
  for (const p of personnes) {
    const arr = Array.isArray(p.telephones)
      ? p.telephones
      : p.telephone
      ? [p.telephone]
      : [];
    for (const ph of arr) set.add(ph);
  }
  return api.ok(res, { found: true, telephones: Array.from(set) });
});
