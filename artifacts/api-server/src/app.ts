import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { securityHeaders } from "./middlewares/security";

const app: Express = express();

// Disable x-powered-by header to prevent Express footprint information leakage
app.disable("x-powered-by");

// Apply custom security headers middleware for defense-in-depth protection
app.use(securityHeaders);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Parse allowed origins from environment variables for flexible and secure deployment configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

// Restrict CORS origins to avoid overly permissive '*' wildcard configuration and prevent subdomain spoofing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Check if origin is in the explicitly allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // In non-production environments, allow localhost origins
      if (process.env.NODE_ENV !== "production") {
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (isLocalhost) {
          callback(null, true);
          return;
        }
      }

      // Instruct the middleware to reject the origin without raising a server-side exception
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
