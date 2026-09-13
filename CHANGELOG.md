# Changelog

## 0.2.0 - 2026-09-14

### Added
- Pointer/touch controls and keyboard controls (arrow keys / WASD), plus Escape-to-exit and initial dialog focus.
- Persistent best score, pause-on-background, responsive HUD, dark-mode styling, and reduced-motion support.
- Self-contained browser logo asset, removing the runtime dependency on the host `/favicon.svg`.
- Zero-dependency build/check workflow, Node built-in tests, and GitHub Actions CI on Node 20/22.
- Cross-platform shortcut sanitization (including Windows reserved device names), IPv6/wildcard-host handling, XDG Desktop discovery, XML escaping, and stale-shortcut refresh.

### Changed
- Renamed the user-facing action from a security-sounding “lock” to “break game / 休息游戏”. The full-screen overlay remains a convenience UI, not an authentication boundary.
- Desktop shortcut creation is now opt-in (`shortcut: true`) instead of an install-time side effect.
- Game collision detection now uses in-memory positions rather than layout reads for every falling icon on every animation frame.
- Source files live in `src/`; generated Harness-ready files stay in `lib/`.
- Compatibility documentation updated for DeepSeek Harness `v0.1.5-rc.2`.
