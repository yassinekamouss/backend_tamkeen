const criteresCheckers = {
  secteurActivite: (valeursCriteres, formData) =>
    !valeursCriteres.length ||
    valeursCriteres.includes(formData.secteurTravail),

  statutJuridique: (valeursCriteres, formData) =>
    !valeursCriteres.length ||
    valeursCriteres.includes(formData.statutJuridique),

  applicantType: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.applicantType),

  montantInvestissement: (valeursCriteres, formData) =>
    !valeursCriteres.length ||
    valeursCriteres.includes(formData.montantInvestissement),

  // Ancien: chiffre d'affaires global (compatibilité)
  chiffreAffaire: ({ chiffreAffaireMin, chiffreAffaireMax } = {}, formData) => {
    const shouldSkip = chiffreAffaireMin == null && chiffreAffaireMax == null;

    if (shouldSkip) return true;

    const valeurs = [
      parseFloat(formData.chiffreAffaire2022),
      parseFloat(formData.chiffreAffaire2023),
      parseFloat(formData.chiffreAffaire2024),
    ].filter((v) => !isNaN(v));

    if (!valeurs.length) return false;

    const maxCA = Math.max(...valeurs);

    return (
      (chiffreAffaireMin == null || maxCA >= chiffreAffaireMin) &&
      (chiffreAffaireMax == null || maxCA <= chiffreAffaireMax)
    );
  },

  // Nouveau: chiffre d'affaires par secteur
  // valeursCriteres: Array<{ secteur: string, min: number|null, max: number|null }>
  // Si tableau vide -> pas de restriction. Si entrée correspondante trouvée -> applique min/max.
  // Si aucune entrée trouvée pour le secteur de l'utilisateur -> on considère "pas de restriction" pour éviter de bloquer.
  chiffreAffaireParSecteur: (valeursCriteres = [], formData) => {
    if (!Array.isArray(valeursCriteres) || valeursCriteres.length === 0)
      return true;

    const secteur = formData.secteurTravail;
    if (!secteur) return true; // pas d'info secteur -> ne pas bloquer ici (le critère secteurActivite gère déjà)

    const cfg = valeursCriteres.find((v) => v && v.secteur === secteur);
    if (!cfg) return true;

    const { min: chiffreAffaireMin = null, max: chiffreAffaireMax = null } =
      cfg;

    const shouldSkip = chiffreAffaireMin == null && chiffreAffaireMax == null;
    if (shouldSkip) return true;

    const valeurs = [
      parseFloat(formData.chiffreAffaire2022),
      parseFloat(formData.chiffreAffaire2023),
      parseFloat(formData.chiffreAffaire2024),
    ].filter((v) => !isNaN(v));

    if (!valeurs.length) return false;

    const maxCA = Math.max(...valeurs);
    return (
      (chiffreAffaireMin == null || maxCA >= chiffreAffaireMin) &&
      (chiffreAffaireMax == null || maxCA <= chiffreAffaireMax)
    );
  },

  age: ({ minAge, maxAge } = {}, formData) => {
    const shouldSkip =
      (minAge == null && maxAge == null) || formData.applicantType === "morale";
    if (shouldSkip) return true;

    const ageCandidat = parseInt(formData.age, 10);
    if (isNaN(ageCandidat)) return false;

    return (
      (minAge == null || ageCandidat >= minAge) &&
      (maxAge == null || ageCandidat <= maxAge)
    );
  },

  sexe: (valeursCriteres, formData) => {
    if (formData.applicantType === "morale") return true;
    return !valeursCriteres.length || valeursCriteres.includes(formData.sexe);
  },

  region: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.region),

  anneeCreation: (valeursCriteres, formData) =>
    !valeursCriteres.length || valeursCriteres.includes(formData.anneeCreation),
};

module.exports = criteresCheckers;
