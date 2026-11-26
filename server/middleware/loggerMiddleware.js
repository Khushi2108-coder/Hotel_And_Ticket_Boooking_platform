/**
 * Custom Request Logging Middleware
 * Demonstrates: Express middleware concept (req, res, next)
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  // Listen to response finish event to calculate elapsed time
  res.on("finish", () => {
    const elapsed = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? "❌" : "✅";
    console.log(
      `${statusColor} [${timestamp}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Time: ${elapsed}ms`
    );
  });

  next();
}
