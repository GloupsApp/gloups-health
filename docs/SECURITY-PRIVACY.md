# Security and privacy scope

The first release is a consumer product. HIPAA BAA/HDS support is deferred to a
possible later offering. Legal applicability depends on actual processing,
intended use and markets, including the worldwide launch target. Resolve an
applicable requirement or change the affected scope before launch; a preference
cannot establish that a legal requirement does not apply.

Before real health-data processing, record purposes, data categories, roles,
provider products/regions/subprocessors, lawful bases and applicable health-data
conditions, retention and rights. Assess DPIA requirements and complete one when
required. No app, operating control or agreement is established by this bootstrap.

## Required design boundaries

- Verified identity and account ownership, least privilege, operator MFA/access
  reviews and auditable reads, writes, exports, deletions and privileged actions.
- Encryption for protected traffic/storage/devices/backups, separated keys and
  recovery responsibilities; demonstrate a consistent isolated restore.
- Granular platform permissions and separate authorization for cycle/cloud/coach
  context as appropriate. Withdrawal invalidates future retrieval and stale context.
- Data minimization and category-specific retention. Export covers every domain,
  media and chat. Deletion accounts for devices, queues, derived data, processors,
  backup expiry and applicable holds.
- Keep health content out of routine analytics, native crash queues, logs,
  marketing, public feedback and notification previews. Review exact SDK payloads
  and destinations rather than relying on JavaScript sanitization alone.
- Incident triage, contacts, private evidence, response responsibilities and
  exercised recovery. Keep actual contracts and workforce records private.

Use versioned [OWASP ASVS](https://asvs.owasp.org/) and
[MASVS](https://mas.owasp.org/MASVS/) controls mapped to real evidence. They do not
provide HIPAA or HDS status. An EU region, NestJS, a pseudonymous UUID or an
analytics opt-in does not establish compliance or de-identification.

A future healthcare offering must reassess roles/intended use, qualify exact
products and transport paths, execute required BAAs, establish applicable HDS
coverage across hosting/operations/backups and obtain operational evidence. Do
not assume a consumer subscription, gateway or SDK inherits another product's
agreement. Avoid a permanent architecture that hides those data flows.

Primary references: [CNIL health apps](https://www.cnil.fr/fr/applications-mobiles-en-sante-et-protection-des-donnees-personnelles-les-questions-se-poser),
[HHS cloud responsibilities](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html)
and [ANS HDS](https://esante.gouv.fr/produits-services/hds). Revalidate actual
applicability and provider terms before implementation/release.
