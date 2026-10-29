# Contract requirements

The approved [authentication design](specs/2026-10-28-authentication-design.md)
under D017 and AUTH-003 define the implemented identity/account boundary.
Its local wire validators remain in the API/mobile consumers; source is under
review and complete native/provider acceptance is pending. Health/shared domain
schemas remain proposals from the [domain packets](tasks/README.md). The
integration owner records accepted contracts under [contracts](contracts/README.md)
before parallel domain work consumes them.

Every domain contract must define:

- Authenticated owner identity from server-verified Better Auth sessions (D015)
  mapped to an internal Gloups account ID. A caller cannot select a different
  record owner. Exact mapping/lifecycle behavior follows the approved
  [authentication design](specs/2026-10-28-authentication-design.md).
- Stable identifiers, revision/conflict rules, request retry identity and atomic
  persistence boundaries. Define repeat, concurrent and interrupted commands.
- Exact inputs/outputs, units, ranges, finite numeric handling, rounding and
  provenance. Keep observations, manual records, estimates and derived values apart.
- UTC instants, explicit IANA zones and local-date meaning as appropriate. Define
  DST, travel, historical edits, midnight and source deletion using [I18N](I18N.md).
- Stable language-neutral error codes and structured parameters; clients localize
  messages. Define unavailable, denied, stale, empty, conflict and provider failures.
- Permissions and consent before retrieval, storage, explanation and action;
  account switching, export/deletion, retention and audit consequences.
- Compatibility/version policy and the producers/consumers impacted by a change.
  A package export is not approval to change a live contract.
- Real HTTP/native acceptance journeys, exact expected values where known and
  required persistence, failure and international cases. No unit tests or TDD.

Historical Gloups contracts are source evidence, not automatic new-service APIs.
Retain accepted numeric and provenance behavior until an approved replacement is
verified. A Rust account UUID remains an application identity concept after a
runtime change; do not tie the new contract vocabulary to the old implementation.

Candidate shared schemas belong only to real API/mobile consumers. Do not put
framework classes, ORM entities, secrets or server-only model/provider code in a
client package. The concrete transport, schemas and shared exports need approval
in the foundation contract before they are claimed as stable by another task.
