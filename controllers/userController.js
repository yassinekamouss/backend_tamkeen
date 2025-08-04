const Personne = require("../models/Personne");

// Obtenir toutes les personnes
exports.getAllUsers = async (req, res) => {
  try {
    const personnes = await Personne.find();
    res.json(personnes);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération", error: err.message });
  }
};

// Obtenir une personne par ID
exports.getUserById = async (req, res) => {
  try {
    const personne = await Personne.findById(req.params.id);
    if (!personne) {
      return res.status(404).json({ message: "Personne non trouvée" });
    }
    res.json(personne);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération", error: err.message });
  }
};

// Mettre à jour une personne
exports.updateUser = async (req, res) => {
  try {
    const updated = await Personne.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Personne non trouvée" });
    }
    res.json(updated);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Erreur lors de la mise à jour", error: err.message });
  }
};

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
