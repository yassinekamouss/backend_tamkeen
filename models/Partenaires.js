const mongoose = require("mongoose");
const partenairesSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique: true },
    url: { type: String, required: false },
    img: { type: String, required: true },
  },
  { timestamps: true }
);


const Partenaire = mongoose.model("Partenaire", partenairesSchema);
module.exports = Partenaire;

