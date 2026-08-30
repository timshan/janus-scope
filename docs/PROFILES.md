# Desktop／Android Mobile Client Profiles

本文件說明 Issue #5 納入的兩個可審查 client profile。兩者都使用 Issue #1 準備的 repo-local Node.js、Playwright 與 Playwright-managed Chromium；不使用系統 Chrome／Edge，也不建立第二套 runtime。

## Desktop

Desktop 沿用 Issue #2 已驗收行為：

- Playwright persistent context；
- `headless: false`；
- state 存放於 `profile\desktop\`；
- 不套用 mobile User-Agent、viewport、touch 或 device descriptor。

## Android Mobile

Android Mobile 重用固定 Playwright `1.62.1` 內建的官方 **`Pixel 7`** device descriptor。實際在 pinned local package 查得的主要設定如下：

| 設定 | Pixel 7 descriptor 值 |
|---|---|
| Browser type | `chromium` |
| User-Agent identity | Linux / Android 14 / Pixel 7 / Chrome Mobile |
| Viewport | 412 × 839 |
| Screen | 412 × 915 |
| Device pixel ratio | 2.625 |
| `isMobile` | `true` |
| `hasTouch` | `true` |
| State path | `profile\android-mobile\` |

程式在每次 Mobile 啟動前都會確認 descriptor 存在、browser type 是 Chromium、User-Agent 是 Android、viewport／screen／DPR 有效，且 mobile／touch flags 都是 `true`。Descriptor 不符合時會停止，不會改用其他裝置或系統瀏覽器。

這是 Playwright／Chromium 提供的 Android-style browser emulation，用於建立有明確 User-Agent、viewport、screen、DPR 與 touch 能力的 client context；**不等於真正的 Android 手機、Android Emulator 或完整作業系統模擬**，也不宣稱網站無法辨識 automation。

## Profile isolation

```text
profile\
├─ desktop\
└─ android-mobile\
```

Desktop 與 Android Mobile 不共用 persistent profile，避免 Cookie、local storage 與裝置相關 state 混用。整個 `profile\` 已由 Git 排除。

## 可重複驗證

執行：

```bat
scripts\validate-profiles.bat
```

驗證會依序實際啟動 headed Desktop 與 Android Mobile Chromium，從 page 讀取：

- `navigator.userAgent`
- `window.innerWidth` / `window.innerHeight`
- `window.devicePixelRatio`
- `navigator.maxTouchPoints`
- mode 與 profile path

最後要求 Desktop 與 Android Mobile 在 User-Agent、viewport 與 touch capability 上具有預期差異；通過時輸出 `CLIENT_PROFILE_DIFFERENCE_PASS`。驗證不會截圖、建立 trace／HAR，或加入 anti-detect、stealth、proxy 與 fingerprint randomization。

`Pixel 7` descriptor 的 configured viewport 是 412 × 839；headed Chromium 在 Windows 的 `window.innerHeight` 可能因 device-scale rounding 回報相差 1 CSS pixel，因此 validation 對高度只允許 ±1，寬度、DPR、User-Agent 與 touch 仍須符合 descriptor／預期能力。
