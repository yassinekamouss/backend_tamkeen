const mongoose = require("mongoose");
const TestSchema = new mongoose.Schema({
     personne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Personne",
    required: true
  },
    secteurActivite: {
        type: String,
        required: true,
    },
    region: {
        type: String,
        required: true,
    },
    statutJuridique: {
        type: String,
        required: false,
    },
    anneeCreation: {
        type: Number,
        required: true
    },
    chiffreAffaire: {
        type: Number,
        required: false,
        min: 0
    },
    // estRecente: {
    //     type: Boolean,
    //     default: false
    // },
    montantPrevisionnelInvestissement: {
        type: Number,
        required: true,
        min: 0
    },
     programmesEligibles: {
        type: [String], // Tableau de noms de programmes
        default: []     // Vide par défaut (pas éligible)
    }

});

const TestElegibilite = mongoose.model("TestElegibilite", TestSchema);
module.exports = TestElegibilite;
