const Personne = require("../models/Personne");
const asyncHandler = require("../utils/asyncHandler");
const api = require("../utils/apiResponse");
const Admin = require("../models/Admin");

// Obtenir toutes les personnes
exports.getAllUsers = asyncHandler(async (req, res) => {
  const personnes = await Personne.find()
    .populate("consultantAssocie", "username");

  return res.status(200).json(personnes);
});


// Obtenir une personne par ID
exports.getUserById = asyncHandler(async (req, res) => {
  const personne = await Personne.findById(req.params.id);
  if (!personne) {
    return res.status(404).json({ message: "Personne non trouvée" });
  }
  // Frontend expects a raw document
  return res.status(200).json(personne);
});

// Mettre à jour une personne
exports.updateUser = asyncHandler(async (req, res) => {
  try {
    const { consultantAssocie, ...rest } = req.body; // consultantAssocie = ID de l'admin envoyé par le frontend

    // Vérifier si l'admin existe
    const admin = await Admin.findById(consultantAssocie);
    if (!admin) {
      return res.status(404).json({ message: "Consultant (Admin) non trouvé" });
    }

    // Mettre à jour la personne avec l'état + référence de l'admin
    const updated = await Personne.findByIdAndUpdate(
      req.params.id,
      {
        ...rest,
        consultantAssocie: admin._id, // on stocke la référence
      },
      { new: true }
    ).populate("consultantAssocie"); // pour retourner l'admin comme objet peuplé

    if (!updated) {
      return res.status(404).json({ message: "Personne non trouvée" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
  }
});

// Supprimer une personne
/*
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await Personne.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Personne non trouvée" });
    }
    res.json({ message: "Personne supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
  }
};


*/
