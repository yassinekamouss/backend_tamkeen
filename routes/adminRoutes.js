const express = require("express");
const router = express.Router();
const { loginAdmin, registerAdmin } = require("../controllers/adminController");

router.post("/login", loginAdmin);

router.post("/register", registerAdmin);

router.post("/test", registerAdmin);


module.exports = router;
