# Source reuse and migration

The new repository starts with fresh history and documentation only. Keep the
existing applications available as source references; do not rename, delete,
archive or reset their repositories or user-owned ignored state as part of setup.

| Reference                                                                                          | Reviewed scope                                                                          |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Gloups source](https://github.com/GloupsApp/gloups/tree/5b708f6e378f2aea6cbfc164718110da4f625ae4) | Existing Expo/Rust behavior, contracts, verification and the prior unified design draft |
| [Mioum source](https://github.com/Alexays/Mioum/tree/95ff002a0637da8f7c940de9a3286d662c6a8c20)     | Existing NestJS/Prisma/Expo domains; source reuse candidates, not accepted new features |
| [Repository documentation reference](https://github.com/Alexays/Lilo)                              | Short root rules, separate contributor/architecture guides and a documentation index    |

Transferred planning content is limited to drafts. The repository itself has not
been given an open-source license. Confirm ownership/transfer rights for other
assets before importing them; a referenced project's license does not license this
product.

For each approved source import: record source revision/path/rights, accepted
behavior and any intentional differences; adapt it to the agreed contract;
verify real HTTP/device behavior; then integrate. Do not copy a framework's
models/credentials, authentication assumptions, stale README claims or tests as
acceptance evidence for the new implementation.

Existing Gloups data/auth discard authorization does not establish that Mioum has
no users or preservation duties. Confirm usage and transition requirements with
the founders before selecting a cutover. Do not inspect/copy real records into a
planning artifact. No data migration or production change is authorized by this
documentation bootstrap.
