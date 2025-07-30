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
    secteurTravail: {
        type: String,
        required: false,
    },
    region: {
        type: String,
        required: true,
    },
    statutJuridique: {
        type: String,
        required: false,
    },
    formeJuridique: {
        type: String,
        required: true,
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
    }

});

const TestElegibilite = mongoose.model("TestElegibilite", TestSchema);
module.exports = TestElegibilite;
