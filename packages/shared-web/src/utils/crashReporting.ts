/**
 * Crash reporting bootstrap — System Design §29 (web/Next.js integration).
 */

export type CrashContext = {
  appVersion?: string;
  osVersion?: string;
  deviceModel?: string;
  screenName?: string;
  userId?: string;
  userType?: string;
  role?: string;
  recentRequestIds?: string[];
};

export type CrashReporter = {
  init: (options: {
    appName: string;
    appVersion?: string;
    dsn?: string;
  }) => Promise<void> | void;
  captureException: (error: unknown, context?: CrashContext) => void;
  captureNonFatal: (error: unknown, context?: CrashContext) => void;
  setContext: (context: CrashContext) => void;
};

const recentRequestIds: string[] = [];
const MAX_REQUEST_IDS = 5;

let reporter: CrashReporter | null = null;
let initialized = false;
let currentContext: CrashContext = {};

export const noOpCrashReporter: CrashReporter = {
  init: () => undefined,
  captureException: () => undefined,
  captureNonFatal: () => undefined,
  setContext: () => undefined,
};

export async function initCrashReporting(
  crashReporter: CrashReporter,
  options: { appName: string; appVersion?: string; dsn?: string },
): Promise<void> {
  reporter = crashReporter;
  await reporter.init(options);
  initialized = true;
}

export function recordRequestId(requestId: string | undefined): void {
  if (!requestId) return;
  recentRequestIds.unshift(requestId);
  if (recentRequestIds.length > MAX_REQUEST_IDS) {
    recentRequestIds.length = MAX_REQUEST_IDS;
  }
  setCrashContext({ recentRequestIds: [...recentRequestIds] });
}

export function setCrashContext(context: CrashContext): void {
  currentContext = {
    ...currentContext,
    ...context,
    recentRequestIds: context.recentRequestIds ?? currentContext.recentRequestIds,
  };
  reporter?.setContext(currentContext);
}

export function captureCrashException(
  error: unknown,
  context?: CrashContext,
): void {
  if (!initialized || !reporter) return;
  reporter.captureException(error, { ...currentContext, ...context });
}

export function captureNonFatalError(
  error: unknown,
  context?: CrashContext,
): void {
  if (!initialized || !reporter) return;
  reporter.captureNonFatal(error, { ...currentContext, ...context });
}

export function isCrashReportingInitialized(): boolean {
  return initialized;
}
