const criteresCheckers = {
  secteurActivite: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.secteurTravail),

  statutJuridique: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.statutJuridique),

  applicantType: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.applicantType),

  montantInvestissement: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.montantInvestissement),


chiffreAffaire: ({ chiffreAffaireMin, chiffreAffaireMax } = {}, formData) => {
  console.log(chiffreAffaireMin, chiffreAffaireMax, formData);
  const valeurs = [
    parseFloat(formData.chiffreAffaire2022),
    parseFloat(formData.chiffreAffaire2023),
    parseFloat(formData.chiffreAffaire2024)
  ].filter(v => !isNaN(v));

  if (!valeurs.length) return false;

  const maxCA = Math.max(...valeurs);

  return (!chiffreAffaireMin || maxCA >= chiffreAffaireMin) &&
         (!chiffreAffaireMax || maxCA <= chiffreAffaireMax);
},



  region: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.region),

  anneeCreation: (valeursCriteres, formData) => 
   !valeursCriteres.length || valeursCriteres.includes(formData.anneeCreation),
  
};

module.exports = criteresCheckers;
