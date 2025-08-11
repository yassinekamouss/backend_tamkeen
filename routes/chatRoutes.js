const express = require("express");
const router = express.Router();
const { chatWithAI, rateLimiter } = require("../controllers/chatController");

// Public chat endpoint with basic rate limiting
router.post("/", rateLimiter, chatWithAI);

module.exports = router;
