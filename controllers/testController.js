const Personne = require("../models/Personne");
const TestElegibilite = require("../models/TestElegibilite");
const Program = require("../models/Program");
const getPrograms = require("../utils/eligibilityHelpers");
const asyncHandler = require("../utils/asyncHandler");
const api = require("../utils/apiResponse");
const sendEmail = require("../utils/email");

exports.verifierElegibilite = asyncHandler(async (req, res) => {
  try{
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

  if (eligibleProgramNamesAndLinks.length > 0) {
    await sendEmail(
      data.email,
      "Résultat de votre test d'éligibilité",
      "Félicitations ! Vous êtes éligible à certains programmes."
    );
  } else {
    await sendEmail(
      data.email,
      "Résultat de votre test d'éligibilité",
      "Nous sommes désolés, vous n'êtes éligible à aucun programme pour le moment."
    );
  }

  return api.created(res, { programs: eligibleProgramNamesAndLinks });
} catch (err) {
    // 🔹 Gestion spécifique des erreurs de clé dupliquée
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.telephone) {
        return api.error(res, "Ce numéro de téléphone est déjà utilisé par une autre personne physique ou entreprise avec des informations différentes.", 400);
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
