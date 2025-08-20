require("dotenv").config();

// ⚠ Charger l’instrumentation AVANT tout le reste
const Sentry = require("./instrument");

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");

const app = express();
// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send(
    "API is running on https://backendtamkeen-a8f551795f89.herokuapp.com/ on port 5000 ..."
  );
});

// Import routes
const testRoutes = require("./routes/testRoutes");
const adminRoutes = require("./routes/adminRoutes");
const programRoutes = require("./routes/programRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const statsRoutes = require("./routes/statsRoutes");
const newsRoutes = require("./routes/newsRoutes");
const activityRoutes = require("./routes/activityRoutes");
const partenairesRoutes = require("./routes/partenairesRoutes");

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
app.use("/api/partenaires", partenairesRoutes);

// Supporter aussi les routes admin attendues par le frontend (/api/admin/news)
app.use("/api/admin/news", newsRoutes);
// Admin activity feed
app.use("/api/admin/activity", activityRoutes);

// Test Sentry
app.get("/debug-sentry", (req, res) => {
  throw new Error("Test Sentry error!");
});

// Middleware de capture des erreurs (nouvelle API)
Sentry.setupExpressErrorHandler(app);

const PORT = process.env.PORT || 5000;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (process.env.FRONTEND_ORIGIN &&
      process.env.FRONTEND_ORIGIN.split(",")) || ["http://localhost:5173"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Socket auth for admins
io.use(async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie
      ? cookie.parse(socket.handshake.headers.cookie)
      : {};

    const token = cookies.adminToken;

    if (!token) return next(new Error("unauthorized"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("_id role");
    if (!admin) return next(new Error("unauthorized"));

    socket.data.admin = { id: String(admin._id), role: admin.role };
    next();
  } catch (e) {
    return next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  // Join admins room
  socket.join("admins");
});

// Expose io to routes/controllers
app.set("io", io);

async function startServer() {
  try {
    await connectDB(); // attendre la connexion DB

    require("./scripts/deactivateExpiredPrograms");
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to DB, server not started", error);
    process.exit(1); // optionnel : quitter le processus en cas d’erreur critique
  }
}
startServer();
