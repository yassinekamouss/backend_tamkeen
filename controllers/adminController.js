const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// POST /api/admin/login
exports.loginAdmin = async (req, res) => {




  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Email invalide." });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ token, admin: { email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// POST /api/admin/register 
exports.registerAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Données reçues:", req.body);
    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Admin déjà existant." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({ email, password: hashedPassword });
    await newAdmin.save();

    res.status(201).json({ message: "Admin créé avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};