const mongoose = require("mongoose");
const PersonneSchema = new mongoose.Schema({

  type: { type: String, enum: ["physique", "morale"], required: true },
  nom: String,       // pour physique
  prenom: String,    // pour physique
  denomination: String, // pour morale
  email: { type: String, required: true, unique: true },
  telephone: String,
    
});

const Personne = mongoose.model("Personne", PersonneSchema);
module.exports = Personne;