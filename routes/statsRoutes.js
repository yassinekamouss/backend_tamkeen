const express = require("express");
const router = express.Router();
const { getAdminStats } = require("../controllers/statsController");

router.get("/admin", getAdminStats);

module.exports = router;
