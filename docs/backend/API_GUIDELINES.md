# API Guidelines

Base URL:

`/api/v1`

## Response shape

Use a consistent success/error contract across modules.

## DTOs

- Validate all external input.
- Reject unknown/unsafe fields where appropriate.
- Separate request DTOs from domain entities.

## Errors

Use stable machine-readable error codes plus human-readable messages.

Examples:

- `AUTH_UNAUTHORIZED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `ORDER_INVALID_STATE`
- `ORDER_NOT_FOUND`
- `DISPATCH_OFFER_EXPIRED`
- `DRIVER_CAPACITY_EXCEEDED`
- `RATING_NOT_ELIGIBLE`

## Idempotency

Critical POST commands accept an idempotency key and return the original result on safe retry.

## OpenAPI

Every endpoint documents:

- Auth.
- Request.
- Response.
- Errors.
- Authorization.
- Idempotency requirements.
## Related documents

- [`API_ENDPOINT_CATALOG.md`](API_ENDPOINT_CATALOG.md)
- [`AUTH_SECURITY.md`](AUTH_SECURITY.md)
- [`adrs/ADR-017-idempotency.md`](adrs/ADR-017-idempotency.md)
