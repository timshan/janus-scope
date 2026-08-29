# JanusScope

JanusScope is a portable Windows web-inspection browser for comparing how the same site behaves in desktop and mobile browsing environments.

The primary use case is straightforward: open a target URL using a desktop profile or an Android-style mobile profile, interact with the site normally, and save screenshots when needed.

## Project goals

- Run under a standard Windows user account without Administrator privileges or UAC elevation.
- Be portable: no MSI installer, no global Node.js/Playwright dependency, no system PATH modification, and no registry/service installation.
- Use a repo-local/runtime-local Node.js + Playwright + Playwright-managed Chromium toolchain.
- Provide at least two browsing modes: Desktop and Android Mobile.
- Make screenshot capture simple and predictable.
- Keep browser/runtime components updateable so the bundled browsing engine does not become stale.
- Remain compatible with managed endpoint environments: do not disable, evade, tamper with, or request bypasses for XDR/EDR controls.

## Non-goals

JanusScope is not intended to be an anti-detect browser, fingerprint-randomization framework, CAPTCHA bypass tool, anonymity/VPN product, credential-harvesting tool, or endpoint-security bypass utility.

## Planned MVP

1. Portable no-admin runtime bootstrap.
2. Runtime validation and launch.
3. Desktop Chromium profile.
4. Android-style mobile emulation profile.
5. Screenshot capture with timestamp/domain/mode naming.
6. Controlled runtime update path.

See `docs/PROJECT.md`, `docs/REQUIREMENTS.md`, and `docs/ARCHITECTURE.md` for the project baseline.
