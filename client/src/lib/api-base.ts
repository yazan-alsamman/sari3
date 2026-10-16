/**
 * Backend base URL. Auth, zones, pricing, orders, and the Socket.IO path use this host.
 * Driver availability, location, and offers use the same host.
 */
export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}
