const criteresCheckers = require("./eligibilityCheckers");

function getPrograms(programs, formData) {
  const eligiblePrograms = [];

  for (const program of programs) {
    const criteres = program.criteres;
    let isEligible = true;

   
  for (const critere in criteres) {
    if (critere === "chiffreAffaire") continue;
  const valeur = criteres[critere];
  const checker = criteresCheckers[critere];

  if (checker) {
    let result;
    if (critere === "chiffreAffaireParSecteur") {
      result = checker(valeur, formData, criteres.chiffreAffaire);
    } else {
      result = checker(valeur, formData);
    }

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
