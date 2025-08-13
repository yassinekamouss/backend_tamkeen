const express = require("express");
const router = express.Router();
const { getAdminStats } = require("../controllers/statsController");
const authAdmin = require("../middlewares/authAdmin");

router.get("/admin", authAdmin, getAdminStats);

module.exports = router;
