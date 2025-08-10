const Personne = require("../models/Personne");
const TestElegibilite = require("../models/TestElegibilite");
const Program = require("../models/Program");
const getPrograms = require("../utils/eligibilityHelpers");

exports.verifierElegibilite = async (req, res) => {
  try {

    const data = req.body;

    let personne = await Personne.findOne({ email: data.email });

    if (personne) {
      if (data.applicantType === "physique") {
      const infosIdentiques =
    personne.nom === data.nom &&
    personne.prenom === data.prenom &&
    Number(personne.age) === Number(data.age) &&
    personne.sexe === data.sexe &&
    personne.telephone === data.telephone;


        if (!infosIdentiques) {
          return res.status(400).json({
            success: false,
            message: "Cet email est déjà utilisé par une autre personne physique avec des informations différentes."
          });
        }
      } else if (data.applicantType === "morale") {
        const infosIdentiques =
          personne.nomEntreprise === data.nomEntreprise &&
          personne.email === data.email;

        if (!infosIdentiques) {
          return res.status(400).json({
            success: false,
            message: "Cet email est déjà utilisé par une autre entreprise avec des informations différentes."
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Type de demandeur inconnu ou non valide."
        });
      }
    
    } else {
      // Si l'email n'existe pas, on crée la personne
      personne = await Personne.create({
        applicantType: data.applicantType,
        nom: data.nom,
        prenom: data.prenom,
        age: data.age,
        sexe: data.sexe,
        nomEntreprise: data.nomEntreprise,
        email: data.email,
        telephone: data.telephone
      });
    }

    // Récupérer tous les programmes actifs
    const activePrograms = await Program.find({ isActive: true });

    // Trouver les programmes éligibles
    const eligibleProgramNames = getPrograms(activePrograms, data);

    // Créer un nouveau test pour cette personne
    await TestElegibilite.create({
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
      programs: eligibleProgramNames
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