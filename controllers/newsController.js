const asyncHandler = require("../utils/asyncHandler");
const News = require("../models/News");

// GET - Obtenir toutes les actualités avec filtres et pagination (MongoDB)
exports.getAllNews = asyncHandler(async (req, res) => {
  const { category, featured, limit = 10, page = 1 } = req.query;

  // Construire le filtre Mongo
  const filter = {};
  if (category && category !== "all") {
    filter.category = new RegExp(`^${String(category)}$`, "i");
  }
  if (featured === "true") {
    filter.featured = true;
  }
  // Par défaut, ne retourner que les éléments publiés si le champ existe
  filter.published = { $ne: false };

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  const [items, totalItems] = await Promise.all([
    News.find(filter)
      .sort({ publishedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    News.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      totalItems,
      hasNextPage: pageNum * limitNum < totalItems,
      hasPrevPage: pageNum > 1,
    },
  });
});

// getNewsById et getFeaturedNews retirées car non utilisées par le frontend

// GET - Obtenir les catégories d'actualités
exports.getNewsCategories = asyncHandler(async (_req, res) => {
  const categories = await News.distinct("category", {
    published: { $ne: false },
  });
  res.json({ success: true, data: categories });
});

// POST - Créer une nouvelle actualité (Admin) – conserve le champ id numérique
exports.createNews = asyncHandler(async (req, res) => {
  const {
    title,
    excerpt,
    content,
    image,
    category,
    author,
    featured,
    externalUrl,
    published = true,
    publishedAt,
  } = req.body;

  if (!title || !excerpt || !content || !category || !author) {
    return res.status(400).json({
      success: false,
      message:
        "Les champs title, excerpt, content, category et author sont requis",
    });
  }

  const created = await News.create({
    title,
    excerpt,
    content,
    image: image || "",
    category,
    author,
    featured: !!featured,
    externalUrl: externalUrl || "",
    published: !!published,
    // Utiliser la date fournie sinon maintenant
    publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
  });

  res
    .status(201)
    .json({
      success: true,
      data: created,
      message: "Actualité créée avec succès",
    });
});

// PUT - Mettre à jour une actualité (Admin)
exports.updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const numId = parseInt(id);
  if (Number.isNaN(numId)) {
    return res.status(400).json({ success: false, message: "ID invalide" });
  }

  const update = { ...req.body };
  if (update.publishedAt) update.publishedAt = new Date(update.publishedAt);

  const updated = await News.findOneAndUpdate({ id: numId }, update, {
    new: true,
  });

  if (!updated) {
    return res
      .status(404)
      .json({ success: false, message: "Article non trouvé" });
  }

  res.json({
    success: true,
    data: updated,
    message: "Actualité mise à jour avec succès",
  });
});

// DELETE - Supprimer une actualité (Admin)
exports.deleteNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const numId = parseInt(id);
  if (Number.isNaN(numId)) {
    return res.status(400).json({ success: false, message: "ID invalide" });
  }

  const deleted = await News.findOneAndDelete({ id: numId });
  if (!deleted) {
    return res
      .status(404)
      .json({ success: false, message: "Article non trouvé" });
  }
  res.json({
    success: true,
    data: deleted,
    message: "Actualité supprimée avec succès",
  });
});
