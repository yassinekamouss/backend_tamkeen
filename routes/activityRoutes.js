const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const authAdmin = require("../middlewares/authAdmin");

// GET /api/admin/activity?limit=5&before=<ISO|string id>&type=<csv>
router.get("/", authAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 50);
    const before = req.query.before; // ISO date or ObjectId string (we'll use date)
    const types = req.query.type
      ? String(req.query.type)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const filter = {};
    if (before) {
      const d = new Date(before);
      if (!isNaN(d.getTime())) filter.createdAt = { $lt: d };
    }
    if (types.length > 0) {
      filter.type = { $in: types };
    }

    const items = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, data: items });
  } catch (e) {
    console.error("GET /admin/activity error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
