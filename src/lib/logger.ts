/**
 * Logger Utility
 * Post-Meeting Social Media Content Generator
 *
 * Centralized logging with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

/**
 * Formats log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const context = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
  const error = entry.error ? ` | ${entry.error.stack ?? entry.error.message}` : '';
  return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${context}${error}`;
}

/**
 * Creates log entry with current timestamp
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error,
  };
}

/**
 * Determines if log level should be output based on environment
 */
function shouldLog(level: LogLevel): boolean {
  const env = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';

  if (env === 'test') {
    return false; // Suppress logs in test environment
  }

  if (env === 'production') {
    return level !== 'debug'; // Suppress debug logs in production
  }

  return true; // Log everything in development
}

/**
 * Logger class with environment-aware behavior
 */
export class Logger {
  private static instance: Logger;
  private readonly serviceName: string;
  private readonly logHandlers: Record<LogLevel, (message: string) => void>;

  private constructor(serviceName: string) {
    this.serviceName = serviceName;
    // eslint-disable-next-line no-console
    const isBrowser = typeof window !== 'undefined';
    this.logHandlers = isBrowser
      ? {
          debug: (msg: string) => console.debug(msg), // eslint-disable-line no-console
          info: (msg: string) => console.info(msg), // eslint-disable-line no-console
          warn: (msg: string) => console.warn(msg), // eslint-disable-line no-console
          error: (msg: string) => console.error(msg), // eslint-disable-line no-console
        }
      : {
          debug: (msg: string) => process.stdout.write(msg + '\n'),
          info: (msg: string) => process.stdout.write(msg + '\n'),
          warn: (msg: string) => process.stderr.write(msg + '\n'),
          error: (msg: string) => process.stderr.write(msg + '\n'),
        };
  }

  static getInstance(serviceName = 'app'): Logger {
    if (!this.instance) {
      this.instance = new Logger(serviceName);
    }
    return this.instance;
  }

  /**
   * Debug level logging - development only
   */
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      const entry = createLogEntry('debug', message, { ...context, service: this.serviceName });
      this.logHandlers.debug(formatLogEntry(entry));
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      const entry = createLogEntry('info', message, { ...context, service: this.serviceName });
      this.logHandlers.info(formatLogEntry(entry));
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      const entry = createLogEntry('warn', message, { ...context, service: this.serviceName });
      this.logHandlers.warn(formatLogEntry(entry));
    }
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (shouldLog('error')) {
      const entry = createLogEntry(
        'error',
        message,
        { ...context, service: this.serviceName },
        error
      );
      this.logHandlers.error(formatLogEntry(entry));
    }
  }
}

// Export default instance
export const logger = Logger.getInstance();

// Export named instances for specific services
export const authLogger = Logger.getInstance('auth');
export const apiLogger = Logger.getInstance('api');
export const socialLogger = Logger.getInstance('social');
export const calendarLogger = Logger.getInstance('calendar');
export const recallLogger = Logger.getInstance('recall');
export const openaiLogger = Logger.getInstance('openai');
