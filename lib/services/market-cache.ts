import { MarketDataError, normalizeMarketError } from "./market-errors.ts";

export type Snapshot<T> = { value: T; retrievedAt: string; ageSeconds: number; stale: boolean };
type CachePolicy = { ttlMs: number; staleMs: number };
type Entry<T> = { value: T; at: number; retryAt: number };

export function createMarketCache<T>(policy: CachePolicy, capacity = 256, clock = Date.now) {
  const entries = new Map<string, Entry<T>>();
  const pending = new Map<string, Promise<Snapshot<T>>>();

  function snapshot(entry: Entry<T>, stale: boolean): Snapshot<T> {
    return { value: entry.value, retrievedAt: new Date(entry.at).toISOString(), ageSeconds: Math.max(0, Math.floor((clock() - entry.at) / 1000)), stale };
  }

  return async (key: string, load: () => Promise<T>) => {
    const previous = entries.get(key);
    const now = clock();
    if (previous && now - previous.at < policy.ttlMs) return snapshot(previous, false);
    if (previous && now < previous.retryAt && now - previous.at < policy.staleMs) return snapshot(previous, true);
    const inFlight = pending.get(key);
    if (inFlight) return inFlight;
    if (pending.size >= capacity) throw new MarketDataError("rate_limited");

    const refresh = Promise.resolve().then(load).then((value) => {
      const entry = { value, at: clock(), retryAt: 0 };
      entries.delete(key);
      entries.set(key, entry);
      if (entries.size > capacity) entries.delete(entries.keys().next().value!);
      return snapshot(entry, false);
    }).catch((cause) => {
      const error = normalizeMarketError(cause);
      if (previous && ["timeout", "rate_limited", "provider_unavailable"].includes(error.code) && clock() - previous.at < policy.staleMs) {
        previous.retryAt = clock() + Math.min(policy.ttlMs, 15000);
        return snapshot(previous, true);
      }
      throw error;
    }).finally(() => { pending.delete(key); });
    pending.set(key, refresh);
    return refresh;
  };
}

export function createMarketTransport({ concurrency = 6, maxQueued = 48, timeoutMs = 6000, retryDelayMs = 250, cooldownMs = 30_000 } = {}) {
  let active = 0;
  let cooldownUntil = 0;
  const queue: Array<() => void> = [];

  return async function request<T>(load: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (Date.now() < cooldownUntil) throw new MarketDataError("rate_limited");
    if (active >= concurrency) {
      if (queue.length >= maxQueued) throw new MarketDataError("rate_limited");
      await new Promise<void>((resolve, reject) => {
        const resume = () => { clearTimeout(wait); resolve(); };
        const wait = setTimeout(() => {
          const index = queue.indexOf(resume);
          if (index >= 0) queue.splice(index, 1);
          reject(new MarketDataError("timeout"));
        }, timeoutMs);
        queue.push(resume);
      });
    } else active += 1;

    try {
      if (Date.now() < cooldownUntil) throw new MarketDataError("rate_limited");
      for (let attempt = 0; ; attempt += 1) {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          return await Promise.race([
            Promise.resolve().then(() => load(controller.signal)),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => {
                reject(new MarketDataError("timeout"));
                controller.abort();
              }, timeoutMs);
            })
          ]);
        } catch (reason) {
          clearTimeout(timer);
          const error = normalizeMarketError(reason);
          if (error.code === "rate_limited") cooldownUntil = Date.now() + cooldownMs;
          if (attempt || error.code !== "provider_unavailable") throw error;
          await new Promise<void>((resolve) => setTimeout(resolve, retryDelayMs));
        } finally {
          clearTimeout(timer);
        }
      }
    } finally {
      const next = queue.shift();
      if (next) next();
      else active -= 1;
    }
  };
}
