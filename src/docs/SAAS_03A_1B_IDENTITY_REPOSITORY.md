# SaaS-03A.1B — IdentityRepository

## Purpose and scope

This phase implements the first concrete SaaS Firestore repository for the
global `identities/{uid}` root. It is client-safe, dependency-injected and
strictly serialized. It remains in expand/shadow mode: no UI, legacy service,
provider, route, migration, dual-write or remote Firebase integration consumes
it yet.

## Physical contract

The exact persisted field allowlist is:

| Field | Contract | Client mutability |
| --- | --- | --- |
| `uid` | valid string ID, equal to the document ID | immutable |
| `email` | string | immutable; not an authorization source |
| `displayName` | string | profile-editable |
| `photoURL` | external URL string or `null` | profile-editable |
| `emailVerified` | boolean | immutable; Firebase Auth remains authoritative |
| `interfaceLocale` | non-empty string | editable only by its dedicated operation |
| `createdAt` | valid Firestore-like timestamp | immutable |
| `updatedAt` | valid Firestore-like timestamp | written with `serverTimestamp()` |

All eight fields are required. Only `photoURL` is nullable. Unknown fields are
rejected. No role, tenant, membership, course, progress or permission data is
derived from Identity.

## Serialization and validation

`serializeIdentitySnapshot()` uses the shared snapshot contract to require an
existing document, a plain data object, the exact allowlist and every required
field. It validates `data.uid === snapshot.id`, converts both timestamps to
canonical UTC ISO-8601 strings, preserves explicit `photoURL: null`, returns a
new frozen object and exposes neither the snapshot nor Firebase SDK objects.

Strings are not silently normalized. `displayName` whitespace is preserved
because neither the frozen model nor current Rules establish a trimming
contract. `interfaceLocale` must be a non-empty string after a whitespace
check, but its original value is preserved. Full BCP 47 validation is deferred
until a precise locale contract is approved; an incomplete regular expression
would reject valid language tags.

`photoURL` is an external-provider URL or `null`. This repository performs no
remote availability check and has no Firebase Storage dependency. The current
SaaS Storage policy remains `NO_STORAGE` and `storage.rules` remains deny-all.

## Repository API

`createIdentityRepository({ db, sdk })` requires exactly the injected `doc`,
`getDoc`, `updateDoc` and `serverTimestamp` SDK functions. It imports no global
database instance and returns a frozen API:

- `getIdentity(uid)` reads the canonical path and returns the serialized
  Identity; an absent document becomes `NOT_FOUND`.
- `updateIdentityProfile(uid, patch)` accepts only `displayName` and
  `photoURL`, requires at least one field, adds `updatedAt`, and performs a
  field-scoped `updateDoc`.
- `updateInterfaceLocale(uid, interfaceLocale)` writes only
  `interfaceLocale` and `updatedAt` through a field-scoped `updateDoc`.

Updates return the stable frozen shape `{ uid, updatedFields }`; `updatedFields`
contains only caller-requested fields and excludes the authoritative technical
`updatedAt` field. The result confirms the requested write, not a document
re-read, and does not return raw SDK results. Firebase errors are mapped through the shared taxonomy,
while repository validation and contract errors retain their original stable
codes.

The internal barrel exports only `createIdentityRepository`. The concrete
serializer, validation constants and validators remain module-private because
there is no approved external consumer or reuse contract for them.

## Explicitly prohibited operations

There is no `createIdentity`, `deleteIdentity`, `listIdentities`, lookup by
email, email/emailVerified/UID mutation, role/tenant/membership mutation,
anonymization, platform read, bootstrap, legacy `users/{uid}` adapter or data
migration. There is no `setDoc`, document replacement or global current-user
lookup. Firestore Rules remain the final access authority.

## Tests and validation

Forty-eight pure unit tests cover serialization, path and UID handling,
not-found/error mapping, exact profile and locale patches, server timestamps,
prohibited fields and missing injected dependencies. They use explicit SDK
mocks and neither require nor contact Firebase or an Emulator.

The future Firestore-only Emulator revalidation should cover self read,
foreign read denial, allowed self profile/locale updates, unknown and immutable
field denial, create/delete denial and anonymous denial. That runtime suite is
designed here only; it is not implemented or executed in 03A.1B.

## Risks and deferred decisions

- Full BCP 47 locale validation remains deferred pending a frozen exact
  contract.
- The physical contract currently permits whitespace in string fields; values
  are preserved rather than silently transformed.
- `photoURL` string syntax is constrained only by the frozen model and Rules;
  provider URL policy can be tightened only in a separately approved contract.
- Runtime authorization remains to be revalidated with a later isolated
  Firestore Emulator phase.

Future AI integrations must use a provider-neutral gateway. IdentityRepository
has no knowledge of Gemini, Ollama, vLLM, llama.cpp, credentials or any other
AI provider.

## Decision and next phase

```text
SaaS-03A = in_progress
SaaS-03A.1B = completed
SaaS-03A.1B-C1 = completed_pending_human_push
SaaS-03A.2 — TenantRepository = ready_not_started
```

No TenantRepository files were created and the next phase was not started. No
Rule, index, domain object, legacy service, UI file or remote Firebase resource
was modified.
