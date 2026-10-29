# Services and connection boundaries

AUTH-003 provisions only an isolated synthetic local Postgres/API/email sink and
local simulator builds. No hosted runtime, external email sender, live OAuth
connection or deployment is verified. Existing selections below remain service
constraints/source facts.

| Service          | Existing direction                                                                      | New-repository boundary                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Identity         | Better Auth in NestJS Fastify/Expo SDK 58 with the official Drizzle adapter (D015/D016) | Google, Apple and email/password; DDD/Onion boundaries and design review precede code/provider setup                                |
| Analytics/config | PostHog EU preferred                                                                    | Approve exact products, event payloads, native crash behavior and separation from health/marketing data                             |
| Purchases        | Existing RevenueCat foundation                                                          | Reverify app records, user mapping, products, localized offers and sandbox journeys before reuse                                    |
| Inference        | Prior apps use different provider paths                                                 | Select exact products, regions, retention and allowed data use; do not transfer personal subscription tokens                        |
| Hosting          | Existing workloads use Coolify; EU locations preferred                                  | New NestJS/PostgreSQL/media deployment needs a separate design and authorization; do not reuse the unrelated preconfigured instance |
| Mobile delivery  | Existing EAS/store foundation                                                           | Native IDs/signing/project connections need explicit migration evidence; no new app/build is configured here                        |
| Public roadmap   | Existing Canny Free portal                                                              | Keep Free, bilingual copy and no health records; cards remain unpublished drafts                                                    |

The earlier selected Clerk application `app_3KwzqkCOQWPOAd2BWpaMhzQ0hci` is
historical source information after D015. Preserve it and its data; do not create
a replacement Clerk application or perform a migration/deletion without its own
authorization. Better Auth is a library hosted by the future NestJS service, not
proof of a new managed provider connection. Google OAuth records, Apple App ID,
Service ID/key/capability and an email sender still need an authorized inventory
and environment-specific configuration. No connection has been verified here.

The permanent existing mobile identity app.gloups.health is source information,
not a second app to register automatically. Source configuration must be
verified against actual service records before reuse. Keep credentials, signing
material, local databases and provider contract files outside Git.

Worldwide distribution does not imply every provider, store or catalog supports
every market. Record actual regions/exceptions and eligibility. iOS push uses
the preferred direct APNs path; future Android remote push needs FCM transport.
Local rest timers must not depend on remote push or a watch.

Do not add Firebase or Amplitude to the iOS foundation. Android's FCM transport
does not authorize adopting unrelated analytics services. Canny's processing
region remains unverified; keep health records out of that public service.
