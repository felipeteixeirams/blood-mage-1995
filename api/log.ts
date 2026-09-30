import type { IncomingMessage, ServerResponse } from "http";

export interface LogEntryInput {
  id?: string;
  timestamp?: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  namespace: string;
  message: string;
  data?: any;
  sessionId?: string;
}

async function parseBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) {
    return (req as any).body;
  }
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on("error", (err) => reject(err));
  });
}

function processLogEntry(entry: LogEntryInput) {
  if (!entry || typeof entry !== "object") return;

  const level = entry.level?.toUpperCase() || "INFO";
  const namespace = (entry.namespace || "APP").toUpperCase();
  const sessionId = entry.sessionId || "unknown";
  const timestamp = entry.timestamp || new Date().toISOString();
  const message = entry.message || "";
  const data = entry.data;

  const levelLower = level === "WARN" ? "warning" : level.toLowerCase();
  const sessionPrefix = `[session:${sessionId}]`;
  const formattedHeader = `[VERCEL_RUNTIME] [${level}] [${namespace}] ${sessionPrefix} ${message}`;

  const payload = {
    level: levelLower,
    timestamp,
    namespace,
    sessionId,
    message,
    data,
  };

  if (level === "ERROR") {
    console.error(formattedHeader, data !== undefined ? data : "");
  } else if (level === "WARN") {
    console.warn(formattedHeader, data !== undefined ? data : "");
  } else if (level === "INFO") {
    console.info(formattedHeader, data !== undefined ? data : "");
  } else {
    console.log(formattedHeader, data !== undefined ? data : "");
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  try {
    const parsed = await parseBody(req);
    const entries: LogEntryInput[] = Array.isArray(parsed)
      ? parsed
      : parsed?.logs && Array.isArray(parsed.logs)
      ? parsed.logs
      : [parsed];

    let processedCount = 0;
    for (const entry of entries) {
      if (entry && typeof entry === "object") {
        processLogEntry(entry);
        processedCount++;
      }
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, processed: processedCount }));
  } catch (error) {
    console.error("[VERCEL_RUNTIME] [ERROR] [API_LOG_HANDLER] Failed to ingest logs:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}
