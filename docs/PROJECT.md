# Project Definition

## Purpose

JanusScope is a portable Windows web-inspection browser that lets a standard user compare how the same website behaves in desktop and mobile browsing environments and save screenshots of the observed content.

The project exists for situations where a site may return materially different content based on client/device characteristics. The tool should make those differences easy to inspect without requiring the user to install or administer a browser-development stack.

## Primary users

- Investigators, analysts, and office users who need to inspect mobile-specific web content from a Windows PC.
- Users operating on managed Windows endpoints where Administrator rights are unavailable.

## Primary workflow

1. Launch JanusScope from a portable folder.
2. Enter or open a target URL.
3. Choose a browsing mode:
   - Desktop
   - Android Mobile
4. Interact with the page in a normal Chromium window.
5. Capture screenshots as needed.
6. Update the local runtime through a controlled updater when appropriate.

## MVP scope

### Included

- Windows standard-user execution.
- Portable bootstrap and runtime.
- Repo-local/runtime-local Node.js.
- Local Playwright dependency.
- Playwright-managed Chromium stored in a project-local runtime location.
- Desktop browser profile.
- Android-style mobile browser profile.
- Simple screenshot capture.
- Predictable screenshot naming and storage.
- Runtime version visibility and controlled updates.
- Clear errors when a required runtime component is missing or blocked.

### Deferred

- Rich GUI beyond what is needed to launch/select modes.
- Automated visual diffing.
- Batch URL scanning.
- Physical Android or Android Emulator integration.
- Advanced case/session management.

## Explicit non-goals

JanusScope is not an anti-detect browser and does not aim to hide automation or defeat browser/site security controls. It is not intended for fingerprint randomization, CAPTCHA bypass, credential harvesting, anonymity/VPN services, endpoint-security bypass, or maintenance of a custom browser engine.

## Deployment assumptions

- Initial target: current supported Windows x64 systems.
- Normal operation must work without Administrator privileges.
- The endpoint may be managed by Trend Micro XDR/EDR or equivalent controls.
- Security controls may block execution or downloads; JanusScope must report that condition rather than attempting to bypass it.
- Internet access may be restricted by enterprise proxy/security policy; controlled/offline runtime preparation may be introduced after the baseline online bootstrap works.

## Product success criteria

The MVP is successful when a standard Windows user can, from a clean portable folder:

1. prepare the local runtime without UAC elevation;
2. launch a desktop Chromium session;
3. launch an Android-style mobile-emulated Chromium session;
4. browse interactively;
5. save a screenshot with enough filename/context to identify time, host, and browsing mode;
6. repeat the workflow without system-wide installation or configuration changes.
