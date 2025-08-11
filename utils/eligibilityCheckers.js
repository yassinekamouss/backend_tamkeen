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
  const shouldSkip =
    (chiffreAffaireMin == null) && (chiffreAffaireMax == null);

  if (shouldSkip) return true;

  const valeurs = [
    parseFloat(formData.chiffreAffaire2022),
    parseFloat(formData.chiffreAffaire2023),
    parseFloat(formData.chiffreAffaire2024)
  ].filter(v => !isNaN(v));


  if (!valeurs.length) return false;

  const maxCA = Math.max(...valeurs);

  return (
    (chiffreAffaireMin == null || maxCA >= chiffreAffaireMin) &&
    (chiffreAffaireMax == null || maxCA <= chiffreAffaireMax)
  );
},

age: ({ minAge, maxAge } = {}, formData) => {
  
    const shouldSkip = ((minAge == null) && (maxAge == null)) || formData.applicantType === "morale";
    if (shouldSkip) return true;

    const ageCandidat = parseInt(formData.age, 10);
    if (isNaN(ageCandidat)) return false;

    return (
      (minAge == null || ageCandidat >= minAge) &&
      (maxAge == null || ageCandidat <= maxAge)
    );
  },

  
  sexe: (valeursCriteres, formData) =>{

    if (formData.applicantType === "morale") return true;
   return !valeursCriteres.length || valeursCriteres.includes(formData.sexe);
  },




  region: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.region),

  anneeCreation: (valeursCriteres, formData) => 
   !valeursCriteres.length || valeursCriteres.includes(formData.anneeCreation),

    
};

module.exports = criteresCheckers;
