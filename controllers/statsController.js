const Program = require("../models/Program");
const Personne = require("../models/Personne");
const TestElegibilite = require("../models/TestElegibilite");

exports.getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalPrograms, activePrograms, totalTests] =
      await Promise.all([
        Personne.countDocuments(),
        Program.countDocuments(),
        Program.countDocuments({ isActive: true }),
        TestElegibilite.countDocuments(),
      ]);

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [newUsers7d, tests7d] = await Promise.all([
      Personne.countDocuments({ createdAt: { $gte: since } }),
      TestElegibilite.countDocuments({ createdAt: { $gte: since } }),
    ]);

    const topSectors = await TestElegibilite.aggregate([
      { $group: { _id: "$secteurTravail", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const activeByRegion = await TestElegibilite.aggregate([
      { $group: { _id: "$region", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return res.json({
      totals: { totalUsers, totalPrograms, activePrograms, totalTests },
      last7d: { newUsers: newUsers7d, tests: tests7d },
      topSectors,
      activeByRegion,
    });
  } catch (e) {
    console.error("getAdminStats error:", e);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
