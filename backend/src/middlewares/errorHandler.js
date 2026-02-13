import eventEmitter from "../events/eventEmitter.js";

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error("Error:", err);

  // Emit error event for monitoring and automation
  eventEmitter.emitError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id,
    workspaceId: req.workspace?.id,
  });

  // Prisma error handling
  if (err.code === "P2002") {
    const message = "Duplicate entry found. This resource already exists.";
    error = { message, statusCode: 409 };
  }

  // Prisma foreign key constraint error
  if (err.code === "P2003") {
    const message =
      "Foreign key constraint failed. Referenced resource does not exist.";
    error = { message, statusCode: 400 };
  }

  // Prisma record not found error
  if (err.code === "P2025") {
    const message = "Record not found.";
    error = { message, statusCode: 404 };
  }

  // Validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = { message, statusCode: 400 };
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token. Please log in again.";
    error = { message, statusCode: 401 };
  }

  // JWT expired error
  if (err.name === "TokenExpiredError") {
    const message = "Your token has expired. Please log in again.";
    error = { message, statusCode: 401 };
  }

  // Cast error (invalid ObjectId)
  if (err.name === "CastError") {
    const message = "Resource not found.";
    error = { message, statusCode: 404 };
  }

  // Syntax error (invalid JSON)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    const message = "Invalid JSON in request body.";
    error = { message, statusCode: 400 };
  }

  // Rate limit error
  if (err.status === 429) {
    const message = "Too many requests. Please try again later.";
    error = { message, statusCode: 429 };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  // Don't expose stack trace in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(isDevelopment && { stack: err.stack }),
    },
    ...(isDevelopment && { details: err }),
  });
};

/**
 * Async error wrapper for catching errors in async routes
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Validation error creator
 */
const createValidationError = (message, field) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.field = field;
  return error;
};

/**
 * Authorization error creator
 */
const createAuthorizationError = (message = "Access denied") => {
  const error = new Error(message);
  error.statusCode = 403;
  return error;
};

/**
 * Not found error creator
 */
const createNotFoundError = (resource = "Resource") => {
  const error = new Error(`${resource} not found`);
  error.statusCode = 404;
  return error;
};

/**
 * Conflict error creator
 */
const createConflictError = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

/**
 * Unprocessable entity error creator
 */
const createUnprocessableEntityError = (message) => {
  const error = new Error(message);
  error.statusCode = 422;
  return error;
};

export {
  errorHandler,
  asyncHandler,
  notFound,
  createValidationError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  createUnprocessableEntityError,
};
