const express = require("express");
const router = express.Router();

const {
  loginAdmin,
  registerAdmin,
  getAllAdmins,
  deleteAdmin,
  updateAdmin,
} = require("../controllers/adminController");
const authAdmin = require("../middlewares/authAdmin");
const  authorizeRole  = require("../middlewares/authorizeRole");

// Public
router.post("/login", loginAdmin);

// Protected
router.get("/", authAdmin, authorizeRole("Administrateur"), getAllAdmins);
router.post("/register",authAdmin,authorizeRole("Administrateur"), registerAdmin);
router.delete("/:id", authAdmin ,authorizeRole("Administrateur"), deleteAdmin);
router.put("/:id", authAdmin ,authorizeRole("Administrateur"), updateAdmin);

module.exports = router;
