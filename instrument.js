// instrument.js
const Sentry = require("@sentry/node");

// Initialisation Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: 1.0
});

// On exporte Sentry pour l'utiliser ailleurs
module.exports = Sentry;
