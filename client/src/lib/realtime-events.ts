export const REALTIME_EVENT = "sareee-realtime";

export type RealtimeDetail = {
  event: string;
  payload: Record<string, unknown>;
};

export function publishRealtime(event: string, payload: unknown): void {
  const body =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  window.dispatchEvent(
    new CustomEvent<RealtimeDetail>(REALTIME_EVENT, {
      detail: { event, payload: body },
    }),
  );
}
