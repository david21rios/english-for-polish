# SaaS-03A.1A — Shared SaaS Firestore repository infrastructure

## Purpose and scope

This phase creates the pure, client-safe foundations for future SaaS Firestore
repositories. It starts 03A in expand/shadow mode without implementing a
functional repository, business query, UI consumer, migration or remote write.

## Modules created

| Area | Module | Responsibility |
| --- | --- | --- |
| errors | `errors/repositoryError.js` | stable taxonomy, safe error class/factory and Firebase code mapping |
| validation | `validation/identifiers.js` | opaque ID validation and exact tenant consistency |
| paths | `paths/firestorePaths.js` | ten canonical Firestore document path strings |
| serialization | `serialization/timestamps.js` | Firestore-like/Date to UTC ISO-8601 conversion |
| serialization | `serialization/snapshots.js` | existence, ID, plain-object shape, allowlist and required-field enforcement |
| dependencies | `dependencies/firestoreRepositoryDependencies.js` | explicit frozen `db`/SDK injection contract |
| public API | `index.js` | intentional internal exports for later repositories |

No module imports `src/firebase.js`, a Firebase SDK package, React or Storage.

## Identifier contract

Supported semantic IDs are `uid`, `tenantId`, `requestId`, `membershipId`,
`courseId` and `enrollmentId`. Lookup `uidKey` values use the same opaque UID
validation. An ID must be a string, contain a non-whitespace character, contain
no `/`, and not resolve after trim to `.` or `..`. A valid value is returned
unchanged: whitespace, casing and international characters are not silently
normalized and no restrictive Firebase Auth regex is imposed.

Invalid values raise `INVALID_ARGUMENT` with stable operation/resource
metadata. Exact tenant equality is checked only after both tenant IDs validate;
a mismatch raises `CONTRACT_VIOLATION` and fails closed.

## Canonical paths

The pure builders return strings and never create SDK references:

1. `identities/{uid}`
2. `tenants/{tenantId}`
3. `tenants/{tenantId}/configuration/settings`
4. `tenants/{tenantId}/configuration/branding`
5. `tenants/{tenantId}/registrationRequests/{requestId}`
6. `tenants/{tenantId}/registrationRequestKeys/{uidKey}`
7. `tenants/{tenantId}/memberships/{membershipId}`
8. `tenants/{tenantId}/membershipKeys/{uidKey}`
9. `tenants/{tenantId}/courses/{courseId}`
10. `tenants/{tenantId}/enrollments/{enrollmentId}`

## Timestamp decision

Repository output uses validated UTC ISO-8601 strings. This matches the frozen
domain typedefs, is SDK-independent, serializable and deterministic at the
application boundary. `Date` and objects exposing `toDate()` are accepted;
`null` is accepted only when the caller explicitly enables it. Numbers,
strings, unknown objects, invalid dates and invalid/throwing `toDate()` results
are rejected as `CONTRACT_VIOLATION`. No Firestore `Timestamp` escapes.

## Snapshot serialization

`serializeSnapshot` requires an existing document, valid ID, callable `data()`,
plain-object data and an explicit field allowlist. Optional required fields are
checked by own-property presence. Unknown fields fail closed and only their
names enter error details; their values are never echoed. Explicit `null` is
preserved. Output is `{ id, data }` and never exposes the snapshot or reference.
Concrete Identity/Tenant/etc. shapes remain for their repository phases.

## Error contract

The taxonomy is:

```text
INVALID_ARGUMENT
UNAUTHENTICATED
FORBIDDEN
NOT_FOUND
CONFLICT
FAILED_PRECONDITION
UNAVAILABLE
CONTRACT_VIOLATION
UNKNOWN
```

`RepositoryError` contains `code`, `message`, `operation`, `resource`, optional
safe `cause` summary and optional sanitized `details`. Cause output contains at
most name/code. Known Firestore codes map as follows:

| Firebase code | Repository code |
| --- | --- |
| `permission-denied` | `FORBIDDEN` |
| `unauthenticated` | `UNAUTHENTICATED` |
| `not-found` | `NOT_FOUND` |
| `already-exists`, `aborted` | `CONFLICT` |
| `failed-precondition` | `FAILED_PRECONDITION` |
| `unavailable`, `deadline-exceeded` | `UNAVAILABLE` |
| `invalid-argument` | `INVALID_ARGUMENT` |
| unknown | `UNKNOWN` |

