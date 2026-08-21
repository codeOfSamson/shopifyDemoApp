export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEvent = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
};

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const event: LogEvent = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
  // Stand-in for a real APM/RUM sink (Datadog, Sentry, etc.) — structured
  // JSON on one line is what those vendors' log drains expect.
  console.log(JSON.stringify(event));
  return event;
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
};
