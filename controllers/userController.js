const Personne = require("../models/Personne");
const asyncHandler = require("../utils/asyncHandler");
const api = require("../utils/apiResponse");

// Obtenir toutes les personnes
exports.getAllUsers = asyncHandler(async (req, res) => {
  const personnes = await Personne.find();
  // Frontend expects a raw array
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
  const updated = await Personne.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!updated) {
    return res.status(404).json({ message: "Personne non trouvée" });
  }
  // Frontend expects a raw document
  return res.status(200).json(updated);
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
