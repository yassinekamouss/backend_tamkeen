const mongoose = require("mongoose");

// Fonction pour se connecter à MongoDB
const connectDB = async () => {
  try {
    // Connexion à MongoDB via l'URI dans le fichier .env
    const conn = await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Afficher l'état de la connexion avec le nom de la base utilisée
    console.log(`✅ MongoDB connecté : ${conn.connection.name}`);
  } catch (error) {
    // En cas d'erreur, afficher l'erreur et quitter le process
    console.error("❌ Erreur de connexion à MongoDB :", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
