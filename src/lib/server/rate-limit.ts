/**
 * Límite de envíos por IP en memoria (ventana deslizante).
 * Es una protección básica por instancia: en plataformas serverless cada
 * instancia tiene su propio contador. Para un límite global, sustituir por un
 * almacén compartido (p. ej. Redis).
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  /** Registra un intento y devuelve los segundos de espera si se supera el límite. */
  check(key: string, now = Date.now()): { ok: true } | { ok: false; retryAfter: number } {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return { ok: false, retryAfter: Math.ceil((recent[0] + this.windowMs - now) / 1000) };
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 5000) this.prune(now);
    return { ok: true };
  }

  private prune(now: number) {
    for (const [k, v] of this.hits) if (v.every((t) => now - t >= this.windowMs)) this.hits.delete(k);
  }
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
