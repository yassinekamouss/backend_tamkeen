const express = require("express");
const router = express.Router();
const { verifierEligibilite } = require("../controllers/testController");

router.post("/eligibilite", verifierEligibilite);

module.exports = router;
