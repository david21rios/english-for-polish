# SaaS-03B-E-R2 — RegistrationRequest Persistence Contract Materialization

## 1. Scope

SaaS-03B-E-R2 materializes the shared package-owned persisted
RegistrationRequest contract required before any trusted-backend
ApproveRegistrationRequest implementation may begin.

This microphase does not implement ApproveRegistrationRequest and does not
modify Functions business code, Firebase Security Rules, Firestore indexes,
Storage Rules, Firebase configuration, repositories, UI, providers or runtime
command handlers.

The authoritative technical commit is:

`f790c667cbc0d82b1ffbcd6d559d7a05b975f906`

with parent:

`ad5876a77d164a23afdf696391c14a952eb25590`.

## 2. Preconditions resolved

The preceding documentation sequence established the required persistence
decisions:

- SaaS-03B-E-R1 froze the RegistrationRequest backend command boundary.
- SaaS-03B-E-R2-R1 resolved the shared persisted RegistrationRequest contract.
- SaaS-03B-E-R2-R1-R1 resolved the exact persisted RegistrationRequestKey shape.
- Root RegistrationRequest remains authoritative.
- RegistrationRequestKey remains a derived exact projection.
- Terminal RegistrationRequest keys are retained.
- Implicit supersession is not permitted inside ApproveRegistrationRequest.

Those decisions are now executable shared-package contracts rather than
documentation-only requirements.

## 3. Materialized package contract

`@mipymetic/saas-contracts` now owns and exports:

- `REGISTRATION_REQUEST_KEY_FIELDS`;
- `REGISTRATION_REQUEST_KEY_REQUIRED_FIELDS`;
- `encodeRegistrationRequestUidKey`;
- `validateRegistrationRequestKey`;
- `validatePersistedRegistrationRequest`.

The exact RegistrationRequestKey persisted projection is:

```text
uid
requestId
status
```

`REGISTRATION_REQUEST_KEY_REQUIRED_FIELDS` shares canonical array identity
with `REGISTRATION_REQUEST_KEY_FIELDS`.

## 4. Persisted RegistrationRequest validation

The package-level validator now enforces the exact persisted root shape and
the canonical lifecycle residue rules for:

- pending;
- approved;
- rejected;
- cancelled;
- expired.

Persisted timestamps use the package canonical UTC millisecond string
representation.

Cross-lifecycle residue is rejected.

## 5. UID key encoding

`encodeRegistrationRequestUidKey` uses the same canonical encoding semantics
as the existing Membership UID key contract:

- UTF-8 bytes;
- base64url transformation;
- `u1_` prefix;
- no padding;
- invalid document identifiers rejected.

Reference parity with the Membership encoder was verified during R2.

## 6. Public package surface

The new contracts are available from both:

- `@mipymetic/saas-contracts`;
- `@mipymetic/saas-contracts/persistence`.

Generated TypeScript declaration files are deterministic derived artifacts
and passed the strict NodeNext consumer gate.

## 7. SemVer and Functions vendor cutover

The package version was advanced from `0.20.0` to `0.21.0` as a backward-
compatible additive public API change.

The root workspace dependency, root lockfile, Functions vendored dependency,
Functions lockfile and artifact manifest were aligned to `0.21.0`.

The vendored package artifact is:

`mipymetic-saas-contracts-0.21.0.tgz`

Artifact inventory:

- entry count: `78`;
- SHA-256: `772f5ca4023d4fb7d3395c4ea8e45c93f04f1dd0c8384f006d7db78a34d959e9`;
- npm shasum: `078b577aed1cbf1f6e785e570624d307fd85dee5`;
- npm integrity: `sha512-eHCXyODKrPuo8hbTrVSjsDM5cqeQact6i4lI5X2yDCzy2bg8Es+dt1/cLKmtr974HR8EIuaocnKw5Nvxq+qQNg==`.

Artifact cryptographic parity and package reproducibility both passed.

## 8. Validation evidence

The final R2 technical validation established:

- targeted RegistrationRequest tests: `9/9 PASS`;
- complete package suite: `129/129 PASS`;
- package `check:types`: PASS;
- package `build:types`: PASS;
- deterministic declaration validation: PASS;
- public root import parity: PASS;
- public persistence subpath import parity: PASS;
- package dry-run inventory: PASS;
- Functions clean install from vendored `0.21.0`: PASS;
- Functions isolated vendored import: PASS;
- artifact cryptographic audit: PASS;
- artifact reproducibility: PASS;
- `git diff --check`: PASS.

No Functions business code and no Firebase configuration or Rules files were
modified.

## 9. Technical commit

Technical implementation is recorded in:

`f790c667cbc0d82b1ffbcd6d559d7a05b975f906`

Subject:

`feat(contracts): materialize registration request persistence contracts`

The commit contains the exact reviewed 19-file technical surface.

## 10. R2 closure state

SaaS-03B-E-R2 is technically complete pending this documentation closure and
the subsequent documentation commit.

R2 does not authorize implementation of ApproveRegistrationRequest by itself;
the next roadmap gate must explicitly determine the next SaaS-03B-E step
from the implementation-order authority.

At this closure point:

- package authority: materialized;
- RegistrationRequestKey exact shape: materialized;
- persisted RegistrationRequest validator: materialized;
- SemVer cutover: complete;
- Functions vendor cutover: complete;
- technical tests: PASS;
- technical commit: complete;
- push: not performed.
