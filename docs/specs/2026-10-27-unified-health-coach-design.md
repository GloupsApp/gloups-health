# Unified Gloups health coach

27 October 2026. Draft for founder review. Product requirements below include the
owner's decisions in this discussion; architecture and release boundaries marked
as proposals still need review. This document does not approve implementation,
deployment, distribution or a compliance claim.

This is the design for the new private GloupsApp/gloups-health repository, which
currently contains documentation only. Source application behavior below has not
been imported or verified here. Worldwide launch with French and English first
is confirmed; implementation remains subject to accepted contracts and task scope.

A separate planning review identified the unresolved founder decisions listed at
the end. Resolve them before estimating the release or approving an
implementation plan.

## Product decisions

Gloups serves sportspeople who want nutrition, fitness, sleep and optional
menstrual cycle tracking in one iOS/Android application. The coach helps each
person decide what to eat, how to train and when to rest. Daily recommendations
use their goals and recorded context, with clear explanations.

The owner selected a full workout recorder for the first unified release:
workout creation and execution, sets, repetitions, weights, rest timers and
progression. An imports-only first release was considered and rejected. The
engineering work can proceed in stages; that does not reduce the agreed launch
scope to nutrition plus imported workouts.

NestJS is the owner's selected direction for the unified backend. The existing
Rust service remains the current implementation until an approved migration is
built and verified. NestJS itself provides no HIPAA, BAA or HDS status.

The owner decided that the first consumer release will not offer HIPAA BAA or
HDS support. Prepare for a possible later healthcare offering in the architecture;
executed healthcare BAAs and HDS certification are not planned launch commitments.
Check legal applicability against the actual processing and launch markets: if a
requirement applies to that first product, resolve it or change the affected scope
before launch. Consumer privacy and security obligations remain in scope.

Gloups is the sole public product name. Public language is French and English.
Use original descriptions in the [Canny publishing draft](../marketing/roadmap/2026-10-27-unified-health-coach.md).
The public roadmap and feedback remain on Canny Free.

## Goals and boundaries

The first unified release must connect the four domains to a useful daily
coaching decision, support full phone-based workout execution and work on both
mobile platforms. Logging, session recovery and sync must remain usable when a
network request or model provider fails.

The proposed initial population is adults using Gloups for their own sports and
wellness goals. Worldwide launch with French and English first is confirmed. Age eligibility
still requires a founder decision; actual market/provider/store availability
needs verification. Follow [international requirements](../I18N.md).
Healthcare organizations, clinician workspaces, diagnosis, treatment decisions,
contraception and fertility treatment are outside this proposed first release.
Changing the intended use requires a fresh regulatory and clinical assessment.

The proposed fitness boundary is phone-based strength programming and execution,
plus imported or manually recorded cardio and other activities. A watch app,
phone GPS recording and coached endurance intervals are separate scope decisions.
Importing a workout does not establish support for its full exercise detail.

Avoid a score that cannot be explained, silently treating missing data as zero,
duplicate health records, unapproved changes to goals, sensitive notifications,
and an iOS feature described as available on Android before device acceptance.

## Existing foundations

Source review used Gloups revision 83b57c99 and Mioum revision 95ff002a on 27 October 2026. No new app journey, production inspection or model-quality evaluation was
performed for this design. Existing verification records retain their own dates,
devices and limitations.

