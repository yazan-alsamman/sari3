/**
 * Phase 1 backend base URL for health probes only.
 * Domain APIs (auth/orders) are not wired yet — demo still uses localStorage (Phase 9 cutover).
 */
export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}
