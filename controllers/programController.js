const Program = require("../models/Program");
const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const api = require("../utils/apiResponse");

// Créer un programme
exports.createProgram = asyncHandler(async (req, res) => {
  const newProgram = new Program(req.body);
  const savedProgram = await newProgram.save();
  return api.created(res, { program: savedProgram });
});

// Obtenir tous les programmes
exports.getAllPrograms = asyncHandler(async (req, res) => {
  const programs = await Program.find();
  // Frontend expects a raw array
  return res.status(200).json(programs);
});

// Obtenir un programme par ID
exports.getProgramById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return api.error(res, "ID invalide", 400);
  }
  const program = await Program.findById(id);
  if (!program) {
    return api.error(res, "Programme non trouvé", 404);
  }
  return api.ok(res, { program });
});

// Mettre à jour un programme
exports.updateProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return api.error(res, "ID invalide", 400);
  }
  const updatedProgram = await Program.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedProgram) {
    return api.error(res, "Programme non trouvé", 404);
  }
  return api.ok(res, { program: updatedProgram });
});

// Supprimer un programme
exports.deleteProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return api.error(res, "ID invalide", 400);
  }
  const deletedProgram = await Program.findByIdAndDelete(id);
  if (!deletedProgram) {
    return api.error(res, "Programme non trouvé", 404);
  }
  return api.ok(res, { message: "Programme supprimé avec succès" });
});

// Activer/désactiver un programme
exports.toggleProgramActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return api.error(res, "ID invalide", 400);
  }
  const program = await Program.findById(id);
  if (!program) {
    return api.error(res, "Programme non trouvé", 404);
  }
  program.isActive = !program.isActive;
  await program.save();
  return api.ok(res, {
    message: `Programme ${program.isActive ? "activé" : "désactivé"}`,
    program,
  });
});
