const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authAdmin = require("../middlewares/authAdmin");

router.get("/", authAdmin, userController.getAllUsers);
router.get("/:id", authAdmin, userController.getUserById);
router.put("/:id", authAdmin, userController.updateUser);

module.exports = router;
