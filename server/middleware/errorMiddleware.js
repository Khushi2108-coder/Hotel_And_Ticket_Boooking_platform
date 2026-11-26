import mongoose from "mongoose";

/**
 * 404 Route Not Found Middleware
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found: [${req.method}] ${req.originalUrl}`,
  });
}

/**
 * Global Express Error Handling Middleware
 * Handles Mongoose-specific errors + generic errors
 */
export function errorHandler(err, req, res, next) {
  console.error("Server Error:", err);

  // Mongoose: Cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid value for field: ${err.path}`,
    });
  }

  // Mongoose: Duplicate key (unique constraint violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue?.[field];
    return res.status(409).json({
      success: false,
      message: `${field} '${value}' already exists.`,
    });
  }

  // Mongoose: Validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: messages,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Authentication token has expired.",
    });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size too large. Maximum allowed size is 5MB.",
    });
  }

  // Generic error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error.",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}
