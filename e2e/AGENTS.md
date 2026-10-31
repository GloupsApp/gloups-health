# Acceptance test conventions

- Use Army `e2e` for API and mobile acceptance. Keep Node's test runner for unit, CQRS, and architecture checks; do not introduce another acceptance runner.
- API specs use an engine-free target, `fetch`, runtime schema/value matchers, and a serial group with disposable PostgreSQL/API fixtures. `bun run test:api` builds the API and runs this gate.
- Mobile specs use `@e2e-dev/mobile` with iOS/Android targets and synthetic credentials. Device, Metro, inbox, and API setup lives in [../README.md](../README.md).
- Use synthetic `@example.test` identities and the local mail sink. Do not send messages to people or use real health data.
- Cleanup removes only resources created by that test run. Never erase a simulator/emulator, reset a device keychain, or remove an unrelated database/container/volume.
- Preserve ownership isolation, first-access provisioning, persistence, recovery, revocation, sign-out, expiry, delivery-failure, and throttle coverage when changing authentication flows. Schema changes need additive migration/persistence coverage.
- Keep generated Army reports and traces in ignored `.e2e/` directories. Avoid secret-bearing URLs and credentials in handoffs.

The validation owner coordinates exclusive use of shared ports and devices. Report an unavailable Docker daemon, native device, Metro server, API, or inbox as a blocker; never claim native acceptance from unit tests or a successful export.
