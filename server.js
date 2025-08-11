require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db"); // Import de la fonction de connexion

const testRoutes = require("./routes/testRoutes");
const adminRoutes = require("./routes/adminRoutes");
const programRoutes = require("./routes/programRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const statsRoutes = require("./routes/statsRoutes");
const newsRoutes = require("./routes/newsRoutes");
const app = express();
const errorHandler = require("./middlewares/errorHandler");

// Middleware
app.use(cors());
app.use(express.json());
// const authAdmin = require("./middlewares/authAdmin");

// Routes
app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});
app.use("/api/test", testRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/news", newsRoutes);

// Middleware d'erreurs (toujours après les routes)
app.use(errorHandler);

// Lancement conditionnel du serveur après connexion à MongoDB
const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
  });
})();
