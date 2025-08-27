// Utilitaires d'éligibilité améliorés pour le chatbot
const Program = require("../models/Program");

/**
 * Normalise une valeur pour la comparaison
 */
function normalizeValue(value) {
  if (!value) return null;
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[ç]/g, "c")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Vérifie si un secteur d'activité correspond aux critères du programme
 */
function checkSecteurActivite(userSecteur, programSecteurs) {
  if (!programSecteurs || programSecteurs.length === 0) return true; // Aucune restriction

  const normalizedUserSecteur = normalizeValue(userSecteur);

  return programSecteurs.some((secteur) => {
    const normalizedSecteur = normalizeValue(secteur);

    // Correspondance exacte
    if (normalizedUserSecteur === normalizedSecteur) return true;

    // Correspondance partielle
    if (normalizedUserSecteur && normalizedSecteur) {
      if (
        normalizedUserSecteur.includes(normalizedSecteur) ||
        normalizedSecteur.includes(normalizedUserSecteur)
      )
        return true;
    }

    // Cas spéciaux pour le tourisme
    if (
      normalizedSecteur === "activitetouristique" ||
      normalizedSecteur === "activite-touristique"
    ) {
      return [
        "tourisme",
        "touristique",
        "hotellerie",
        "restauration",
        "voyage",
        "loisir",
      ].some((keyword) => normalizedUserSecteur.includes(keyword));
    }

    return false;
  });
}

/**
 * Vérifie si le type d'applicant correspond
 */
function checkTypeApplicant(userType, programTypes) {
  if (!programTypes || programTypes.length === 0) return true; // Aucune restriction

  const normalizedUserType = normalizeValue(userType);

  return programTypes.some((type) => {
    const normalizedType = normalizeValue(type);
    return (
      normalizedUserType === normalizedType ||
      (normalizedUserType === "physique" &&
        normalizedType === "personne-physique") ||
      (normalizedUserType === "morale" && normalizedType === "personne-morale")
    );
  });
}

/**
 * Vérifie si le statut juridique correspond
 */
