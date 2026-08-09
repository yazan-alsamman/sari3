# Rating UX

## Purpose

Customer rating experience after backend eligibility is granted.

## Behavior

After the backend marks an order eligible for rating:

- Show a 1–5 star selector.
- Provide optional free-text feedback.
- Clearly identify the completed/eligible order.
- Prevent accidental duplicate submission.
- Allow retry when network fails.
- Do not permit rating another driver/order through client-side manipulation.

The backend validates eligibility and uniqueness.

## Open policy

Whether rating happens after `COMPLETED` or during `RATING_PENDING` is **TBD — ADR-004 / ADR-012**.

Mobile follows backend eligibility signals; it does not decide the state machine.

## Related documents

- [`ORDER_FLOW.md`](ORDER_FLOW.md)
- [`../backend/RATINGS.md`](../backend/RATINGS.md)
- [`../backend/ORDER_LIFECYCLE.md`](../backend/ORDER_LIFECYCLE.md)
