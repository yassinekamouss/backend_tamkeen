const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authAdmin = require("../middlewares/authAdmin");

router.get("/", authAdmin, userController.getAllUsers);
router.get("/export", authAdmin, userController.exportUsers);
router.get("/:id", authAdmin, userController.getUserById);
router.get("/consultant/:id", authAdmin, userController.getUserByconsultant);
router.put("/:id", authAdmin, userController.updateUser);

module.exports = router;
