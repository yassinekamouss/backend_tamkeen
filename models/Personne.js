const mongoose = require("mongoose");
const PersonneSchema = new mongoose.Schema({

  applicantType: { type: String, enum: ["physique", "morale"], required: true },
  nom: String,       // pour physique
  prenom: String,    // pour physique
  sexe: String,         // pour physique
  nomEntreprise: String, // pour morale
  email: { type: String, required: true, unique: true },
  telephone: { type: String, required: true, unique: true },
  age: { type: Number, min: 18, max: 100 }, // pour physique

});

const Personne = mongoose.model("Personne", PersonneSchema);
module.exports = Personne;