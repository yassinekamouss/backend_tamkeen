const Personne = require("../models/Personne");
const TestElegibilite = require("../models/TestElegibilite");

// Créer ou mettre à jour une personne et enregistrer une soumission
exports.verifierElegibilite = async (req, res) => {
  try {
    const data = req.body;

    // Vérifier existence de la personne par email
    let personne = await Personne.findOne({ email: data.email });

    if (personne) {
      personne.set({
        nom: data.nom,
        prenom: data.prenom,
        denomination: data.denomination,
        telephone: data.telephone,
        type: data.type,
      });
      await personne.save();
    } else {
      personne = await Personne.create({
        nom: data.nom,
        prenom: data.prenom,
        denomination: data.denomination,
        email: data.email,
        telephone: data.telephone,
        type: data.type,
      });
    }

    // Créer la soumission
    const test = await TestElegibilite.create({
      personne: personne._id,
      secteur: data.secteur,
      region: data.region,
      statutJuridique: data.statutJuridique,
      anneeCreation: data.anneeCreation,
      chiffreAffaire: data.chiffreAffaire,
      montantInvestissement: data.montantInvestissement,
    });

    return res.status(201).json({ success: true, message: "Éligibilité enregistrée", test });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
