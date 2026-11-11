import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import connectDb from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

// Restrict cross-origin requests to the declared client origin.
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));

// Shared API limit: maximum 100 requests per IP in a rolling 15-minute window.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again in 15 minutes."
  }
});
app.use("/api", apiLimiter);

// Stricter limiter for auth endpoints to slow brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again in 15 minutes."
  }
});
app.use("/api/auth", authLimiter);

if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// Basic security headers without helmet dependency.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0"); // Modern browsers ignore this; CSP is the real defence.
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.get("/api/health", (req, res) => res.json({ success: true, message: "Task API is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
  await connectDb();
  app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
} catch (error) {
  console.error("Server startup failed:", error.message);
  process.exit(1);
}
