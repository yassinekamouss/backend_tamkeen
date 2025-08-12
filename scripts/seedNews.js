require("dotenv").config();
const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const News = require("../models/News");

async function run() {
  try {
    await connectDB();
    const file = path.join(__dirname, "..", "news_data.json");
    const raw = fs.readFileSync(file, "utf8");
    const items = JSON.parse(raw);

    // Normaliser les documents pour correspondre au schéma
    const docs = items.map((n) => ({
      id: typeof n.id === "number" ? n.id : undefined,
      title: n.title,
      excerpt: n.excerpt,
      content: n.content,
      image: n.image || "",
      category: n.category,
      author: n.author,
      featured: !!n.featured,
      externalUrl: n.externalUrl || "",
      publishedAt: n.publishedAt ? new Date(n.publishedAt) : new Date(),
      slug: n.slug,
      published: n.published !== false,
    }));

    // Insérer/upserter par id si présent, sinon par slug/title
    let inserted = 0;
    for (const d of docs) {
      const query = d.id
        ? { id: d.id }
        : d.slug
        ? { slug: d.slug }
        : { title: d.title };
      const res = await News.findOneAndUpdate(query, d, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
      if (res) inserted += 1;
    }

    console.log(`Seed terminé: ${inserted} enregistrements traités.`);
    process.exit(0);
  } catch (err) {
    console.error("Seed échoué:", err);
    process.exit(1);
  }
}

run();