| Area        | Gloups                                                                               | Mioum                                                                                | Unification work                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Mobile      | Expo 58, native platform controls, component catalog, existing iPhone acceptance     | Expo 57, native tabs, cooking/progress screens and widget source                     | Keep the newer working shell; adapt selected flows to its native components and brand                               |
| Nutrition   | Photo/barcode/manual meals, water, USDA-backed calculations and provenance contracts | CIQUAL/Open Food Facts, corrections, favorites, planning, shopping and batch cooking | Agree one food/quantity/nutrient contract and evaluate each pipeline through real boundaries                        |
| Coach       | Saved streaming chat, optional local generation; no diary tools                      | Diary-aware context, meal tools, weekly levers and stored conversations              | Establish one context, recommendation and action contract before reusing tools                                      |
| Fitness     | Historical exercise API; no current workout recorder                                 | Activity/weight imports and adaptive nutrition targets                               | Build routines, live sessions, set history, rest timers and progression                                             |
| Sleep/cycle | Planned context, without current domain implementations                              | No sleep/cycle implementation found in reviewed domain code                          | New recording, import, consent and interpretation domains                                                           |
| Health sync | No current HealthKit integration                                                     | Apple Health adapter; the bridge returns unavailable outside iOS                     | Build and verify Android Health Connect; extend selected iOS record types                                           |
| Identity    | Earlier selected Clerk application, internal account UUID                            | Installation identity, custom access/refresh tokens and recovery                     | D015 selects Better Auth for the new service; preserve source identities pending a separately authorized transition |
| Storage     | SQLite and protected image records                                                   | PostgreSQL/Prisma, local photo files, mobile upload queue/catalog                    | Define the new schema, protected media and encrypted device persistence                                             |

