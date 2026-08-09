# Mobile Notifications

## Channels

- Driver offers.
- Order updates.
- Operational alerts.
- Rating reminders.

## Requirements

- Deep-link notifications to the relevant order.
- Do not expose sensitive information in notification text.
- Handle duplicate delivery gracefully.
- Store notification IDs for deduplication where useful.
- If a push is missed, the app must reconcile state from the API.

Push delivery is not the source of truth; the backend order state is.
## Related documents

- [`../backend/NOTIFICATIONS.md`](../backend/NOTIFICATIONS.md)
- [`../backend/REALTIME.md`](../backend/REALTIME.md)
