# SaaS-03B-F-R1 — Course Command Sequence and Start Gate Resolution

## Purpose

This resolution closes the missing start gate for SaaS-03B-F after the
published SaaS-03B-E portable sequence and CreateCourse portable contract.

## Normative evidence

SaaS-03B-A-R1 defines F as the Course/Enrollment command phase and leaves
Enrollment behind the separate F-R2 uniqueness/re-enrollment policy. The
published RegistrationRequest checkpoints establish a contract-first pattern:
portable contracts are materialized and published before Functions runtime is
authorized. No earlier document defines an F-R1 identifier.

## Resolution and execution model

`SaaS-03B-F-R1` is the authoritative Course sequence and start-gate
resolution. Model B is selected: all four portable Course contracts close
first, followed by separately authorized runtime, independent-review and
publication units. This avoids authorizing runtime for a command whose
portable family is not yet closed.

The ordered Course sequence is:

1. CreateCourse portable contract — completed and published.
2. UpdateCourse portable contract materialization.
3. ActivateCourse portable contract materialization.
4. ArchiveCourse portable contract materialization.
5. CreateCourse Functions implementation, independent review and publication.
6. UpdateCourse Functions implementation, independent review and publication.
7. ActivateCourse Functions implementation, independent review and publication.
8. ArchiveCourse Functions implementation, independent review and publication.

Every unit requires its own explicit authorization, tests, review and
publication gate. No runtime unit is authorized by this resolution.

## CreateCourse runtime position

`CREATECOURSE_PORTABLE_STATUS = completed_and_published`.

`CREATECOURSE_RUNTIME_STATUS = not_implemented_and_not_authorized`.

`CREATECOURSE_RUNTIME_IDENTIFIER = NOT_YET_ASSIGNED`: no runtime identifier
exists in the published genealogy. It must be derived as the next published
F-R1 descendant only after all four portable Course contracts have closed; this
resolution does not create or reserve that identifier.

`CREATECOURSE_RUNTIME_POSITION_IN_SEQUENCE = 5`.

## Complete Course command matrix

| Command | Portable contract | Functions runtime | Independent review | Publication/closure |
| --- | --- | --- | --- | --- |
| CreateCourse | completed and published | not implemented; not authorized | not started | not closed |
| UpdateCourse | next authorized (`SaaS-03B-F-R1-R1`) | not implemented; not authorized | not started | not closed |
| ActivateCourse | ordered after UpdateCourse | not implemented; not authorized | not started | not closed |
| ArchiveCourse | ordered after ActivateCourse | not implemented; not authorized | not started | not closed |

## Next authorized unit

`SaaS-03B-F-R1-R1` — UpdateCourse portable contract materialization.

Its scope is package-owned portable contract work, generated declarations,
contract tests and the authorized package/vendor cutover if required. It must
not implement Functions runtime behavior, handlers, Firebase effects, Rules,
UI or Providers.

## Explicit exclusions

This resolution does not authorize any Course Functions runtime, Enrollment,
Functions handlers, SaaS-03B-R or Phase 04. RestoreCourse remains prohibited
because archived Course is terminal.

## F-R2 boundary

`SaaS-03B-F-R2` remains the separate Enrollment uniqueness and re-enrollment
policy resolution. No Enrollment portable contract or runtime implementation
is authorized before F-R2 closes. Course work may proceed before F-R2.

## Closure path

Complete the portable Course sequence, then the four runtime/review units;
close F-R2, complete the Enrollment command sequence, perform independent
review and documentary closure of F, then run SaaS-03B-R integrated
security/runtime/CI/shadow closure. Phase 04 remains not_started until the
applicable privileged-backend closure gates pass.

## State after this resolution

```text
SaaS-03B-F-R1 = completed_pending_human_review_and_push
CreateCourse portable contract = completed_and_published
CreateCourse runtime = not_implemented_and_not_authorized
CreateCourse runtime identifier = not_yet_assigned
CreateCourse runtime sequence position = 5
SaaS-03B-F-R1-R1 = ready_not_started
SaaS-03B-F = in_progress_ordered_course_sequence
SaaS-03B-F-R2 = defined_pending_enrollment_policy_resolution
SaaS-03B-R = blocked_pending_F
Phase 04 = not_started
```
