const express = require("express");
const router = express.Router();
const { getHelloNews } = require("../controllers/newsController");

// GET /api/news -> { message: "helloNews" }
router.get("/", getHelloNews);

module.exports = router;
