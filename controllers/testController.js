const Personne = require("../models/Personne");
const TestElegibilite = require("../models/TestElegibilite");

// Créer une personne si elle n'existe pas, puis enregistrer une soumission de test
exports.verifierElegibilite = async (req, res) => {
  try {
    const data = req.body;
    let personne;

    // Vérifier l'existence de la personne selon son type
    if (data.type === "physique") {
      personne = await Personne.findOne({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone
      });
    } else if (data.type === "morale") {
      personne = await Personne.findOne({
        denomination: data.denomination,
        email: data.email
      });
    } else {
      return res.status(400).json({ success: false, message: "Type de personne invalide" });
    }

    // Si la personne n'existe pas, on la crée
    if (!personne) {
      personne = await Personne.create({
        nom: data.nom,
        prenom: data.prenom,
        denomination: data.denomination,
        email: data.email,
        telephone: data.telephone,
        type: data.type,
      });
    }

    // Créer un nouveau test lié à la personne
    const test = await TestElegibilite.create({
      personne: personne._id,
      secteurActivite: data.secteurActivite,
      secteurTravail: data.secteurTravail,
      region: data.region,
      statutJuridique: data.statutJuridique,
      formeJuridique: data.formeJuridique,
      anneeCreation: data.anneeCreation,
      chiffreAffaire: data.chiffreAffaire,
      montantPrevisionnelInvestissement: data.montantPrevisionnelInvestissement,
    });

    return res.status(201).json({
      success: true,
      message: "Éligibilité enregistrée avec succès",
      test
    });

  } catch (error) {
    console.error("Erreur lors de la vérification d’éligibilité :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur. Veuillez réessayer plus tard."
    });
  }
};
