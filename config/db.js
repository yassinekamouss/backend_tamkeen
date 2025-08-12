const mongoose = require("mongoose");

// Fonction pour se connecter à MongoDB
const connectDB = async () => {
  try {
    // Supporte MONGODB_URI (recommandé) et DB_URL (legacy)
    const mongoUri = process.env.MONGODB_URI || process.env.DB_URL;
    if (!mongoUri) {
      throw new Error(
        "Aucune chaîne de connexion MongoDB fournie (MONGODB_URI ou DB_URL)."
      );
    }

    const conn = await mongoose.connect(mongoUri, {
      // Options modernes par défaut avec mongoose >=7/8
    });

    console.log(
      `✅ MongoDB connecté: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
