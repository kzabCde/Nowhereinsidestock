import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

export function createWorkerHandler(config: () => { enabled: boolean; secret?: string }, run: () => Promise<unknown>) {
  return async (request: Request) => {
    const { enabled, secret } = config();
    const headers = { "Cache-Control": "no-store" };
    if (!enabled || !secret || secret.length < 32) return Response.json({ message: "Worker unavailable" }, { status: 404, headers });
    const authorization = request.headers.get("authorization") ?? "";
    if (!timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`))) {
      return Response.json({ message: "Unauthorized" }, { status: 401, headers });
    }
    try {
      return Response.json(await run(), { headers });
    } catch {
      return Response.json({ message: "Worker failed; retry the scheduled job." }, { status: 503, headers });
    }
  };
}
