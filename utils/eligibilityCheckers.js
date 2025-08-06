const criteresCheckers = {
  secteurTravail: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.secteurTravail),

  statutJuridique: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.statutJuridique),

  applicantType: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.applicantType),

  montantInvestissement: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.montantInvestissement),


  //we will talk about this later
  chiffreAffaire: ({ chiffreAffaireMin, chiffreAffaireMax } = {}, formData) => {
    const years = Object.keys(formData).filter((k) => k.startsWith("chiffreAffaire"));
    const values = years.map((y) => parseFloat(formData[y])).filter((v) => !isNaN(v));
    if (!values.length) return false;
    const maxCA = Math.max(...values);
    return (!chiffreAffaireMin || maxCA >= chiffreAffaireMin) &&
           (!chiffreAffaireMax || maxCA <= chiffreAffaireMax);
  },

  region: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.region),

  anneeCreation: (valeursCriteres, formData) => 
   !valeursCriteres.length || valeursCriteres.includes(formData.anneeCreation),
  
};

module.exports = criteresCheckers;
