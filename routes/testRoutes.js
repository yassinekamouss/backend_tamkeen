const express = require("express");
const router = express.Router();
const { verifierElegibilite } = require("../controllers/testController");
// Importer le contrôleur pour les tests
const testController = require("../controllers/testController");

router.post("/eligibilite", verifierElegibilite);
router.get("/eligibilite/personne/:id", testController.getTestsByPersonneId);
module.exports = router;
