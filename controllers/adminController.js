// controllers/adminController.js
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// POST /api/admin/register
exports.registerAdmin = async (req, res) => {
  const { email, password, username, role } = req.body;

  try {
    // Vérifier si l'admin existe déjà
    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Admin déjà existant." });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel admin
    const newAdmin = new Admin({
      email,
      password: hashedPassword,
      username,
      role: role || "Consultant",
    });

    await newAdmin.save();

    res.status(201).json({
      message: "Admin créé avec succès.",
      admin: {
        _id: newAdmin._id,
        email: newAdmin.email,
        username: newAdmin.username,
        role: newAdmin.role,
      },
    });
  } catch (err) {
    console.error("Erreur registerAdmin:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// PUT /api/admin/:id
exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { email, username, role } = req.body;

  try {
    // Vérifier si l'admin existe
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin non trouvé." });
    }

    // Mettre à jour les champs
    if (email) admin.email = email;
    if (username) admin.username = username;
    if (role) admin.role = role;

    // Sauvegarder les modifications
    await admin.save();

    res.status(200).json({
      message: "Admin modifié avec succès.",
      admin: {
        _id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Erreur editAdmin:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// POST /api/admin/login
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier si l'admin existe
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Email invalide." });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
  const isProd = process.env.NODE_ENV === "production";
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: isProd, // HTTPS seulement en prod
      sameSite: isProd ? "None" : "Lax"
      maxAge: 24 * 60 * 60 * 1000 // 1 jour
    });


      res.status(200).json({
        message: "Connexion réussie.",
        admin: {
          _id: admin._id,
          email: admin.email,
          username: admin.username,
          role: admin.role,
        },
      });

  } catch (err) {
    console.error("Erreur loginAdmin:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// GET /api/admin/
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password"); // Exclure le mdp
    res.status(200).json(admins);
  } catch (err) {
    console.error("Erreur getAllAdmins:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// DELETE /api/admin/
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin non trouvé." });
    }

   
    await Admin.findByIdAndDelete(id);

    res.status(200).json({ message: "Admin supprimé avec succès." });
  } catch (err) {
    console.error("Erreur deleteAdmin:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// POST /api/admin/logout
exports.logoutAdmin = (req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax"
  });

  res.status(200).json({ message: "Déconnecté avec succès." });
};



// GET /api/admin/me
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id)
      .select("_id username email role");

    if (!admin) {
      return res.status(404).json({ message: "Admin non trouvé." });
    }

    res.json({ admin });
  } catch (error) {
    console.error("Erreur getAdminProfile:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
