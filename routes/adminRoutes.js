const express = require("express");
const router = express.Router();

const {
  loginAdmin,
  registerAdmin,
  getAllAdmins,
  deleteAdmin,
  getOtherAdmins,
  updateAdmin,
  getAdminProfile, 
  logoutAdmin,
  resetPassword
} = require("../controllers/adminController");
const authAdmin = require("../middlewares/authAdmin");
const  authorizeRole  = require("../middlewares/authorizeRole");

// Public
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);

// Protected
router.get("/", authAdmin, authorizeRole("Administrateur"), getAllAdmins);
router.post("/register",authAdmin,authorizeRole("Administrateur"), registerAdmin);
router.get("/me", authAdmin,getAdminProfile);
router.get("/others", authAdmin, authorizeRole("Administrateur"), getOtherAdmins);
router.delete("/:id", authAdmin ,authorizeRole("Administrateur"), deleteAdmin);
router.put("/:id", authAdmin ,authorizeRole("Administrateur"), updateAdmin);
router.post("/:id/reset-password", authAdmin ,authorizeRole("Administrateur"), resetPassword);

module.exports = router;
