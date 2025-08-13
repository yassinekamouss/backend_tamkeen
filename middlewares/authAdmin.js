const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Middleware d'authentification admin avec vérification d'existence en base
const authAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Token manquant." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que l'admin existe toujours (empêche l'accès si supprimé)
    const admin = await Admin.findById(decoded.id).select("_id role");
    if (!admin) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Compte administrateur introuvable ou supprimé.",
        });
    }

    // Hydrater req.admin depuis la base pour éviter les rôles périmés
    req.admin = { id: String(admin._id), role: admin.role };
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Token invalide." });
  }
};

module.exports = authAdmin;
