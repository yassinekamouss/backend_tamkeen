const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");
const authAdmin = require("../middlewares/authAdmin");
const validate = require("../middlewares/validate");

// Public
router.get("/", programController.getAllPrograms);
router.get("/:id", programController.getProgramById);

// Admin protected
router.post(
  "/",
  authAdmin,
  validate({ body: { name: { required: true, type: "string" } } }),
  programController.createProgram
);
router.put(
  "/:id",
  authAdmin,
  validate({ params: { id: { required: true, type: "string" } } }),
  programController.updateProgram
);
router.delete(
  "/:id",
  authAdmin,
  validate({ params: { id: { required: true, type: "string" } } }),
  programController.deleteProgram
);
router.patch(
  "/:id/toggle",
  authAdmin,
  validate({ params: { id: { required: true, type: "string" } } }),
  programController.toggleProgramActive
);

module.exports = router;
