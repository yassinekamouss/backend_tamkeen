const express = require("express");
const router = express.Router();
const partenairesController = require("../controllers/partenairesController");
// const authAdmin = require("../middlewares/authAdmin");



router.post("/add", partenairesController.createPartenaire);
router.get("/", partenairesController.getAllPartenaires);
router.put("/:id", partenairesController.modifyPartenaire);
router.delete("/:id", partenairesController.deletePartenaire);

module.exports = router;
