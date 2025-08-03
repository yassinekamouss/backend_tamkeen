const mongoose = require("mongoose");

const programSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "",  trim: true },
  isActive: { type: Boolean, default: true },
  criteres: {
    secteurActivite: [String],
    statutJuridique: [String],
    applicantType: [String],
    montantInvestissement: [String],
    chiffreAffaireMin: Number,
    chiffreAffaireMax: Number,
    anneeCreation:[ Number],
    region: [String]
  },
});


module.exports = mongoose.model("Program", programSchema);