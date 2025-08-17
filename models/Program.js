const mongoose = require("mongoose");
const { chiffreAffaire } = require("../utils/eligibilityCheckers");
const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    DateDebut: { type: Date, default: Date.now },
    DateFin: { type: Date, default: null },
    link: { type: String, default: "#" },
    hero: {
      isHero: { type: Boolean, default: false },
      image: { type: String, default: "" },
      titleFr: { type: String, default: "" },
      titleAr: { type: String, default: "" },
      subtitleFr: { type: String, default: "" },
      subtitleAr: { type: String, default: "" },
      descriptionFr: { type: String, default: "" },
      descriptionAr: { type: String, default: "" },
    },
    criteres: {
      secteurActivite: [String],
      statutJuridique: [String],
      applicantType: [String],
      montantInvestissement: [String],
      // Ancienne configuration (global) conservée pour compatibilité rétroactive
      chiffreAffaire: {
        chiffreAffaireMin: { type: Number, default: null },
        chiffreAffaireMax: { type: Number, default: null },
      },
      // Nouvelle configuration: chiffre d'affaires par secteur
      // Exemple: [{ secteur: 'industrie', min: 100000, max: 5000000 }]
      chiffreAffaireParSecteur: [
        {
          secteur: { type: String, required: true },
          min: { type: Number, default: null },
          max: { type: Number, default: null },
          _id: false,
        },
      ],
      age: {
        minAge: { type: Number, default: null },
        maxAge: { type: Number, default: null },
      },
      sexe: [String],
      anneeCreation: [String],
      region: [String],
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Program", programSchema);
