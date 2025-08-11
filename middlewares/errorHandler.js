// Centralized error handling middleware
// Usage: next(createHttpError(400, 'Bad Request')) or throw from async

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Erreur serveur";
  const details = err.details;

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error("[ERROR]", status, message, details || "");
  }

  res
    .status(status)
    .json({ success: false, message, ...(details && { details }) });
}

module.exports = errorHandler;
