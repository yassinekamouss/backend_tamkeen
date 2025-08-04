require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db"); // Import de la fonction de connexion

const testRoutes = require("./routes/testRoutes");
const adminRoutes = require("./routes/adminRoutes");
const programRoutes = require("./routes/programRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const authAdmin = require("./middlewares/authAdmin");

// Routes
app.use("/api/test", testRoutes);
app.use("/api/programs", authAdmin, programRoutes);
app.use("/api/admin", adminRoutes);

// Lancement conditionnel du serveur après connexion à MongoDB
const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB(); // Si la connexion échoue, le process.exit(1) sera appelé
  app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
  });
})();
