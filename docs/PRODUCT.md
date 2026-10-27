# Product scope

## Confirmed on 27 October 2026

Gloups is a consumer health coach for sportspeople. It combines nutrition,
fitness, sleep and optional menstrual cycle tracking. It helps people decide what
to eat, how to train and when to rest through personalized daily recommendations
with clear explanations based on goals and authorized records.

Launch is intended worldwide on iOS and Android, in French and English first.
Language is independent of regional formatting, country, timezone, currency and
units. Worldwide is a distribution target; record actual legal, provider and
store availability before announcing availability in a market.

The first unified release includes workout creation and execution, sets,
repetitions, weights, rest timers and progression. Import-only fitness was
considered and rejected as the first-release boundary. Sleep and cycle are new
product domains, not already implemented capabilities in this repository.

NestJS is the selected backend direction. The first consumer release will not
provide HIPAA BAA/HDS support. Its consumer privacy/security obligations must be
assessed. Prepare for future healthcare requirements without claiming coverage.

The new private repository is GloupsApp/gloups-health. Existing Gloups and Mioum
are source references. Public roadmap/feedback remains on Canny Free; public
copy uses Gloups and health coach, with no health-app competitor references.

## Proposals requiring review

Expo/React Native, PostgreSQL, the exact shared-contract approach, provider
products and the detailed release design remain proposals. Bun 1.4.2, Nx and
Ultracite are retained repository conventions for the future tooling setup.

The proposed first population is adults using the product for sports/wellness.
Minimum age and population exclusions need confirmation. Phone strength
execution plus imported/manual other activity is the proposed fitness boundary;
watch execution, GPS recording and structured endurance plans remain open.

Goals supported at launch, scientific methods/reviewer, recurring operating
budget and Mioum's actual users/data/asset rights still need decisions. Assigned
specification work can investigate these; product code must not silently decide
an unresolved product boundary. See [DECISIONS](DECISIONS.md).