function checkStatutJuridique(userStatut, programStatuts, typeApplicant) {
  if (typeApplicant !== "morale") return true; // Pas applicable pour les personnes physiques
  if (!programStatuts || programStatuts.length === 0) return true; // Aucune restriction
  if (!userStatut) return false; // Statut requis mais non fourni

  const normalizedUserStatut = normalizeValue(userStatut);

  return programStatuts.some((statut) => {
    const normalizedStatut = normalizeValue(statut);

    // Correspondance exacte
    if (normalizedUserStatut === normalizedStatut) return true;

    // Correspondances communes
    const mappings = {
      sarl: ["sarl", "sarlu", "societe-a-responsabilite-limitee"],
      sa: ["sa", "societe-anonyme"],
      sas: ["sas", "societe-par-actions-simplifiee", "societe-sas"],
      eurl: ["eurl", "sarlu", "entreprise-unipersonnelle"],
      "auto-entrepreneur": ["auto-entrepreneur", "ae", "micro-entreprise"],
    };

    for (const [key, variations] of Object.entries(mappings)) {
      if (
        (normalizedUserStatut === key ||
          variations.includes(normalizedUserStatut)) &&
        (normalizedStatut === key || variations.includes(normalizedStatut))
      ) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Vérifie si la région correspond aux critères du programme
 */
function checkRegion(userRegion, programRegions) {
  if (!programRegions || programRegions.length === 0) return true; // Aucune restriction

  const normalizedUserRegion = normalizeValue(userRegion);

  return programRegions.some((region) => {
    const normalizedRegion = normalizeValue(region);
    return (
      normalizedUserRegion === normalizedRegion ||
      normalizedUserRegion.includes(normalizedRegion) ||
      normalizedRegion.includes(normalizedUserRegion)
    );
  });
}

/**
 * Convertit une description de montant en valeur numérique pour comparaison
 */
function parseMontantInvestissement(montantStr) {
  if (!montantStr) return null;

  const normalized = normalizeValue(montantStr);

  // Mappings des abréviations
  const montantMappings = {
    "moins-1m": { min: 0, max: 999999 },
    "moins-de-1m": { min: 0, max: 999999 },
    "<1m": { min: 0, max: 999999 },
    "1m-5m": { min: 1000000, max: 5000000 },
    "1m-50m": { min: 1000000, max: 50000000 },
    "5m-50m": { min: 5000000, max: 50000000 },
    "plus-50m": { min: 50000000, max: Infinity },
    "plus-de-50m": { min: 50000000, max: Infinity },
    ">50m": { min: 50000000, max: Infinity },
  };

  return montantMappings[normalized] || null;
}

/**
 * Vérifie si le montant d'investissement correspond
 */
function checkMontantInvestissement(userMontant, programMontants) {
  if (!programMontants || programMontants.length === 0) return true; // Aucune restriction

  const userRange = parseMontantInvestissement(userMontant);
  if (!userRange) return false;

  return programMontants.some((montant) => {
    const programRange = parseMontantInvestissement(montant);
    if (!programRange) return false;

    // Vérification de chevauchement des intervalles
    return !(
      userRange.max < programRange.min || userRange.min > programRange.max
    );
  });
}

/**
 * Vérifie si le chiffre d'affaires correspond
 */
function checkChiffreAffaires(userCA, programCA) {
  if (!programCA) return true; // Aucune restriction

  const { chiffreAffaireMin, chiffreAffaireMax } = programCA;

  // Si pas de CA minimum requis et pas de CA fourni, c'est OK
  if (!chiffreAffaireMin && !userCA) return true;

  // Si CA minimum requis mais pas de CA fourni
  if (chiffreAffaireMin && !userCA) return false;

  // Vérifications des limites
  if (chiffreAffaireMin && userCA < chiffreAffaireMin) return false;
  if (chiffreAffaireMax && userCA > chiffreAffaireMax) return false;

  return true;
}

/**
 * Fonction principale de vérification d'éligibilité pour le chatbot
 */
async function checkEligibilityForChat(criteresUtilisateur) {
  try {
    const {
      secteurActivite,
      typeApplicant,
      region,
      statutJuridique,
      montantInvestissement,
      chiffreAffaires,
    } = criteresUtilisateur;

    // Récupération des programmes actifs
    const programs = await Program.find({ isActive: true })
      .select("name description DateDebut DateFin criteres link")
      .lean();

    const eligiblePrograms = [];
    const rejectionReasons = [];

    for (const program of programs) {
      const criteres = program.criteres || {};
      let isEligible = true;
      const reasons = [];

      // Vérification secteur d'activité
      if (!checkSecteurActivite(secteurActivite, criteres.secteurActivite)) {
        isEligible = false;
        reasons.push(
          `Secteur d'activité non accepté (requis: ${
            criteres.secteurActivite?.join(", ") || "Tous"
          })`
        );
      }

      // Vérification type d'applicant
      if (!checkTypeApplicant(typeApplicant, criteres.applicantType)) {
        isEligible = false;
        reasons.push(
          `Type de demandeur non accepté (requis: ${
            criteres.applicantType?.join(", ") || "Tous"
          })`
        );
      }

      // Vérification région
      if (!checkRegion(region, criteres.region)) {
        isEligible = false;
        reasons.push(
          `Région non acceptée (requis: ${
            criteres.region?.join(", ") || "Toutes régions"
          })`
        );
      }

      // Vérification statut juridique
      if (
        !checkStatutJuridique(
          statutJuridique,
          criteres.statutJuridique,
          typeApplicant
        )
      ) {
        isEligible = false;
        reasons.push(
          `Statut juridique non accepté (requis: ${
            criteres.statutJuridique?.join(", ") || "Tous"
          })`
        );
      }

      // Vérification montant d'investissement
      if (
        !checkMontantInvestissement(
          montantInvestissement,
          criteres.montantInvestissement
        )
      ) {
        isEligible = false;
        reasons.push(
          `Montant d'investissement non accepté (requis: ${
            criteres.montantInvestissement?.join(", ") || "Tous"
          })`
        );
      }

      // Vérification chiffre d'affaires
      if (!checkChiffreAffaires(chiffreAffaires, criteres.chiffreAffaire)) {
        isEligible = false;
        const { chiffreAffaireMin, chiffreAffaireMax } =
          criteres.chiffreAffaire || {};
        let caReq = "Aucune restriction";
        if (chiffreAffaireMin || chiffreAffaireMax) {
          caReq = `${chiffreAffaireMin ? `Min: ${chiffreAffaireMin} MAD` : ""}${
            chiffreAffaireMin && chiffreAffaireMax ? ", " : ""
          }${chiffreAffaireMax ? `Max: ${chiffreAffaireMax} MAD` : ""}`;
        }
        reasons.push(`Chiffre d'affaires non conforme (requis: ${caReq})`);
      }

      if (isEligible) {
        eligiblePrograms.push({
          id: program._id,
          nom: program.name,
          description: program.description,
          dateDebut: program.DateDebut,
          dateFin: program.DateFin,
          link: program.link,
        });
      } else {
        rejectionReasons.push({
          programme: program.name,
          raisons: reasons,
        });
      }
    }

    return {
      eligible: eligiblePrograms.length > 0,
      programmes: eligiblePrograms,
      totalProgrammes: eligiblePrograms.length,
      totalProgrammesDisponibles: programs.length,
      raisonsPourRejetes: rejectionReasons,
      recommandation:
        eligiblePrograms.length > 0
          ? "Remplissez notre formulaire complet pour qu'un consultant vous contacte dans 24h et vous accompagne gratuitement dans vos démarches."
          : "Remplissez quand même notre formulaire - de nouveaux programmes arrivent régulièrement et un consultant pourra vous conseiller d'autres solutions adaptées à votre profil.",
    };
  } catch (error) {
    console.error("Erreur lors de la vérification d'éligibilité:", error);
    return {
      eligible: false,
      programmes: [],
      totalProgrammes: 0,
      error: "Erreur technique lors de la vérification",
      recommandation:
        "Erreur technique. Remplissez notre formulaire - un consultant vous aidera à clarifier votre situation.",
    };
  }
}

/**
 * Récupère les programmes avec un résumé optimisé pour le chatbot
 */
async function getProgramsListForChat(activeOnly = true) {
  try {
    const query = activeOnly ? { isActive: true } : {};
    const programs = await Program.find(query)
      .select("name description isActive DateDebut DateFin criteres link")
      .sort({ isActive: -1, DateDebut: -1 })
      .lean();

    return programs.map((program) => {
      const criteres = program.criteres || {};

      return {
        nom: program.name,
        description: program.description,
        actif: program.isActive,
        dateDebut: program.DateDebut,
        dateFin: program.DateFin,
        link: program.link,
        criteresResume: {
          secteursAcceptes:
            criteres.secteurActivite?.length > 0
              ? criteres.secteurActivite.join(", ")
              : "Tous secteurs acceptés",
          typesApplicants:
            criteres.applicantType?.length > 0
              ? criteres.applicantType.join(", ")
              : "Tous types acceptés",
          montantsInvestissement:
            criteres.montantInvestissement?.length > 0
              ? criteres.montantInvestissement.join(", ")
              : "Tous montants acceptés",
          statutsJuridiques:
            criteres.statutJuridique?.length > 0
              ? criteres.statutJuridique.join(", ")
              : "Tous statuts acceptés",
        },
      };
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des programmes:", error);
    return [];
  }
}

module.exports = {
  checkEligibilityForChat,
  getProgramsListForChat,
  normalizeValue,
  checkSecteurActivite,
  checkTypeApplicant,
  checkRegion,
  checkStatutJuridique,
  checkMontantInvestissement,
  checkChiffreAffaires,
};
