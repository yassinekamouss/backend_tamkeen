const criteresCheckers = require("./eligibilityCheckers");

function getPrograms(programs, formData) {
  const eligiblePrograms = [];

  for (const program of programs) {
    const criteres = program.criteres;
    let isEligible = true;

    // Gestion de priorité: si chiffreAffaireParSecteur est défini et non vide, ignorer le champ global chiffreAffaire
    const hasPerSectorCA =
      Array.isArray(criteres.chiffreAffaireParSecteur) &&
      criteres.chiffreAffaireParSecteur.length > 0;

    for (const critere in criteres) {
      // Skip global CA if per-sector is provided
      if (hasPerSectorCA && critere === "chiffreAffaire") continue;

      const valeur = criteres[critere];
      const checker = criteresCheckers[critere];
      if (checker) {
        const result = checker(valeur, formData);
        if (!result) {
          isEligible = false;
          break;
        }
      }
    }

    if (isEligible) {
      eligiblePrograms.push({
        name: program.name,
        link: program.link || "#",
      });
    }
  }

  return eligiblePrograms;
}

module.exports = getPrograms;
