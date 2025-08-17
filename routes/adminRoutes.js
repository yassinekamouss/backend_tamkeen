const express = require("express");
const router = express.Router();

const {
  loginAdmin,
  registerAdmin,
  getOtherAdmins,
  deleteAdmin,
  updateAdmin,
  getAdminProfile, 
  logoutAdmin,
} = require("../controllers/adminController");
const authAdmin = require("../middlewares/authAdmin");
const  authorizeRole  = require("../middlewares/authorizeRole");

// Public
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);

// Protected
router.get("/", authAdmin, authorizeRole("Administrateur"), getOtherAdmins);
router.post("/register",authAdmin,authorizeRole("Administrateur"), registerAdmin);
router.get("/me", authAdmin,getAdminProfile);
router.delete("/:id", authAdmin ,authorizeRole("Administrateur"), deleteAdmin);
router.put("/:id", authAdmin ,authorizeRole("Administrateur"), updateAdmin);


module.exports = router;
