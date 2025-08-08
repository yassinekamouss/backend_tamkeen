const Personne = require("../models/Personne");
const TestElegibilite = require("../models/TestElegibilite");
const Program = require("../models/Program");
const getPrograms = require("../utils/eligibilityHelpers");

exports.verifierElegibilite = async (req, res) => {
  try {
    const data = req.body;
    console.log("Données reçues:", req.body);
    let personne;

    // Vérifier si la personne existe déjà par email
    personne = await Personne.findOne({ email: data.email });
    
    if (!personne) {
      // Si pas trouvée par email, vérifier selon le type
      if (data.applicantType === "physique") {
        personne = await Personne.findOne({
          nom: data.nom,
          prenom: data.prenom,
          telephone: data.telephone
        });
      } else if (data.applicantType === "morale") {
        personne = await Personne.findOne({
          nomEntreprise: data.nomEntreprise
        });
      } else {
        return res.status(400).json({ success: false, message: "Type de personne invalide" });
      }
    }

    // Créer la personne si elle n'existe pas
    if (!personne) {
      try {
        personne = await Personne.create({
          nom: data.nom,
          prenom: data.prenom,
          nomEntreprise: data.nomEntreprise,
          email: data.email,
          telephone: data.telephone,
          applicantType: data.applicantType,
        });
      } catch (error) {
        // Si erreur de duplication d'email, récupérer la personne existante
        if (error.code === 11000) {
          personne = await Personne.findOne({ email: data.email });
        } else {
          throw error;
        }
      }
    }

    // Récupérer tous les programmes
 const activePrograms = await Program.find({ isActive: true });


    // Trouver les programmes éligibles
    const eligibleProgramNames = getPrograms(activePrograms, data);


    // Créer un test d'éligibilité avec les programmes trouvés
    const test = await TestElegibilite.create({
      personne: personne._id,
      secteurTravail: data.secteurTravail, 
      region: data.region,
      statutJuridique: data.statutJuridique,
      anneeCreation: data.anneeCreation, 
      chiffreAffaires: {
        chiffreAffaire2022: parseFloat(data.chiffreAffaire2022) || undefined,
        chiffreAffaire2023: parseFloat(data.chiffreAffaire2023) || undefined,
        chiffreAffaire2024: parseFloat(data.chiffreAffaire2024) || undefined,
      },
      montantInvestissement: data.montantInvestissement,
      programmesEligibles: eligibleProgramNames,
    });

    return res.status(201).json({
      success: true,
      programs: eligibleProgramNames,
    });

  } catch (error) {
    console.error("Erreur lors de la vérification d'éligibilité :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur. Veuillez réessayer plus tard."
    });
  }

};

// Définitions des fonctions
exports.getTestsByPersonneId = async (req, res) => {
  const { id } = req.params;

  try {
    const tests = await TestElegibilite.find({ personne: id }).populate("personne");

    if (!tests || tests.length === 0) {
      return res.status(404).json({ success: false, message: "Aucun test trouvé pour cette personne." });
    }

    return res.status(200).json({ success: true, tests });
  } catch (error) {
    console.error("Erreur lors de la récupération des tests :", error);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};