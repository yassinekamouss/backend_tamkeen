// Standard API JSON response helpers
module.exports = {
  ok(res, data = {}, status = 200) {
    return res.status(status).json({ success: true, ...data });
  },
  created(res, data = {}) {
    return res.status(201).json({ success: true, ...data });
  },
  error(res, message = "Erreur serveur", status = 500, extra = {}) {
    return res.status(status).json({ success: false, message, ...extra });
  },
};