The current [source architecture](https://github.com/GloupsApp/gloups/blob/5b708f6e378f2aea6cbfc164718110da4f625ae4/docs/ARCHITECTURE.md), [source API boundaries](https://github.com/GloupsApp/gloups/blob/5b708f6e378f2aea6cbfc164718110da4f625ae4/docs/API-DOMAIN.md),
[source nutrition contracts](https://github.com/GloupsApp/gloups/blob/5b708f6e378f2aea6cbfc164718110da4f625ae4/docs/contracts/core-nutrition.md) and [source chat contract](https://github.com/GloupsApp/gloups/blob/5b708f6e378f2aea6cbfc164718110da4f625ae4/docs/contracts/gloop-chat.md)
remain evidence for the current application. Source reuse alone does not accept a
feature in the unified app. Some source and README descriptions have drifted;
resolve conflicts against code and actual boundary evidence.

## Approaches considered

1. Launch all four domains with workout imports and simple manual activity logs,
   then add workout execution. This reaches the coaching loop sooner but does not
   meet the owner's selected first-release fitness scope.
2. Include a complete phone workout recorder in the first unified release,
   alongside nutrition, sleep, cycle and daily coaching. The owner selected this
   approach. It adds durable session state, exercise history, native timers and
   progression to the launch requirements.

The proposed technical approach is one Expo application and one NestJS modular
monolith backed by PostgreSQL. Reuse Mioum's useful NestJS domain work and port
Gloups' accepted behavior deliberately. Maintaining two permanent backend
implementations would add contracts, access paths and operating work for the same
product. Rebuilding every domain from scratch would discard useful behavior and
verification knowledge. These technical choices are recommendations for review.

## Launch scope by domain

| Domain                  | Required first-release behavior                                                                                                                               | Boundary acceptance                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Profile and goals       | Goals, experience, equipment, schedule, units and editable preferences; explain how targets are derived                                                       | Changes persist, conflict handling is explicit, and historical records retain their original meaning                                             |
| Nutrition and hydration | Photo, barcode and manual capture; food search, correction, reuse, explicit quantities and nutrient provenance; water logging; actionable daily food guidance | Exact arithmetic, uncertain estimates, account ownership, retries and saved records agree across API and both apps                               |
| Workout programming     | Exercise library and custom exercises, routines, exercise order, target sets/reps/load, equipment constraints and editable schedules                          | A saved program reopens unchanged; editing a template cannot rewrite a completed session                                                         |
| Workout execution       | Start, pause/resume and finish; log sets/reps/load and optional effort/notes; show previous comparable results; edit/undo; rest countdown and phone alerts    | Airplane mode, locked screen, backgrounding, process termination, denied alerts and restart preserve the session and its accepted sets           |
| Progression             | Comparable exercise history, personal records, proposed next targets and an explanation of progression or regression                                          | Unit conversion, skipped sets, incomplete sessions and equipment changes do not create false progress; applying a changed target is explicit     |
| Activity                | Import supported workouts, steps and activity context; manual activity entry; identify overlapping recordings                                                 | The same activity is not counted twice after retries, write-back or multiple-source import                                                       |
| Sleep                   | Imported or manually entered sleep, naps, corrections, overnight dates, trends and rest guidance                                                              | Missing nights remain missing; edits and source deletions update derived context; no sleep stages are invented for manual duration logs          |
| Cycle                   | Optional period/symptom records, notes, supported imports and separately authorized coaching context                                                          | Consent/refusal/withdrawal work independently; irregular or absent records do not imply a known phase; records never enter marketing analytics   |
| Daily coach             | Food, training and rest recommendations; alternatives, explanations, follow-up questions and an accepted-action history                                       | Every factual statement can be traced to permitted records; stale/missing context is disclosed and invalidated when records change               |
| Progress review         | History and weekly reviews across recorded domains; explain observations separately from recommendations                                                      | Corrected/deleted source records update affected summaries without rewriting previously accepted workouts                                        |
| Privacy/account         | Sign-in/out, granular health permissions, data export/deletion, device clearing and safe notification choices                                                 | Export includes photos/chat and new domains; deletion propagates to queues, derived data and relevant processors with documented backup handling |

An optional daily check-in can collect perceived fatigue, soreness and how the
person feels. This is a proposed complement to wearable context; absence of a
wearable must not prevent basic logging or workout execution.

## Mobile and device behavior

Retain Expo/React Native and Expo Router as the proposed application foundation.
Use SwiftUI and Jetpack Compose controls through the existing native UI approach
where appropriate. Shared domain logic and colors do not require identical
navigation, pickers or accessibility behavior on both systems. Native development
clients and platform-specific components remain part of the architecture.

Inspect actual Mobbin screens before designing or integrating each new flow and
record selected examples in the design documentation. This scope document
introduces no screen layout. Use the existing component catalog for states,
Dynamic Type/font scaling, dark mode, screen readers and reduced motion.

Use encrypted local persistence for health-bearing drafts, accepted offline
operations and active workouts, with keys held by the platform security store.
Select the concrete storage library after native compatibility checks. Keep
media temporary unless explicitly retained, review OS backup behavior, scope all
caches/queues to the account and clear access on sign-out or deletion. Secure
token storage alone does not protect the rest of the local health data.

Record sets and session transitions durably before acknowledging them. Persist
rest deadlines; an in-memory JavaScript interval cannot be the timer's source of
truth. Use platform-local alert scheduling and reconcile on resume, including
clock changes and alert permissions. Rest alerts must work without a server push
service or watch. Show the remaining limits imposed by the operating system.

## Backend and data contracts

Recommended boundaries within one NestJS service:

| Module                | Owns                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Identity/access       | Better Auth session verification (D015), internal UUID mapping, account ownership and privileged access policy |
| Profile/goals         | Preferences, goal versions, schedules and explicit target application                                          |
| Food/catalog          | Food sources, licenses, nutrient units, matching and provenance                                                |
| Nutrition/hydration   | Accepted meals, photos, quantities, water and derived daily totals                                             |
| Training              | Exercises, templates, sessions, sets, history and progression rules                                            |
| Sleep                 | Sleep intervals, naps, user corrections and derived summaries                                                  |
| Cycle                 | Consented observations, symptoms, import permissions and permitted context                                     |
| Health ingestion      | Platform adapters, source records, cursors, duplicates and reconciliation                                      |
| Coaching              | Permitted context snapshots, recommendations, explanations and proposed actions                                |
| Privacy/audit         | Consent versions, exports, deletion, retention and security audit events                                       |
| Billing/notifications | Entitlements and delivery preferences without health payloads                                                  |

Use PostgreSQL with migrations for authoritative records. Prisma is a reuse
candidate, not an API contract. Do not return database entities directly to
clients. Keep validated request/response schemas, versioned HTTP contracts and
bounded streaming replies. Continue using Bun/Nx for repository tasks; pin a
supported server runtime and compatible NestJS version during implementation.

Health records need a stable internal ID, owning account UUID, original source
and source-record identity, observation interval/instant, timezone where relevant,
explicit unit, source revision and deletion state. Distinguish observed values,
manual entries, estimates and derived results. Derived records include their
input identities and calculation version. Preserve the nutrition rules in the
existing contracts until an explicit replacement has passed boundary checks.

Use retry identities and transactional writes for commands. Set/session changes
carry a revision so stale devices cannot silently overwrite later work. Keep
deletion tombstones and durable outbox receipts where imports or retries can
recreate removed records. Background jobs must be bounded, cancellable and safe
to retry; introduce queue infrastructure only for identified workloads.

Protected media needs authenticated authorization, encryption, deletion and
backup coverage. Select an object-storage product/region through the same
contract and HDS review as the database. Do not inherit a public bucket or local
photo directory as the production design.

## Health integration and interpretation

HealthKit and Health Connect are device-side adapters. Document each supported
record type and direction separately. Verify what each wearable actually writes;
a hub connection does not establish complete support for every device or field.
Direct vendor integrations are later candidates unless a launch-critical field
cannot be obtained through the selected platform path.

Import changes incrementally, reconcile edits/deletions, retain provenance and
let the person select sources. Prevent import/write-back loops. Overlapping
workout recordings must not double the load, duration or energy totals. Preserve
the originals when matching duplicates; do not claim that averaging different
sensor signals makes them more accurate.

Show last successful sync and distinguish empty, denied, unavailable, stale and
failed states. Background execution is best effort under OS constraints. Accept
freshness behavior on real devices before making background-sync promises.

Recovery, sleep need, training load and energy-expenditure methods require a
written calculation, suitable evidence, minimum-data rules, versioning and
evaluation. Device-specific measurement definitions must remain visible;
incompatible HRV measurements cannot be treated as interchangeable. Missing data
cannot become a zero score or an invented observation in a personal baseline.
The first release can explain available signals without shipping an unvalidated
composite readiness or energy score.

Cycle observations and phase estimates are different data. Personalize using
authorized observations and reported symptoms, account for uncertainty, and avoid
a fixed training prescription based only on a calendar phase. The scientific
review must define the supported populations and exclusions before release.

## Coaching and model boundary

Create an authorized context snapshot from domain records before asking a model
for language or proposals. Include applicable goals, relevant records, time
windows, freshness, missing context and calculation versions. Filter permissions
before retrieval; a prompt instruction is not an access control.

Calculate nutrition totals, comparisons, trends and training progression in
reviewed application code. The model can explain those results and propose
bounded actions. Validate its structured response and check referenced facts and
numbers. Keep a readable record of why a recommendation was made without storing
or exposing private model reasoning.

Suggestions and accepted actions have different states. Preview material meal,
routine or goal changes and require an explicit user action before committing
them. Recheck ownership, consent and relevant record versions at execution.
Model tools never receive arbitrary database access or a caller-selected account.

Refresh affected recommendations after new sleep, corrected food, edited workouts,
cycle-consent withdrawal or source deletion. Keep the accepted session history
stable, and identify previously displayed guidance that is now stale. Provide a
useful recording/workout experience when inference is unavailable.

Select the exact model product and transport after verifying contracts, regions,
retention, subprocessors and allowed health-data use. Do not assume a consumer
subscription, local generation path, gateway or SDK inherits an enterprise API
agreement. Evaluation covers numeric contradictions, unsupported claims,
cross-account retrieval, malicious record text, missing data, unsafe suggestions,
cost and latency. Curated evaluation cases need reviewed expected behavior;
generated references alone do not establish accuracy.

## Security, privacy and audit evidence

Use the existing [source HIPAA readiness assessment](https://github.com/GloupsApp/gloups/blob/5b708f6e378f2aea6cbfc164718110da4f625ae4/docs/HIPAA.md) as a gap inventory,
then revalidate it against the unified data flow. An EU region, NestJS, an ISO
certificate or a provider's marketing statement cannot establish compliance.

| Work                           | Required evidence before the relevant release                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Applicability and intended use | Written consumer/healthcare roles, launch jurisdictions, GDPR bases and health-data condition; assessment of other applicable consumer-health and medical-software rules                                        |
| Privacy impact                 | Data inventory, processing register, threat model and DPIA applicability decision; complete the DPIA when required                                                                                              |
| Vendor chain                   | For launch, record legal entities, products/regions, DPAs, subprocessors, retention and incident terms in a private register; requalify exact products and execute required BAAs before a future HIPAA offering |
| HDS                            | Determine applicability for launch; for a future HDS offering, scope infrastructure, platform, administration/operation and backup, including Gloups' role, and verify actual certificate/contract coverage     |
| Access                         | Default authenticated routes, record ownership checks, least privilege, operator MFA, joiner/leaver process and periodic access review                                                                          |
| Encryption and recovery        | TLS, database/media/device protection, key separation/rotation/recovery, protected backups and a successful isolated restore                                                                                    |
| Security audit                 | Actor, operation, target, time, outcome, reason where appropriate and correlation; access/alteration controls and a documented retention/review process, without health payloads or tokens                      |
| Telemetry                      | Approved allowlisted events; separate health processing from marketing; inspect native crash queues and provider destinations as well as JavaScript events                                                      |
| Rights and retention           | Category-specific retention, export, correction, processor deletion, backup expiry and legal-hold handling; no universal patient-record retention assumption                                                    |
| Operating program              | Named security responsibility, policies, workforce training/access records, vulnerability treatment, incident exercises and evidence of closure                                                                 |
| Delivery                       | Locked dependencies, provenance/SBOM, secret scanning, reviewed migrations, rollback and evidence tied to the delivered revision                                                                                |

Use Better Auth for the new service under D015 and the pending
[authentication design](2026-10-28-authentication-design.md). Preserve earlier
identity resources and data until a separate transition is authorized.
Retain PostHog EU as the preferred service
where its actual products and agreements fit the approved data boundary. Neither
existing configuration nor an analytics opt-in establishes PHI coverage. Review
billing identifiers and data destinations; pseudonymous IDs are still linkable.
Cycle/sleep content, meal photos, workout notes and chat do not belong in public
feedback, marketing, analytics properties or routine diagnostic logs.

Use [OWASP ASVS](https://asvs.owasp.org/) and
[MASVS](https://mas.owasp.org/MASVS/) as versioned technical verification catalogs.
Map selected controls to evidence and documented exceptions. They complement the
legal and operating work; they are not HIPAA or HDS certifications.

Relevant primary guidance: [HHS cloud responsibilities](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html),
[ANS HDS scope](https://esante.gouv.fr/produits-services/hds),
[CNIL health applications](https://www.cnil.fr/fr/applications-mobiles-en-sante-et-protection-des-donnees-personnelles-les-questions-se-poser),
[CNIL DPIAs](https://www.cnil.fr/fr/ce-quil-faut-savoir-sur-lanalyse-dimpact-relative-la-protection-des-donnees-aipd),
[NestJS documentation](https://docs.nestjs.com/llms.txt),
[HealthKit](https://developer.apple.com/documentation/healthkit) and
[Health Connect](https://developer.android.com/health-and-fitness/health-connect).
Recheck applicable versions and legal scope before implementation and launch.

## Engineering sequence and release criteria

All milestones below are proposed work. None is marked In Progress or Complete
by this document, and no delivery date is promised.

| Milestone                      | Deliverable                                                                                                                                                                        | Dependency / exit evidence                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| M0: scope and controls         | Approved consumer scope, launch population/markets, data inventory, threat model, applicability review, provider and budget decisions; future healthcare responsibilities recorded | Founders accept the release boundary; applicable consumer contract and security blockers have owners                              |
| M1: unified service            | NestJS/PostgreSQL foundation, Better Auth account mapping, validated contracts, audit/privacy plumbing, media and nutrition/hydration parity                                       | HTTP acceptance with isolated PostgreSQL, correct values, account isolation, retry/restart behavior and restore evidence          |
| M2: workout recorder           | Programs, live sessions, sets, timers, offline durability and progression                                                                                                          | Real iPhone and Android journeys include locked/background use, process death, permission denial and recovery                     |
| M3: sleep, cycle and ingestion | Both platform adapters, sleep/naps/manual correction, cycle/symptoms/consent and duplicate handling                                                                                | Device imports, edits, deletions, denied permissions, irregular/empty records, timezones and account changes                      |
| M4: connected coach            | Daily food/training/rest guidance, permitted context, explanations, accepted actions and weekly review                                                                             | Cross-domain journeys, stale-context invalidation, numeric checks, failure fallback, quality/cost/latency review                  |
| M5: unified release            | Native parity, accessibility, consumer privacy/security closure, operational rehearsal and store/distribution readiness                                                            | Full launch journeys pass; applicable agreements and operating evidence exist; founders approve release without a HIPAA/HDS claim |
| Later candidates               | Deeper meal planning/shopping/batch cooking, watch execution, widgets, direct device integrations and advanced trends                                                              | Prioritize from Gloups feedback and verified needs after the launch commitments                                                   |

A later healthcare offering has its own release gate: reassess roles and intended
use, qualify the vendor chain, execute required BAAs, establish the applicable HDS
coverage and obtain the remaining operational evidence. Do not describe that
future gate as completed by consumer hardening or this architecture proposal.

M2 and M3 can be scheduled independently after the contracts needed by each are
stable. M4 uses both. A beta that lacks one of the agreed domains must be labeled
as a development milestone, not the completed unified product.

Agents do not write, extend or rewrite unit tests or use TDD. Use E2E Army over
the running service and actual apps for behavior, with isolated databases and
synthetic identities. For iPhone UI, run the relevant journeys on a regular
iPhone and iPhone Duo and record device/runtime. Android device acceptance is
required for the unified release; an Android bundle export is insufficient.
Physical-device checks cover real health imports and locked/background timers.
Builds, typechecks, lint and formatting supplement this evidence.

Existing Gloups data/auth may be discarded under the owner's earlier direction.
That authorization does not establish that Mioum's users or data are disposable;
confirm its real usage before any destructive cutover. Preserve source history,
ignored databases, keys and signing material. Move one accepted domain at a time,
verify its externally visible behavior, then retire its old path deliberately.
Keep Git merges, infrastructure deployment and mobile distribution separate.

## Decisions still needed

- Whether the proposed adult consumer scope and minimum age are correct; worldwide launch and French/English first are already confirmed.
- Whether phone strength execution plus imported/manual other activities covers
  launch, or whether watch execution, GPS recording or structured endurance plans
  are also required.
- Recurring provider/operations budget for the consumer release and later funding
  for healthcare qualification. The owner has already deferred HIPAA BAA/HDS
  support; do not reopen that product decision when assessing applicable law.
- Mioum's actual users/data, ownership of transferable assets and any preservation
  duties before a cutover. No destructive action is authorized by this draft.
- Clinical/sports-science reviewer and accepted methods for personalized training,
  nutrition, recovery and cycle-related guidance.

Implementation details left to the builder include the concrete table layout,
supported package versions, storage/queue libraries, module file layout and task
breakdown, within these contracts. Provider purchases, intended-use changes,
additional launch platforms and weakened controls require founder decisions.
Create the implementation plan only after this design is approved.
