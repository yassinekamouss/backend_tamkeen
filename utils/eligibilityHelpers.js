const criteresCheckers = require('./eligibilityCheckers');

function getPrograms(programs, formData) {
  const eligiblePrograms = [];

  for (const program of programs) {
    const criteres = program.criteres;
    let isEligible = true;

    for (const critere in criteres) {
      const valeur = criteres[critere];

      // Vérifie s'il existe une fonction pour ce critère
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
      eligiblePrograms.push(program.name);
    }
  }

  return eligiblePrograms;
}

module.exports = getPrograms;
