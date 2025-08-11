const Program = require("../models/Program"); 
const mongoose = require("mongoose");

// Créer un programme
exports.createProgram = async (req, res) => {
  try {
    const newProgram = new Program(req.body);
    console.log("Nouveau programme créé :", newProgram);
    const savedProgram = await newProgram.save();
    return res.status(201).json(savedProgram);
  } catch (error) {
    console.error("Erreur lors de la création du programme :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Obtenir tous les programmes
exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.find();
    return res.status(200).json(programs);
  } catch (error) {
    console.error("Erreur lors de la récupération des programmes :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Obtenir un programme par ID
exports.getProgramById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  try {
    const program = await Program.findById(id);
    if (!program) {
      return res.status(404).json({ message: "Programme non trouvé" });
    }
    return res.status(200).json(program);
  } catch (error) {
    console.error("Erreur lors de la récupération du programme :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mettre à jour un programme
exports.updateProgram = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  try {
    const updatedProgram = await Program.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    console.log(" programme ", req.body);
    if (!updatedProgram) {
      return res.status(404).json({ message: "Programme non trouvé" });
    }

    return res.status(200).json(updatedProgram);
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer un programme
exports.deleteProgram = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  try {
    const deletedProgram = await Program.findByIdAndDelete(id);
    if (!deletedProgram) {
      return res.status(404).json({ message: "Programme non trouvé" });
    }
    return res.status(200).json({ message: "Programme supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Activer/désactiver un programme
exports.toggleProgramActive = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  try {
    const program = await Program.findById(id);
    if (!program) {
      return res.status(404).json({ message: "Programme non trouvé" });
    }

    program.isActive = !program.isActive;
    await program.save();

    return res.status(200).json({ message: `Programme ${program.isActive ? "activé" : "désactivé"}`, program });
  } catch (error) {
    console.error("Erreur lors du changement d'état :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
