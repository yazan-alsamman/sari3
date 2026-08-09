# Mobile Release

## Android

- Separate debug/release signing.
- Release keystore outside source control.
- Versioning controlled from CI/release process.
- Production API base URL must be explicit.
- No debug logging or test credentials.

## iOS

- Production signing and provisioning handled securely.
- Environment configuration separated from development.

## Store readiness

- Privacy policy.
- Location permission rationale.
- Push notification permission rationale.
- App screenshots and metadata.
- Crash reporting/observability.
- Account deletion/data handling policy where applicable.
## Related documents

- [`TESTING.md`](TESTING.md)
- [`../backend/DEPLOYMENT.md`](../backend/DEPLOYMENT.md)
