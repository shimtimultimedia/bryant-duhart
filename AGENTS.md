# AGENTS.md

## Token efficiency

Token discipline is survival for long sessions — usage limits have killed
sessions mid-task before. Apply the rules below in every session.

1. Prefer `rtk`-wrapped commands for chatty read-only output: `rtk git status`,
   `rtk git log`, `rtk ls`, `rtk read <file>`, `rtk find`, `rtk grep`. Verify the
   tool is present once with `rtk --version` (expected: `rtk 0.43.0` or later).
   Never double-wrap commands as `rtk rtk`.
2. Cap all other command output: `git status --short`, `git log --oneline -N`,
   `git diff --stat`, `| head -N`. Extract the `PASS`/`FAIL` line from verifier
   and test runs instead of pasting full logs.
3. Never re-read a file already read in the current session unless it was
   externally modified. Prefer slices (`offset` + `limit`) over whole-file reads.
4. One workstream per session where practical. Keep reports terse: summary
   sentence + files touched + commit hash + risks. Do not restate history or
   paste full file dumps.

### Required exception: raw output for verification evidence

The compression rules above apply to *informational* output only. Raw,
uncompressed, unsummarized output is **REQUIRED** for any step whose purpose is
to prove correctness, because a summary can hide a regression on exactly those
steps. Never route these through `rtk` or any summarizer, and never paraphrase
the result:

- **Scope-confirming diffs** — the actual `git diff` (or `git diff -- <paths>`)
  must be shown when verifying *which* files/lines changed and that nothing else
  did. `--stat` is a complement, not a substitute, for scope proof.
- **Zero-match / absence greps** — when the check is "this must not appear,"
  show the real empty result (or the exact non-empty matches), not "none found."
- **Syntax checks** — `node --check`, compiler/linter exit status and any error
  text must be shown verbatim.
- **HTTP / status codes** — real status codes (e.g. `200` vs `000`), not a
  summary of reachability.

If a correctness check and token budget conflict, surface the conflict and ask
rather than silently compressing the evidence.
