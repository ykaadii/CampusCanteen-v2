// Centralized error handler — every route can just `next(err)` and this
// formats a consistent JSON error response instead of leaking stack
// traces to the client in production.
export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(status).json({ error: message });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
