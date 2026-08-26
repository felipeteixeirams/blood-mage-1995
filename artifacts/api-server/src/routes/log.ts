import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();

export interface LogEntryInput {
  id?: string;
  timestamp?: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  namespace: string;
  message: string;
  data?: any;
  sessionId?: string;
}

function processLogEntry(entry: LogEntryInput) {
  if (!entry || typeof entry !== "object") return;

  const level = entry.level?.toUpperCase() || "INFO";
  const namespace = (entry.namespace || "APP").toUpperCase();
  const sessionId = entry.sessionId || "unknown";
  const message = entry.message || "";
  const data = entry.data;

  const logMeta = {
    namespace,
    sessionId,
    timestamp: entry.timestamp || new Date().toISOString(),
    data,
  };

  if (level === "ERROR") {
    logger.error(logMeta, message);
  } else if (level === "WARN") {
    logger.warn(logMeta, message);
  } else if (level === "INFO") {
    logger.info(logMeta, message);
  } else {
    logger.debug(logMeta, message);
  }
}

router.post("/log", (req: Request, res: Response) => {
  try {
    const body = req.body;
    const entries: LogEntryInput[] = Array.isArray(body)
      ? body
      : body?.logs && Array.isArray(body.logs)
      ? body.logs
      : [body];

    let processedCount = 0;
    for (const entry of entries) {
      if (entry && typeof entry === "object") {
        processLogEntry(entry);
        processedCount++;
      }
    }

    res.status(200).json({ success: true, processed: processedCount });
  } catch (error) {
    logger.error({ error }, "Failed to process incoming client log batch");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
