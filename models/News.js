const mongoose = require("mongoose");

// Utilitaire simple pour générer un slug à partir d'un titre
function slugify(text) {
  return String(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // retirer accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);
}

const NewsSchema = new mongoose.Schema(
  {
    // ID numérique pour compatibilité front (distinct de _id MongoDB)
    id: { type: Number, unique: true, index: true },

    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    image: { type: String, default: "" },
    category: { type: String, required: true, trim: true, index: true },
    author: { type: String, required: true, trim: true },
    featured: { type: Boolean, default: false, index: true },
    externalUrl: { type: String, default: "" },
    publishedAt: { type: Date, default: Date.now, index: true },

    // Champs additionnels présents dans le JSON d'exemple
    slug: { type: String, unique: true, sparse: true, index: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Pré-enregistrement: assigner un id incrémental si manquant et générer le slug
NewsSchema.pre("save", async function (next) {
  try {
    // Assigner un id numérique incrémental si absent
    if (this.isNew && (this.id === undefined || this.id === null)) {
      const last = await this.constructor
        .findOne({}, { id: 1 })
        .sort({ id: -1 })
        .lean();
      this.id = last && typeof last.id === "number" ? last.id + 1 : 1;
    }

    // Générer un slug si absent
    if (!this.slug && this.title) {
      let base = slugify(this.title);
      // Tenter un slug unique: ajouter l'id si collision possible
      let candidate = base;
      // Si l'id existe déjà au moment du save, c'est un bon suffixe unique
      if (this.id) candidate = `${base}-${this.id}`;
      this.slug = candidate || undefined;
    }
    next();
  } catch (err) {
    next(err);
  }
});

const News = mongoose.model("News", NewsSchema);
module.exports = News;
