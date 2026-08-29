# AGENTS.md

This repository is developed from durable repository authority. Do not infer missing requirements.

## Required reading order

Before making substantive changes, read:

1. `README.md`
2. `docs/PROJECT.md`
3. `docs/REQUIREMENTS.md`
4. `docs/ARCHITECTURE.md`
5. The GitHub Issue that authorizes the work

If an Issue conflicts with a project invariant in `docs/REQUIREMENTS.md`, stop and report the conflict instead of silently weakening the invariant.

## Working rules

- Work only on the scope authorized by the current Issue.
- Prefer small, reviewable changes and explicit validation evidence.
- Do not introduce a second repository or control repository. JanusScope is intentionally a single-repository project.
- Do not vendor third-party runtimes or browser binaries into Git history.
- Do not commit `runtime/`, browser profiles, screenshots, logs, credentials, cookies, tokens, or captured site data.
- Do not require Administrator privileges for normal setup, update, launch, browsing, or screenshot capture.
- Do not modify system PATH, HKLM, Windows services, Program Files, endpoint-security policy, or global npm state.
- Do not disable, evade, tamper with, or request exclusions from XDR/EDR/antivirus controls.
- Do not add anti-detect, fingerprint randomization, CAPTCHA bypass, credential harvesting, proxy-anonymity, or endpoint-security bypass behavior.
- Browser engines are dependencies. Do not fork or maintain Chromium as part of this project.

## Validation expectations

Each implementation PR must state:

- what changed;
- which Issue/acceptance criteria it satisfies;
- commands/tests executed;
- whether any network downloads occurred and from which documented source;
- whether the change writes outside the JanusScope working directory;
- whether Administrator/UAC elevation was requested;
- known limitations or unverified assumptions.

If an acceptance criterion cannot be verified in the available environment, say so explicitly rather than claiming success.
