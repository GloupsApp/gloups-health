# Services and connection boundaries

This new repository has no provisioned runtime, configured credentials, provider
project or verified deployment. Existing selections below are constraints/source
facts, not proof of a working connection here.

| Service          | Existing direction                                            | New-repository boundary                                                                                                             |
| ---------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Identity         | Clerk application app_3KwzqkCOQWPOAd2BWpaMhzQ0hci is selected | Do not create/select another application; review setup and new account-ID mapping without copying secrets                           |
| Analytics/config | PostHog EU preferred                                          | Approve exact products, event payloads, native crash behavior and separation from health/marketing data                             |
| Purchases        | Existing RevenueCat foundation                                | Reverify app records, user mapping, products, localized offers and sandbox journeys before reuse                                    |
| Inference        | Prior apps use different provider paths                       | Select exact products, regions, retention and allowed data use; do not transfer personal subscription tokens                        |
| Hosting          | Existing workloads use Coolify; EU locations preferred        | New NestJS/PostgreSQL/media deployment needs a separate design and authorization; do not reuse the unrelated preconfigured instance |
| Mobile delivery  | Existing EAS/store foundation                                 | Native IDs/signing/project connections need explicit migration evidence; no new app/build is configured here                        |
| Public roadmap   | Existing Canny Free portal                                    | Keep Free, bilingual copy and no health records; cards remain unpublished drafts                                                    |

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
