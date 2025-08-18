const Activity = require("../models/Activity");

function simplify(doc) {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    entity: doc.entity,
    meta: doc.meta || {},
    actor: doc.actor || null,
    createdAt: doc.createdAt,
  };
}

// Insert activity in DB and emit via socket to admins room
async function logActivity(req, entry) {
  const created = await Activity.create(entry);
  try {
    const io = req.app.get("io");
    if (io) {
      io.to("admins").emit("activity:new", simplify(created));
    }
  } catch (e) {
    console.warn("[activity] socket emit failed:", e?.message || e);
  }
  return created;
}

module.exports = { logActivity };
