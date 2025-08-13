/**
 * @param  {...string} allowedRoles 
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.admin || !req.admin.role) {
        return res.status(401).json({ success: false, message: "Utilisateur non authentifié." });
      }

      if (!allowedRoles.includes(req.admin.role)) {
        return res.status(403).json({ success: false, message: "Accès refusé : rôle insuffisant." });
      }
      next();
    } catch (error) {
      console.error("Erreur authorizeRole:", error);
      return res.status(500).json({ success: false, message: "Erreur serveur." });
    }
  };
};

module.exports = authorizeRole;
