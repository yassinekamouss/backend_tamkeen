require("dotenv").config();

// ⚠ Charger l’instrumentation AVANT tout le reste
const Sentry = require("./instrument");

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
// Middlewares
app.use(cors());
app.use(express.json());

// Import routes
const testRoutes = require("./routes/testRoutes");
const adminRoutes = require("./routes/adminRoutes");
const programRoutes = require("./routes/programRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const statsRoutes = require("./routes/statsRoutes");
const newsRoutes = require("./routes/newsRoutes");

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Routes API
app.use("/api/test", testRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/news", newsRoutes);
// Supporter aussi les routes admin attendues par le frontend (/api/admin/news)
app.use("/api/admin/news", newsRoutes);

// Test Sentry
app.get("/debug-sentry", (req, res) => {
  throw new Error("Test Sentry error!");
});

// Middleware de capture des erreurs (nouvelle API)
Sentry.setupExpressErrorHandler(app);


const PORT = process.env.PORT || 5000;

  try {
    await connectDB(); // attendre la connexion DB
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to DB, server not started", error);
    process.exit(1); // optionnel : quitter le processus en cas d’erreur critique
  }

startServer();
