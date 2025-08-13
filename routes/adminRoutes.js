const express = require("express");
const router = express.Router();

const { loginAdmin , registerAdmin , getAllAdmins ,deleteAdmin, updateAdmin } = require("../controllers/adminController");
const authAdmin = require("../middlewares/authAdmin");

// Public
router.post("/login", loginAdmin);
router.post("/register", registerAdmin);

// Protected
router.get("/", authAdmin, getAllAdmins);
router.delete("/:id", authAdmin, deleteAdmin);
router.put("/:id", authAdmin, updateAdmin); 

module.exports = router;
