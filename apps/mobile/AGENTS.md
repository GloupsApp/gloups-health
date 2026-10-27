# Mobile scope

Read root [AGENTS](../../AGENTS.md), [DESIGN](../../docs/DESIGN.md),
[I18N](../../docs/I18N.md), [CONTRACTS](../../docs/CONTRACTS.md) and the assigned packet.
This directory contains instructions only; no Expo app, native project or target exists.

The proposal is Expo/React Native with platform-native components. Before UI
integration inspect actual Mobbin screens and record neutral flow links. Reuse
canonical brand tokens. Routes hold routing; feature components, services and
native adapters live outside the route tree. Do not put secrets in client code.

Keep language, locale, units and timezone independent. Scope persistence/queues
by account, protect health-bearing local state and keep active sessions durable.
Native rest alerts must not depend on a network or a watch. Health adapters need
actual platform permissions and explicit source/consent boundaries.

After implementation is authorized, verify real journeys on a regular iPhone,
iPhone Duo and Android. Record devices/runtimes and use physical-device evidence
for health imports/background behavior. Generated native directories remain
ignored. No unit tests or TDD; bundle exports do not replace device acceptance.
