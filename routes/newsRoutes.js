const express = require("express");
const router = express.Router();
const authAdmin = require("../middlewares/authAdmin");
const {
  getAllNews,
  getNewsCategories,
  createNews,
  updateNews,
  deleteNews,
} = require("../controllers/newsController");

// GET /api/news - Récupérer toutes les actualités avec filtres optionnels
router.get("/", getAllNews);

// GET /api/news/categories - Récupérer toutes les catégories
router.get("/categories", getNewsCategories);

// Routes admin (CRUD)
// POST /api/news - Créer une nouvelle actualité
router.post("/", authAdmin, createNews);

// PUT /api/news/:id - Mettre à jour une actualité
router.put("/:id", authAdmin, updateNews);

// DELETE /api/news/:id - Supprimer une actualité
router.delete("/:id", authAdmin, deleteNews);

module.exports = router;
