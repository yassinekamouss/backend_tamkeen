const express = require("express");
const cors = require("cors");
const testRoutes = require("./routes/testRoutes");
require("dotenv").config();
const connectDB = require("./config/db"); // Import de la fonction de connexion

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/test", testRoutes)

// Connexion à MongoDB
connectDB();

// Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