Messages, payloads, credentials, tokens, email/password values and raw Firebase
objects are not copied into normalized errors.

The C1 review strengthened this invariant: sensitive-key detection covers key
names containing authorization, credential, email, password, payload, secret
or token, including variants such as `accessToken` and `secretKey`.

## Dependency injection and public API

`createFirestoreRepositoryDependencies({ db, sdk })` requires an explicit DB
object and an SDK function map, then returns a frozen contract.
`requireFirestoreSdkFunction` fails closed when a future repository requests a
function it was not given. No logger, clock, adapter or singleton is introduced.

Only `src/services/saas/shared/index.js` is the public internal API. Sanitizers,
normalizers and plain-object helpers remain module-private.

## Tests and validation

Five pure unit-test modules cover canonical paths and invalid IDs, tenant
consistency, timestamps, snapshot isolation/allowlists/null, all normalized
error mappings, sensitive-detail filtering and dependency injection. The suite
contains 51 tests. Emulator coverage is neither needed nor authorized because
this phase performs no Firestore operation.

## Risks and deferred decisions

- Valid opaque IDs with exterior spaces remain byte-for-byte unchanged. This
  avoids silent normalization but means callers must supply the canonical ID;
  future repositories must not trim or infer it.
- Snapshot output is a shallow allowlisted copy. Nested maps/arrays remain the
  responsibility of each concrete serializer, which must validate/copy its
  own known shape before exposing it as a domain value.
- An empty injected SDK map is valid shared infrastructure; each concrete
  repository must use `requireFirestoreSdkFunction` to declare its actual SDK
  requirements and fail closed when one is absent.
- Concrete serializers must define per-root allowed/required fields.
- Concrete repositories must inject only the SDK functions they use and map
  operation/resource names precisely.
- Query construction, pagination, server timestamp writes and Rules integration
  remain repository-specific.
- A future phase may add a clock/logger only with demonstrated need.
- Firebase error codes outside the approved list intentionally map to `UNKNOWN`.

## Exclusions and next phase

No Identity/Tenant/Request/Membership/Course/Enrollment repository, generic CRUD
base, business query, React integration, legacy modification, dual-write,
migration, backend, Rule/index change, Storage, remote access or deployment is
included.

```text
Status before C1 review:
SaaS-03A = in_progress
SaaS-03A.1A = completed_pending_human_code_review
SaaS-03A.1B = next_not_started
```

The next phase is SaaS-03A.1B — IdentityRepository. It was not started.

## C1 human review

The complete code and test diff was reaudited against the persistence, Rules,
security and frozen-domain sources. One objective sanitization gap was fixed:
compound sensitive keys are now removed. No architectural decision changed.

| Suite | Cases | Positive | Negative/fail-closed | Contract protected |
| --- | ---: | ---: | ---: | --- |
| errors and dependencies | 17 | 14 | 3 | taxonomy, Firebase mapping, sanitization, frozen injection |
| paths and IDs | 9 | 2 | 7 | ten paths, opaque IDs and invalid segments |
| snapshots | 9 | 2 | 7 | existence, shape, allowlist and SDK isolation |
| tenant consistency | 6 | 1 | 5 | exact tenant equality and invalid input |
| timestamps | 10 | 3 | 7 | ISO output, explicit null and invalid inputs |
| **Total** | **51** | **22** | **29** | shared repository boundary |

No functional consumer imports the shared API. The infrastructure has no AI
provider dependency; future AI integrations must use a provider-neutral
gateway and remain separate from Firestore repositories.

The reviewed next-phase contract is limited to `identities/{uid}`: own Identity
read and the Rule-approved self-profile update fields, with a concrete Identity
allowlist/serializer, explicitly injected `doc`, `getDoc`, `updateDoc` and
`serverTimestamp` functions as needed, unit tests and Firestore Emulator Rules
tests. Bootstrap/create, platform reads or writes, anonymization, delete,
tenant access and all backend-only operations remain excluded.

```text
SaaS-03A = in_progress
SaaS-03A.1A = completed
SaaS-03A.1A-C1 = completed_pending_human_push
SaaS-03A.1B = ready_not_started
```
