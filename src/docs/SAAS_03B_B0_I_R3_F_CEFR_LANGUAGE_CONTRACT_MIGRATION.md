# SaaS-03B-B0-I-R3-F — CEFR and language contract migration

## Purpose and result

R3-F reconciles the executable CEFR contract and audits the adjacent language
value-object shapes without inventing runtime APIs. The evidence selects
`RESULT_A`: `CEFR_LEVELS` moves to package physical authority;
`LearningLanguage` and `InterfaceLanguage` remain structural JSDoc contracts in
Domain; generic canonical BCP 47 validation is already package-owned.

Domain 1.2.0 remains normative authority. The historical academic enum path is
an explicit, reference-identical compatibility reexport from
`@mipymetic/saas-contracts/domain`.

## Inventory and classification

| Contract | Current kind | R3-F result |
|---|---|---|
| `CEFR_LEVELS` | executable frozen enum | migrated to package physical authority |
| `LearningLanguage` | JSDoc shape: `languageCode`, `displayName` | temporary Domain authority; defer to R3-H |
| `InterfaceLanguage` | JSDoc shape: `locale`, `displayName` | temporary Domain authority; defer to R3-H |
| `isCanonicalBcp47` | executable package validator | already package-owned; unchanged |

CEFR remains exactly `A1`, `A2`, `B1`, `B2`, `C1`, `C2`, in that order and
casing, with the same frozen object and public API. No `A0`, pre-A1, placement
band or new pedagogical semantic was added.

Learning language remains the language taught by a Course. Interface language
remains presentation-only and does not identify or derive the taught language.
`supportLanguageCode` is the Course's pedagogical support-language field and
`interfaceLocale` is Identity's interface preference; both use canonical BCP
47 but neither constitutes a new runtime language contract in R3-F.

## Consumers, legacy audit and persistence

Course validation and serialization continue consuming `CEFR_LEVELS` through
the historical Domain path. Course and Enrollment repository APIs, physical
fields, queries, cursors and persisted values are unchanged.

Legacy services contain local CEFR arrays/sets for AI lesson, mission,
evaluation and historical UI behavior. They are classified as legacy
duplication or test/fixture copies, not competing Domain/package authority.
R3-F performs no functional cutover and does not edit them. Language-field
occurrences in repositories, runtime fixtures, UI and legacy prompts are
consumers/examples and remain untouched.

Firestore Rules do not define the CEFR catalog. Their `interfaceLocale` checks
remain unchanged. No Rule, index, serializer, repository or Firebase
configuration changed.

## Package, artifact and validation

Adding the backward-compatible public `CEFR_LEVELS` export advances the private
package from `0.5.0` to `0.6.0`. The vendored artifact
`mipymetic-saas-contracts-0.6.0.tgz` has 30 entries, SHA-256
`6fda40da4fb2467c40b48e32a35030a9801a2a5d79756658eddf556eb78a44b2`, npm
shasum `a4a6580a36ce66d139aa3362354a18d8e1c2d4fc`, and integrity
`sha512-TRNmDHBGJhlBsDHAt7VI2BWlgU0hZelGAetdguk8S1zTZAWH0X1f/JfbytUtNtQLkYZVEq4tx6iH16nMDZSLvA==`.
It excludes tests, `node_modules` and secrets. Independent regeneration is
byte-identical; Functions clean install and isolated CEFR import pass.

Package tests pass 25/25, Course 51/51, Enrollment 46/46 and Shared 51/51.
Prechecks preserve Enrollment 111/42/69, Course 114/32/82, Membership 81/44/37
and RegistrationRequest 52/34/18. Rules preflight passes 222/88/134, general
tests 35/35, and build, Node checks, ESLint, dependency/purity/cycle audits,
packaging, artifact reproducibility and diff checks pass.

## Risks, R3-H and rollback

The structural shapes intentionally remain residual Domain authority pending
R3-H. Legacy CEFR copies remain a controlled compatibility risk and must not be
removed without an independently authorized functional migration. The package
artifact and both lockfiles must remain coordinated.

Rollback restores the local `CEFR_LEVELS` definition, removes the package
export/tests, restores version `0.5.0`, both lockfiles, the `0.5.0` artifact and
manifest, then repeats all validations. Persisted data is unchanged.

## State

```text
SaaS-03B-B0-I-R3-F = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-G = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = cefr_contract_migrated_languages_reconciled
Privileged Backend = not_created
```

The next phase is `SaaS-03B-B0-I-R3-G — Errors / Results Reconciliation`. It
has not been started.
