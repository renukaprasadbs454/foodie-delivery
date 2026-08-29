import type { AccessToken, RefreshToken } from '../types/tokens';

/**
 * Shared logging utility — Blueprint §39 / System Design §30.
 * DEBUG must be stripped from release builds via Metro/Babel transform in apps.
 */

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export type LogContext = {
  requestId?: string;
  screen?: string;
  [key: string]: unknown;
};

type LoggerSink = {
  log: (level: LogLevel, message: string, context?: LogContext) => void;
};

const SENSITIVE_KEY_PATTERN =
  /(token|otp|password|authorization|refresh|accessToken|refreshToken|card|upi)/i;

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;
  const cleaned: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      cleaned[key] = '[REDACTED]';
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}

/** Compile-time / lint surface: never pass branded tokens into logger. */
export type ForbiddenLogValue = AccessToken | RefreshToken;

declare const process: { env?: { NODE_ENV?: string } } | undefined;

const defaultSink: LoggerSink = {
  log(level, message, context) {
    const payload = sanitizeContext(context);
    const line = payload
      ? `[Foodie][${level}] ${message} ${JSON.stringify(payload)}`
      : `[Foodie][${level}] ${message}`;
    switch (level) {
      case 'ERROR':
        console.error(line);
        break;
      case 'WARN':
        console.warn(line);
        break;
      case 'DEBUG':
        if (typeof __DEV__ !== 'undefined' ? __DEV__ : (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production')) {
          console.debug(line);
        }
        break;
      default:
        console.info(line);
    }
  },
};

let sink: LoggerSink = defaultSink;

export function setLoggerSink(next: LoggerSink): void {
  sink = next;
}

export const logger = {
  error(message: string, context?: LogContext): void {
    sink.log('ERROR', message, context);
  },
  warn(message: string, context?: LogContext): void {
    sink.log('WARN', message, context);
  },
  info(message: string, context?: LogContext): void {
    sink.log('INFO', message, context);
  },
  /**
   * DEBUG — apps MUST strip these calls from release binaries (Blueprint §39.1).
   */
  debug(message: string, context?: LogContext): void {
    sink.log('DEBUG', message, context);
  },
};

declare const __DEV__: boolean | undefined;
