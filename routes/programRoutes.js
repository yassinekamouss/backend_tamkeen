const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");
const authAdmin = require("../middlewares/authAdmin");
const validate = require("../middlewares/validate");
const authorizeRole = require("../middlewares/authorizeRole");

// Public
router.get("/", programController.getAllPrograms);
router.get("/hero", programController.getHeroPrograms);
router.get("/:id", programController.getProgramById);

// Admin protected
router.post(
  "/",
  authAdmin,
  authorizeRole("Administrateur"),
  validate({ body: { name: { required: true, type: "string" } } }),
  programController.createProgram
);
router.put(
  "/:id",
  authAdmin,
  authorizeRole("Administrateur"),
  validate({ params: { id: { required: true, type: "string" } } }),
  programController.updateProgram
);
router.delete(
  "/:id",
  authAdmin,
  authorizeRole("Administrateur"),
  validate({ params: { id: { required: true, type: "string" } } }),
  programController.deleteProgram
);
router.patch(
  "/:id/toggle",
  authAdmin,
  authorizeRole("Administrateur"),
  validate({ params: { id: { required: true, type: "string" } } }),
  programController.toggleProgramActive
);

module.exports = router;


router.put(
  "/:id/hero",
  authAdmin,
  authorizeRole("Administrateur"),
  validate({ 
    params: { id: { required: true, type: "string" } },
    body: {
      isHero: { required: true, type: "boolean" }
    }
  }),
  programController.updateProgramHero
);

