const express = require("express");
const router = express.Router();

const { loginAdmin , registerAdmin , getAllAdmins ,deleteAdmin, updateAdmin } = require("../controllers/adminController");


router.get("/", getAllAdmins);
router.post("/login", loginAdmin);
router.post("/register", registerAdmin);
router.delete("/:id", deleteAdmin);
router.put("/:id", updateAdmin); 


module.exports = router;
