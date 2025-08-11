const express = require("express");
const router = express.Router();
const { verifierElegibilite } = require("../controllers/testController");
// Importer le contrôleur pour les tests
const testController = require("../controllers/testController");
const validate = require("../middlewares/validate");

router.post(
  "/eligibilite",
  validate({
    body: {
      email: { required: true, type: "string" },
      applicantType: {
        required: true,
        type: "string",
        enum: ["physique", "morale"],
      },
      secteurTravail: { required: true, type: "string" },
      region: { required: true, type: "string" },
    },
  }),
  verifierElegibilite
);
router.get("/eligibilite/personne/:id", testController.getTestsByPersonneId);
// Liste globale des tests avec filtres/pagination
router.get("/eligibilite", testController.getAllTests);
module.exports = router;
