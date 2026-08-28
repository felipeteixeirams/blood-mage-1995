import { type Request, type Response, type NextFunction } from "express";

/**
 * Custom middleware to apply secure HTTP headers to all incoming API requests.
 * This provides defense-in-depth security with zero external dependencies.
 */
export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Prevent MIME-sniffing by instructing browsers to respect the declared Content-Type
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking by restricting framing of pages
  res.setHeader("X-Frame-Options", "DENY");

  // Protect referrer information leaked during cross-origin transitions
  res.setHeader("Referrer-Policy", "no-referrer");

  // Restrict content sources and framing. Safe defaults for standard JSON APIs.
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none';",
  );

  // Disable unsafe legacy XSS auditor (superseded by modern CSP, but good hygiene)
  res.setHeader("X-XSS-Protection", "0");

  // Enforce HTTPS connection requirements
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=15552000; includeSubDomains",
  );

  next();
}
