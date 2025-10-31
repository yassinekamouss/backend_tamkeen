const mongoose = require("mongoose");
const PersonneSchema = new mongoose.Schema(
  {
    applicantType: {
      type: String,
      enum: ["physique", "morale"],
      required: true,
    },
    nom: String, // pour physique
    prenom: String, // pour physique
    sexe: String, // pour physique
    nomEntreprise: String, // pour morale
    // Autoriser le même email pour des types différents (physique/morale)
    email: { type: String, required: true },
    // Nouveau: permettre plusieurs numéros de téléphone par personne
    telephones: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          // Au moins un numéro est recommandé mais pas strictement requis côté schéma
          return Array.isArray(arr);
        },
        message: "Le champ téléphones doit être un tableau.",
      },
    },
    age: { type: Number, min: 18, max: 100 }, // pour physique
    etat: {
      type: String,
      enum: ["En traitement", "En attente", "Terminé"],
      default: "En attente",
    },
    //ID du consultant associé
    consultantAssocie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

// Compatibilité rétro: exposer un virtuel "telephone" (premier numéro s'il existe)
PersonneSchema.virtual("telephone").get(function () {
  if (Array.isArray(this.telephones) && this.telephones.length > 0) {
    return this.telephones[0];
  }
  return undefined;
});

const Personne = mongoose.model("Personne", PersonneSchema);
module.exports = Personne;
