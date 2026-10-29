# Native authentication acceptance

Source and case implementation are in progress under AUTH-003 / draft PR #26.
No complete native, social-provider or release acceptance is claimed.

Use official TesterArmy `e2e` 0.21.3 / `@e2e-dev/mobile` 0.12.4 with
`agent-device` 0.21.29. No model login/calls, unit tests, TDD or cloud upload.
`e2e.config.ts` isolates driver state under ignored `.e2e/agent-device-auth003`.
Passwords are generated in memory and filled through Army Secret handles. A
private link helper delivers one-time URLs directly to the assigned OS device,
with subprocess output/errors suppressed; the runner never records those URLs.

## Owned environment

Only the isolated AUTH-003 API 4340, Postgres 25440, sink 4341 and Metro 8085 are
used. The tests reject a different database. Before each credential case they
reset only its counters and memory sink. Fixtures use generated
`auth003-…@example.test` identities; no real email or health data is involved.
Do not run two suites concurrently against this shared sink/device session.

| Target  | Assigned device                                                   | Runtime                                           |
| ------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| ios     | Gloups AUTH-003 015e iPhone, C2C9EC33-9411-4AD5-986D-277CC6BE0383 | iPhone 17, iOS 27.0                               |
| ios-duo | Gloups AUTH-003 015e Duo, EF701CA4-D508-4018-914B-72E41E855128    | iPhone Duo, iOS 27.1                              |
| android | Gloups_AUTH_003_015e / emulator-5614                              | Pixel 8 profile, Android 37 Google Play 16K arm64 |

These devices/AVD were created for this packet. Existing unrelated booted devices,
the user's Pixel AVD and global driver sessions were not used. iPhone 17 is not
compatible with the installed 27.1 runtime; the actual assigned regular runtime
is 27.0. No physical iPhone is assigned yet.

SDK-compatible official Go assets were verified against published release hashes:
iOS Go 58.0.7, Android Go 58.0.5. Go target bundle IDs are `host.exp.Exponent` /
`host.exp.exponent`. `GLOUPS_AUTH003_NATIVE=1` selects `app.gloups.health` debug
builds, with the official Expo development client for Gloups scheme testing.
Native projects, binaries, reports and device state stay ignored.

Run from root after starting the actual services/builds:

```sh
bun run e2e:mobile
GLOUPS_AUTH003_NATIVE=1 bunx e2e run --target ios --tag native
GLOUPS_AUTH003_NATIVE=1 GLOUPS_AUTH003_IOS_UDID=EF701CA4-D508-4018-914B-72E41E855128 bunx e2e run --target ios-duo --tag native
GLOUPS_AUTH003_NATIVE=1 bunx e2e run --target android --tag native
```

`GLOUPS_AUTH003_IOS_UDID` must match the selected target and one of this packet's
owned devices. `GLOUPS_AUTH003_FOLD=1` requests an open pose for the Duo smoke;
that check fails if the engine cannot verify the hinge sample. Never treat an
unverified pose as a pass. Separate Go runs skip custom-scheme credential cases
explicitly; a skip is not acceptance.

## Observed checkpoints

- Regular iPhone Go screen/language smoke: run
  `01a1850e-0827-746b-813b-fc7c5372031c`, 1/1 passed in 16.36 seconds.
- Runtime config initially failed on-device because a null manifest extra was
  served as an object. The explicit string configuration fixes startup; static
  export alone did not reveal this problem.
- Duo Go and initial native navigation encountered system Open-in-app prompts;
  Android Go first-run menu/process-close attempts also failed before acceptance.
- Duo fold run `01a18526-a4de-7e76-a74e-15d25fde216e` failed: the pose request was
  sent but the first hinge-angle read returned no sample. Reboot/install/screen
  inspection affected only the owned Duo. No fold acceptance is recorded.
- Initial local debug builds succeeded on iOS and Android. Native credential
  attempts were interrupted at repeated system link prompts. The official
  development client was added for the next launcher/build check.

## Implemented cases and remaining coverage

`authentication.e2e.ts` covers public native controls and explicit en/fr choice.
`credentials.e2e.ts` exercises actual registration/password validation, unverified
denial, French verification return, cold reset/session revocation, durable
session/account switching, preserving the last method, and confirmed deletion
with another session. Their presence is not evidence of a passing run.

The full MOBILE-01–08 matrix remains incomplete: native credential results,
warm/cold/replayed/expired links, delayed HTTP/SecureStore races, foreground/API
failure/offline sign-out, reinstall, light/dark/large text/screen reader behavior,
Duo poses and actual Google/Apple/linking cases require observed results. Native
Apple credential-state behavior requires the authorized physical iPhone.
Live provider credentials/HTTPS callbacks and release retention policy remain
external prerequisites; local failures are not substituted for provider evidence.

## Private transport-fault setup

Port 4342 is reserved for this packet's loopback-only transparent relay. It
requires `APP_ENV=local`, the exact isolated database and a generated control
secret in ignored `.superpowers/sdd/2026-10-28-authentication-implementation/relay.env.local`.
Preserve an existing file and never print its secret. The relay forwards actual
4340 responses/cookies and can hold one response for at most 25 seconds or cut a
connection; it does not fabricate auth/provider payloads.

```sh
node e2e/mobile/helpers/http-fault-relay.ts
GLOUPS_AUTH003_FAULTS=1 bunx e2e run --target api --tag relay
```

Before native fault cases, restart only the owned Metro with
`EXPO_PUBLIC_API_URL=http://127.0.0.1:4342` and rebuild/reopen its config. On the
owned Android serial, reverse TCP 4342 to host 4342 as well as the Metro port.
Then `GLOUPS_AUTH003_NATIVE=1 GLOUPS_AUTH003_FAULTS=1 bunx e2e run --target <assigned-target> --tag faults`
selects actual delayed-cookie/account/foreground/offline cases. Reset forwarding
and the normal API origin afterwards. A held response comes from the actual SDK
or `/api/me`; release occurs after account retirement/switching in the test.

Relay infrastructure acceptance passed as part of API run
`01a1853d-dc2c-7aec-8be6-a0d94528d3ff` (26/26 combined). Native fault journeys
remain unrun while manual unlock is pending. Current MOBILE-01 also adds dark
appearance; the earlier Go checkpoint does not establish this added check.

## Review handoff resources

After the backend review fix pass, the owned API/sink/relay/Metro and dedicated
agent-device daemon were stopped. The owned regular iPhone and Duo are Shutdown;
the owned Android emulator was already stopped. The local Postgres container is
stopped with its volume preserved. Private environments, reports, native debug
builds and simulator state remain ignored and intact. Restart the documented
lane services and manually unlock the Mac before continuing native acceptance.
The 29/29 API run is independent of the still-incomplete native/provider matrix.
