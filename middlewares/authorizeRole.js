/**
 * @param  {...string} allowedRoles 
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.admin || !req.admin.role) {
        console.log("🔒 Blocage authorizeRole : utilisateur non authentifié");
        return res.status(401).json({
          success: false,
          from: "authorizeRole",
          message: "Utilisateur non authentifié."
        });
      }

      if (!allowedRoles.includes(req.admin.role)) {
        console.log(
          `🚫 Blocage authorizeRole : rôle '${req.admin.role}' non autorisé (nécessaire : ${allowedRoles.join(", ")})`
        );
        return res.status(403).json({
          success: false,
          from: "authorizeRole",
          message: "Accès refusé : rôle insuffisant."
        });
      }

      next();
    } catch (error) {
      console.error("💥 Erreur authorizeRole:", error);
      return res.status(500).json({
        success: false,
        from: "authorizeRole",
        message: "Erreur serveur."
      });
    }
  };
};

module.exports = authorizeRole;

