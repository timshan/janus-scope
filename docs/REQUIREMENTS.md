# Requirements

This document defines the project invariants and MVP acceptance requirements.

## Invariants

### JS-INV-001 — Standard-user operation
Normal setup, update, launch, browsing, and screenshot capture MUST NOT require Windows Administrator privileges or UAC elevation.

### JS-INV-002 — No system-wide installation
JanusScope MUST NOT require MSI installation, `winget`, Chocolatey, global npm packages, system PATH changes, HKLM changes, Windows services, or writes to Program Files for normal operation.

### JS-INV-003 — Portable runtime
Node.js, Playwright dependencies, and Playwright-managed Chromium MUST be usable from project-local/runtime-local paths. The project MUST NOT depend on a globally installed Node.js, Playwright, Chrome, or Edge.

### JS-INV-004 — Runtime artifacts stay out of Git
Downloaded runtime binaries, browser binaries, user profiles, screenshots, logs, credentials, cookies, tokens, and captured site data MUST NOT be committed to the repository.

### JS-INV-005 — Endpoint-security compatibility
JanusScope MUST NOT disable, evade, tamper with, or request bypass/exclusion of XDR, EDR, antivirus, application-control, proxy, or equivalent enterprise security controls. If those controls block an operation, JanusScope MUST fail clearly rather than bypassing them.

### JS-INV-006 — Documented runtime sources
Downloaded third-party runtime artifacts MUST come from predefined/documented upstream sources and SHOULD use upstream-provided integrity metadata or a project-controlled verification mechanism where practical.

### JS-INV-007 — Browser engine as dependency
Chromium is a dependency managed through Playwright. JanusScope MUST NOT fork or maintain its own Chromium engine.

### JS-INV-008 — No anti-detect feature creep
The project MUST NOT add fingerprint randomization, CAPTCHA bypass, credential harvesting, anonymity/VPN behavior, endpoint-security bypass behavior, or mechanisms whose primary purpose is evading site/browser detection.

## MVP functional requirements

### JS-FUNC-001 — Bootstrap
A standard Windows user MUST be able to prepare the required local runtime from the project folder using a documented bootstrap command/script.

### JS-FUNC-002 — Idempotent setup
Re-running setup on an already healthy runtime MUST NOT unnecessarily reinstall or corrupt the working runtime.

### JS-FUNC-003 — Runtime validation
Before launch, JanusScope MUST be able to detect whether required runtime components are present and produce actionable errors when they are missing or unusable.

### JS-FUNC-004 — Desktop mode
JanusScope MUST launch an interactive Chromium session using a desktop browsing profile.

### JS-FUNC-005 — Android mobile mode
JanusScope MUST launch an interactive Chromium session using an Android-style mobile-emulation profile that at minimum configures a mobile user agent, mobile viewport/screen characteristics, touch support, and mobile context settings through Playwright.

### JS-FUNC-006 — Mode visibility
The user MUST be able to determine which browsing mode/profile is currently being launched or used.

### JS-FUNC-007 — Screenshot capture
The user MUST be able to save a screenshot of the observed page/session without external screenshot software being required by JanusScope.

### JS-FUNC-008 — Screenshot naming
Saved screenshots SHOULD include a timestamp, target host/domain when available, and browsing mode in their filename, using filesystem-safe characters.

### JS-FUNC-009 — Screenshot storage
Screenshots MUST be saved under a local ignored path such as `screenshots/` and MUST NOT be automatically committed or uploaded.

### JS-FUNC-010 — Runtime version reporting
JanusScope MUST provide a way to report the active JanusScope/Node.js/Playwright/Chromium runtime versions or revisions needed for support and update decisions.

### JS-FUNC-011 — Controlled update
The runtime update flow MUST update Playwright and its compatible Playwright-managed Chromium coherently rather than independently substituting an arbitrary browser binary.

## Operational requirements

### JS-OPS-001 — Predictable process/runtime paths
Runtime executables SHOULD live under stable, documented project-local paths to simplify support and enterprise application-control review.

### JS-OPS-002 — No hidden execution tricks
Normal scripts MUST NOT use encoded PowerShell commands, random executable renaming, concealed temporary execution paths, or similar patterns intended to obscure process behavior.

### JS-OPS-003 — Failure transparency
Network download failure, permission denial, XDR/application-control blocking, missing dependency, or corrupted runtime MUST result in a clear non-zero failure and an actionable message.

### JS-OPS-004 — Clean removal
Removing the JanusScope working directory SHOULD remove the application/runtime state except for artifacts the user deliberately stored elsewhere.

## Initial platform boundary

- Windows x64 is the first supported target.
- ARM64 and other operating systems are out of MVP scope unless explicitly added by a later Issue.
