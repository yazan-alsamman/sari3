import { Role } from '@prisma/client';

export type SocketPrincipal = { userId: string; role: Role };

const ROLES = new Set<string>(Object.values(Role));

/** ADR-010: access JWT from Socket.IO auth payload or Authorization header. */
export function readSocketAccessToken(input: {
  authToken?: unknown;
  authorizationHeader?: unknown;
}): string | null {
  if (typeof input.authToken === 'string') {
    const token = input.authToken.trim();
    if (token) return token;
  }
  const header = Array.isArray(input.authorizationHeader)
    ? input.authorizationHeader[0]
    : input.authorizationHeader;
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

/** ADR-002 payload is sub + role. Anything else is rejected. */
export function principalFromAccessPayload(payload: unknown): SocketPrincipal | null {
  if (!payload || typeof payload !== 'object') return null;
  const rec = payload as { sub?: unknown; role?: unknown };
  if (typeof rec.sub !== 'string' || rec.sub.length === 0) return null;
  if (typeof rec.role !== 'string' || !ROLES.has(rec.role)) return null;
  return { userId: rec.sub, role: rec.role as Role };
}
