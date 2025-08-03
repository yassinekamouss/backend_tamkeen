const criteresCheckers = require("./eligibilityCheckers");

function isEligible(program, formData) {
  const c = program.criteres;

  for (const critere in criteresCheckers) {
    if (c[critere] !== undefined && !criteresCheckers[critere](c[critere], formData)) {
      return false;
    }
  }

  return true;
}

function getEligiblePrograms(programs, formData) {
  return programs.filter((program) => isEligible(program, formData));
}

module.exports = { getEligiblePrograms };
