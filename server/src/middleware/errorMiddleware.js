export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map(item => item.message).join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid task ID or field value";
  } else if (err.code === 11000) {
    status = 409;
    message = "A record with this value already exists";
  }

  if (process.env.NODE_ENV !== "production") console.error(err);
  res.status(status).json({ success: false, message: status === 500 && process.env.NODE_ENV === "production" ? "Something went wrong" : message });
}
