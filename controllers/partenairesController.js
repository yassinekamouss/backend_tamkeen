const Partenaire = require("../models/Partenaires");
const asyncHandler = require("../utils/asyncHandler");
const api = require("../utils/apiResponse");
// const { logActivity } = require("../utils/activity");

exports.createPartenaire = asyncHandler(async (req, res) => {
  const newPartenaire = new Partenaire(req.body);
  const savedPartenaire = await newPartenaire.save();

  try {
    // await logActivity(req, {
    //   type: "partenaire_created",
    //   title: "Partenaire créé",
    //   message: savedPartenaire.name || "Partenaire",
    //   entity: { kind: "partenaire", id: String(savedPartenaire._id) },
    //   meta: {},
    //   actor: req.admin || null,
    // });
  } catch (err) {
    console.error("Erreur logActivity :", err);
  }

  return api.created(res, { partenaire: savedPartenaire });
});


// Obtenir tous les partenaires
exports.getAllPartenaires = asyncHandler(async (req, res) => {
  const partenaires = await Partenaire.find();
  // Frontend expects a raw array
  return res.status(200).json(partenaires);
});

exports.modifyPartenaire = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedPartenaire = await Partenaire.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedPartenaire) {
    return api.error(res, "Partenaire non trouvé");
  }

  return api.ok(res, { partenaire: updatedPartenaire });
});


//delete partenaires

exports.deletePartenaire = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedPartenaire = await Partenaire.findByIdAndDelete(id);

  if (!deletedPartenaire) {
    return api.error(res, "Partenaire non trouvé");
  }

  return api.ok(res, { partenaire: deletedPartenaire });
});