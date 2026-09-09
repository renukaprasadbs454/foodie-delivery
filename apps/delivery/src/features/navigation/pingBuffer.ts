import type { LocationPingPayload } from './types';

/**
 * Offline location-ping buffer — SD §12.4.
 * Keep last 2–3 samples; on reconnect flush most-recent only.
 */
const MAX_BUFFER = 3;

export class LocationPingBuffer {
  private samples: LocationPingPayload[] = [];

  push(sample: LocationPingPayload): void {
    this.samples.push(sample);
    if (this.samples.length > MAX_BUFFER) {
      this.samples = this.samples.slice(-MAX_BUFFER);
    }
  }

  /** Most recent sample, or null if empty. Does not clear. */
  peekMostRecent(): LocationPingPayload | null {
    if (this.samples.length === 0) return null;
    return this.samples[this.samples.length - 1] ?? null;
  }

  /** Take most recent and clear the buffer (flush semantics). */
  takeMostRecentAndClear(): LocationPingPayload | null {
    const latest = this.peekMostRecent();
    this.samples = [];
    return latest;
  }

  clear(): void {
    this.samples = [];
  }

  size(): number {
    return this.samples.length;
  }
}

/** Elevated tier: 1 ping / 3 seconds (UI-API Navigation AC + backend rate limit). */
export const LOCATION_PING_INTERVAL_MS = 3_000;
