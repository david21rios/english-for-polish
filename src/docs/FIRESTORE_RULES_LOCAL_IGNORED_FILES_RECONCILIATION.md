# Firestore Rules local ignored files reconciliation

## Purpose and prior state

SaaS-02C.2G-B2.4C-A1 reconciles the classification of `.env.local` and
`firebase-debug.log` without reading, hashing, copying, modifying, moving or
deleting either file. B2.4C-A had conservatively treated their existence as a
precommit blocker. The approved rule for this phase distinguishes local
ignored artifacts from files that are tracked, staged, diff-visible,
unignored, workflow-referenced or artifact-uploaded.

## Method

Only filesystem metadata and Git metadata were inspected. The checks were:

- existence/type/size/timestamp via filesystem metadata;
- `git check-ignore -v` for source and pattern;
- `git ls-files --error-unmatch` for tracking;
- cached name/status diffs for staging;
- normal and ignored status plus untracked non-ignored inventory;
- working and cached diff names;
- exact static searches in the workflow, preflight and `package.json`;
- Git-visible sensitive filename matching using names only.

The contents of both local files were never opened or displayed.

## File results

| File | Exists | Ignored | Ignore source/pattern | Tracked | Staged | Diff-visible | Normal untracked | Ignored status |
|---|---|---|---|---|---|---|---|---|
| `.env.local` | Yes | Yes | `.gitignore:14`, `.env.local` | No | No | No | No | `!! .env.local` |
| `firebase-debug.log` | Yes | Yes | `.gitignore:18`, `firebase-debug.log*` | No | No | No | No | `!! firebase-debug.log` |

Metadata-only inspection found regular local files. Their sizes and timestamps
were used only to confirm file identity; no content-derived evidence was
created.

## Workflow, artifacts and glob review

The workflow, preflight and package scripts contain no exact reference to
either file and do not use dotenv, `cat .env`, `printenv`, repository-wide
archive commands, wildcard `cat`, `git add`, recursive `find`, or broad
artifact paths. The workflow has a scoped non-secret `env` entry for the demo
project. It does not read or print the local environment.

The preflight contains the literal strings `secrets.` and
`actions/upload-artifact` only in its forbidden-pattern list; this is a guard,
not runtime use. The workflow has no artifact-upload step and neither local
file can be collected by a broad glob.

The proposed commit procedure remains `git add -- <explicitly reviewed
paths>`, never `git add .`, `git add -A` or `git add --all`. Ignored files
would not ordinarily enter through `git add .`, but explicit paths are the
project control.

## Classification and risk

```text
.env.local classification = LOCAL_IGNORED_CONFIGURATION
.env.local commit risk = NOT_BLOCKING
.env.local action = KEEP_LOCAL_AND_IGNORED

firebase-debug.log classification = LOCAL_IGNORED_DEBUG_ARTIFACT
firebase-debug.log commit risk = NOT_BLOCKING
firebase-debug.log action = OPTIONAL_OWNER_CLEANUP
```

No filename matching `.env`, `.env.*`, credential key/certificate extensions,
service-account/credentials/token JSON or Firebase debug logs appeared among
tracked files, untracked non-ignored files, working diffs or cached diffs.
Therefore `Files sensitive in Git-visible scope = none`.

## Validation and decision

The CI preflight, Node syntax check, build, normal tests and `git diff --check`
passed. Technical manifests and hashes remained unchanged. Runtime Rules tests,
Firebase Emulator Suite, Java, Firebase CLI, GitHub Actions, commit, push,
remote access and deployment were not executed.

The local files `.env.local` and `firebase-debug.log` are ignored, untracked,
unstaged, absent from Git diffs and not referenced, read or uploaded by the
Firestore Rules CI workflow.

Their local existence does not make them part of the proposed commit and does
not represent a commit-level credential leak.

`.env.local` must remain local and ignored.

`firebase-debug.log` may optionally be deleted by the owner, but its deletion
is not required to continue.

```text
Sensitive local file review = resolved
Commit blocker = none
SaaS-02C.2G-B2.4C-A = completed
SaaS-02C.2G-B2.4C-A1 = completed_pending_human_precommit_closure
SaaS-02C.2G-B2.4C-B = blocked_pending_manual_commit_push_and_workflow
```

No secret content may be displayed. No commit, push or workflow execution is
authorized by this reconciliation.
