import pino from "pino";
import fs from "fs";
import path from "path";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "data", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isDev = process.env.NODE_ENV !== "production";

// Create file stream for persistent logging
const logFile = path.join(logsDir, "app.log");
const fileStream = fs.createWriteStream(logFile, { flags: "a" });

// Create multi-destination transport: console (pretty) + file (JSON)
const streams: pino.StreamEntry[] = [
  // Console output with pretty formatting in dev, JSON in prod
  {
    level: "trace",
    stream: isDev
      ? (await import("pino-pretty")).default({
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
          singleLine: false,
        })
      : process.stdout,
  },
  // File output always in JSON format for parsing
  {
    level: "trace",
    stream: fileStream,
  },
];

// Create the logger instance
const logger = pino(
  {
    level: isDev ? "debug" : "info",
    base: {
      env: process.env.NODE_ENV || "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream(streams)
);

// Create child loggers for different modules
export const createLogger = (module: string) => logger.child({ module });

// Default logger export
export default logger;

// Convenience re-exports for common log levels
export const log = {
  trace: logger.trace.bind(logger),
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  fatal: logger.fatal.bind(logger),
};
