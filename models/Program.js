const mongoose = require("mongoose");
const { chiffreAffaire } = require("../utils/eligibilityCheckers");

const programSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "",  trim: true },
  isActive: { type: Boolean, default: true },
  DateDebut: { type: Date, default: Date.now },
  DateFin: { type: Date, default: null },
  // image: { type: String, default: "" },
  criteres: {
    secteurActivite: [String],
    statutJuridique: [String],
    applicantType: [String],
    montantInvestissement: [String],
    chiffreAffaire: {
          chiffreAffaireMin: { type: Number, default: null },
          chiffreAffaireMax: { type: Number, default: null },
        },  
    anneeCreation: [String],
    region: [String]
  },
  nombreBeneficiaires: { type: Number, default: 0 }
});


module.exports = mongoose.model("Program", programSchema);