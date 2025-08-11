const mongoose = require("mongoose");
const TestSchema = new mongoose.Schema(
  {
    personne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personne",
      required: true,
    },

    secteurTravail: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    statutJuridique: {
      type: String,
      required: true,
    },
    anneeCreation: {
      type: String,
      required: true,
    },
    chiffreAffaires: {
      chiffreAffaire2022: {
        type: Number,
        min: 0,
        required: false,
      },
      chiffreAffaire2023: {
        type: Number,
        min: 0,
        required: false,
      },
      chiffreAffaire2024: {
        type: Number,
        min: 0,
        required: false,
      },
    },

    // estRecente: {
    //     type: Boolean,
    //     default: false
    // },
    montantInvestissement: {
      type: String,
      required: true,
      min: 0,
    },
    programmesEligibles: {
      type: [String], // Tableau de noms de programmes
      default: [], // Vide par défaut (pas éligible)
    },
  },
  { timestamps: true }
);

const TestElegibilite = mongoose.model("TestElegibilite", TestSchema);
module.exports = TestElegibilite;
