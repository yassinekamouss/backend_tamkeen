const express = require("express");
const router = express.Router();
const { verifierElegibilite } = require("../controllers/testController");

router.post("/eligibilite", verifierElegibilite);

module.exports = router;
