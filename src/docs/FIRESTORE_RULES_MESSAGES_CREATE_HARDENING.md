# SaaS-02C.2G-B1.1 — `messages` create hardening

## Purpose and scope

This microphase hardens only public creation at `messages/{messageId}`. It does
not change message administration, any other legacy block, any SaaS Rule,
application code, tests, indexes, Storage or remote Firebase state.

Sources reviewed directly:

- `FIRESTORE_LEGACY_SELECTIVE_HARDENING_PLAN.md`;
- the legacy reconciliation and compatibility closure;
- the historical shadow baseline and implementation order;
- current and owner-reference Rules;
- `src/pages/Welcome.jsx`;
- `src/services/support/supportService.js`.

## Consumers and effective payloads

Both consumers write the same seven required fields:

| Field | Welcome | supportService | Decision |
|---|---|---|---|
| `name` | normalized string | normalized string | required |
| `email` | normalized string | normalized string | required |
| `message` | normalized string | normalized string | required |
| `source` | `"welcome"` | `"welcome"` | required constant |
| `userId` | `"anon"` | `"anon"` | required anonymous marker |
| `status` | `"new"` | `"new"` | required initial state |
| `createdAt` | server timestamp | server timestamp | required request time |
| `updatedAt` | absent | server timestamp | optional; request time when present |

No additional legitimate field was found and the two contracts are compatible.
The final allowed key set is exactly these eight fields. `hasAll` requires the
seven common fields; `updatedAt` remains optional.

## Implemented validation

The validation is inline in the `messages` match so no new global legacy helper
can affect the non-message semantic hash.

- `keys().hasOnly(...)` rejects unknown-field overposting.
- `keys().hasAll(...)` requires the common payload.
- `name` remains a string of length 2–100.
- `email` remains a string of length 5–254.
- `message` remains a string of length 10–2000.
- `source` must equal `"welcome"`.
- `userId` must equal the non-UID marker `"anon"`, whether the caller currently
  has an Auth session or not. It cannot impersonate a Firebase UID.
- `status` must equal the observed initial value `"new"`.
- `createdAt` must equal `request.time`.
- optional `updatedAt`, when supplied, must equal `request.time`.

Public creation does not require authentication. Consequently both legitimate
anonymous and authenticated uses of the existing payload remain compatible.

## Preserved and denied behavior

Public message creation remains available. Unknown-field overposting and
ownership spoofing through `userId` are denied. Initial status and timestamps
are protected. Invalid types, legacy-limit violations and missing required
fields are denied.

Legacy administrator read, update and delete expressions remain unchanged.
Anonymous and non-admin clients still cannot read, update or delete messages.
Every non-message legacy block, all SaaS blocks and the unique final catch-all
retain their previous semantics.

## Residual risk

This shape hardening does not solve spam, rate limiting, bot automation,
CAPTCHA, App Check, backend validation, email verification, PII retention or
notification abuse. Those controls remain `REQUIRES_BACKEND` or
`REQUIRES_CONSUMER_CHANGE`. No CAPTCHA, App Check, rate limiting or backend was
implemented.

## Future tests

The later Rules-test phase must cover:

- valid anonymous and authenticated payloads, with and without `updatedAt`;
- name/email/message exact minimums, maximums, wrong types and out-of-range
  lengths;
- unknown and missing fields;
- invalid source/status/userId;
- anonymous and authenticated foreign-UID spoofing;
- arbitrary `createdAt` and `updatedAt`;
- anonymous/non-admin read, update and delete denial;
- legacy-admin read, update and delete success.

No test was created or modified here.

## Static comparison evidence

| Metric | Before | After |
|---|---|---|
| `firestore.rules` SHA-256 | `68B97B79EB60A4CF5B747EE078ED98BFF1C4AEFCAA9756D4F64B14ECA3AE8E55` | `CA985999D860A4A1855208A5FDF1D7817C2B58F556A24E88BB0699CC9B949C02` |
| Lines | 882 | 916 |
| Normalized `messages` block | `7DC9B34F5321C9476492A425149624BEC7175AE73C5DCA5A2221C21C6C7C9598` | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` |
| Normalized non-message Rules | `BA61503B7774FAAE14D349BD8E382316D417EB99282C5E1E7CCF12E45A4D4BA6` | `BA61503B7774FAAE14D349BD8E382316D417EB99282C5E1E7CCF12E45A4D4BA6` |

Therefore only the normalized `messages` block changed. The non-message legacy
and SaaS semantics remain byte-equivalent after normalization.

## Rollback

Triggers are failure of either legitimate consumer, unexpected payload
incompatibility, syntax failure or future smoke-test failure. Rollback restores
only the former `messages` create expression from the authoritative reference,
preserves every other legacy/SaaS block, reruns build/tests/smoke checks,
recomputes the non-message semantic hash and records the reason. No rollback
was needed in this implementation.

## Result and gate

```text
Public message creation remains available.
Unknown-field overposting is denied.
Ownership spoofing through userId is denied.
Initial status and timestamps are protected.
Legacy administrator operations remain unchanged.
FLH-001 = implemented_pending_revalidation
SaaS-02C.2G-B1.1 messages create hardening = COMPLETE
No Firebase deployment was performed.
```

SaaS-02C.2G-B1.2 has not started. Mandatory human Rules review is required
before it may begin.
