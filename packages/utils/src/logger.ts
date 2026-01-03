export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface LogContext {
  service?: string;
  workflowId?: string;
  executionId?: string;
  nodeId?: string;
  userId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  error?: Error;
}

function formatLogEntry(entry: LogEntry): string {
  const { level, message, context, timestamp, error } = entry;

  const parts: string[] = [];

  parts.push(`[${timestamp}]`);

  parts.push(`[${level}]`);

  if (context) {
    const contextParts: string[] = [];
    if (context.service) contextParts.push(`service=${context.service}`);
    if (context.workflowId) contextParts.push(`workflow=${context.workflowId}`);
    if (context.executionId) contextParts.push(`execution=${context.executionId}`);
    if (context.nodeId) contextParts.push(`node=${context.nodeId}`);
    if (contextParts.length > 0) {
      parts.push(`[${contextParts.join(" ")}]`);
    }
  }

  parts.push(message);

  if (error) {
    parts.push(`\n  Error: ${error.message}`);
    if (error.stack) {
      parts.push(`\n  Stack: ${error.stack}`);
    }
  }

  return parts.join(" ");
}

export function createLogger(defaultContext?: LogContext) {
  const log = (level: LogLevel, message: string, context?: LogContext, error?: Error) => {
    const logEntry: LogEntry = {
      level,
      message,
      context: { ...defaultContext, ...context },
      timestamp: new Date().toISOString(),
      error,
    };

    const formatted = formatLogEntry(logEntry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  };

  return {
    debug: (message: string, context?: LogContext) => log(LogLevel.DEBUG, message, context),
    info: (message: string, context?: LogContext) => log(LogLevel.INFO, message, context),
    warn: (message: string, context?: LogContext) => log(LogLevel.WARN, message, context),
    error: (message: string, error?: Error, context?: LogContext) =>
      log(LogLevel.ERROR, message, context, error),
  };
}

export const logger = createLogger();

export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) =>
    logger.error(message, error, context),
};
