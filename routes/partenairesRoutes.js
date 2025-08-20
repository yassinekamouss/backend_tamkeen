const express = require("express");
const router = express.Router();
const partenairesController = require("../controllers/partenairesController");
const authAdmin = require("../middlewares/authAdmin");
const authorizeRole = require("../middlewares/authorizeRole");




router.post("/add", authAdmin, authorizeRole("Administrateur"), partenairesController.createPartenaire);
router.get("/", authAdmin, partenairesController.getAllPartenaires);
router.put("/:id", authAdmin, authorizeRole("Administrateur"), partenairesController.modifyPartenaire);
router.delete("/:id", authAdmin, authorizeRole("Administrateur"), partenairesController.deletePartenaire);

module.exports = router;
