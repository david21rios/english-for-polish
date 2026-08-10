# SaaS-03B-B0-I-R3-C1-R1 — Global Lint Gate Reconciliation

## Purpose and decision

This documentary microphase reconciles the only blocker reported by the first
independent R3-C1 review. The selected decision is `RESOLUTION_A`: the global
lint debt is pre-existing, outside R3 and unchanged by R3. This resolution does
not close R3-C1 and does not authorize R4.

The normative R3-C1 lint gate is therefore:

```text
R3_SCOPED_LINT = PASS
GLOBAL_LINT_R3_DELTA = 0
GLOBAL_LINT_BASELINE = recorded_non_blocking_legacy_debt
```

Global lint must still be executed and reported. It blocks R3-C1 only when R3
introduces a new attributable error or when scoped lint fails. Existing global
debt remains visible and unresolved.

## Git and scope

- Branch: `main`.
- Initial HEAD and `origin/main`:
  `fe90c21233b79315a01b88f28a50b92918ffad63`.
- Initial worktree: clean.
- Pre-R3 baseline: `c037c3408b6ca2b361f9a72616b03255e1bb3f24`,
  the published R2-C1 closure immediately before R3-A.
- Technical changes authorized: none.
- R4 and privileged backend implementation: not started.

## Current and historical lint evidence

The current command `npx eslint . -f json` returns exit code 1 with 13 errors
and 8 warnings in 11 error-bearing files. The same command was executed from a
clean temporary archive of the pre-R3 baseline after `npm ci --ignore-scripts`.
It returned the same exit code, the same 13 errors, the same 8 warnings, the
same files, lines, rules and messages.

None of the 11 error-bearing files changed between the pre-R3 baseline and
current HEAD. Their last modifying commits predate B0-I and R3. R3 introduced
no change in these legacy/UI areas.

```text
GLOBAL_LINT_ERRORS_CURRENT = 13
GLOBAL_LINT_WARNINGS_CURRENT = 8
GLOBAL_LINT_ERRORS_PRE_R3 = 13
GLOBAL_LINT_WARNINGS_PRE_R3 = 8
GLOBAL_LINT_ERRORS_INTRODUCED_BY_R3 = 0
GLOBAL_LINT_ERRORS_FIXED_BY_R3 = 0
GLOBAL_LINT_NET_DELTA_R3 = 0
```

## Error inventory

All errors use `no-unused-vars` and are classified
`PREEXISTING_LEGACY_DEBT`.

| # | File and line | Symbol | Area | Last modifying commit |
|---:|---|---|---|---|
| 1 | `src/components/interactive/InteractivePractice.jsx:891` | `clearValidation` | UI/interactive | `30dc45f` |
| 2 | `src/components/register/AccountSection.jsx:5` | `setEmail` | UI/register | `0f96e47` |
| 3 | `src/components/test/TestResults.jsx:534` | `SkillIcon` | UI/tests | `0f96e47` |
| 4 | `src/components/topics/feedback/MissionStrengthsFeedback.jsx:32` | `Icon` | UI/topics | `0f96e47` |
| 5 | `src/components/topics/personalization/steps/ParametersStep.jsx:43` | `Icon` | UI/topics | `0f96e47` |
| 6 | `src/hooks/useCourseNavigation.js:76` | `getSectionIdByIndex` | legacy hook | `0f96e47` |
| 7 | `src/services/ai/missions/missionAiService.js:97` | `isPlainObject` | legacy AI | `fb1915c` |
| 8 | `src/services/ai/missions/personalization/missionPersonalizationNormalizer.js:116` | `normalizeBoolean` | legacy AI | `0f96e47` |
| 9 | `src/services/ai/prompts/lessonAgentsPrompts.js:244` | `targetLanguage` | legacy AI | `d936eaa` |
| 10 | `src/services/ai/prompts/lessonAgentsPrompts.js:245` | `baseLanguage` | legacy AI | `d936eaa` |
| 11 | `src/services/ai/prompts/lessonAgentsPrompts.js:246` | `supportLanguage` | legacy AI | `d936eaa` |
| 12 | `src/services/auth/firestoreService.js:2989` | `sortTestsByNewest` | legacy service | `0f96e47` |
| 13 | `src/services/courses/lessonManager.js:267` | `getLevelLessonsRef` | legacy service | `0f96e47` |

The eight warnings are likewise pre-existing. ESLint does not make them fatal;
the global exit code is caused by the 13 errors. They remain recorded debt and
are not reclassified as resolved.

## R3-scoped lint

Scoped lint covered every lintable file changed between R2-C1 and current HEAD,
the package and package tests, Domain adapters, Shared, and the
RegistrationRequest, Membership, Course and Enrollment repositories. It
covered 78 unique files, including all 25 lintable files modified by R3.

```text
R3_SCOPED_LINT_ERRORS = 0
R3_SCOPED_LINT_WARNINGS = 0
R3_SCOPED_LINT = PASS
```

Historical phase evidence consistently used lint focused on the changed
repository, runtime suite, precheck, package or Domain adapter alongside broad
tests/build/preflight. Neither Architecture Freeze, the applicable ADRs nor the
Implementation Order established repository-global zero lint as a specific R3
closure invariant before the first R3-C1 prompt. The absolute global-zero gate
was therefore an `OVERCONSTRAINED_REVIEW_GATE`, not a new architectural rule.

## Supply-chain finding

The clean root install reports 25 audit findings: 3 low, 9 moderate and 13
high. They belong to the existing root dependency tree and are not introduced
by the pure contract package:

- `@mipymetic/saas-contracts` has zero runtime dependencies;
- the Functions package contains only the exact local vendored package;
- the isolated Functions install reports zero vulnerabilities;
- R3 introduced no external npm dependency.

The root findings are classified `PREEXISTING_SUPPLY_CHAIN_DEBT`. This phase
does not run `npm audit fix`, update dependencies or conceal the finding.

## Revalidation contract

After human review and push, R3-C1 must be re-executed. It must run and report
global lint against the recorded baseline, require
`GLOBAL_LINT_R3_DELTA = 0`, require scoped lint to pass with zero errors, block
on any new R3-attributable lint error, and keep legacy lint and supply-chain
debt visible and unresolved. R4 remains blocked until R3-C1 itself closes.

## Rollback and states

Rollback is documentary: revert this resolution and the matching roadmap
checkpoint. It requires no technical or data change.

```text
SaaS-03B-B0-I-R3-C1-R1 = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3-C1 = blocked_pending_R1_push_and_revalidation
SaaS-03B-B0-I-R3 = not_closed
SaaS-03B-B0-I-R4 = blocked
SaaS-03B-B = blocked_pending_B0_I_R3_R4
```

Decision: `RESOLUTION_A`. Next action: human review and push, followed by a new
R3-C1 revalidation. R4 and 03B-B remain not started.
