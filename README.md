# dsh-gate-game

A standard **Cordis client plugin** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) that adds a logo-eating mini-game and a one-click lock button to the web UI.

## What it does

- **Lock button** — a DeepSeek-logo button appears in the sidebar footer. Click it to lock the screen with a full-screen overlay.
- **Logo-eating game** — while locked, small DeepSeek logos fall from the top. Move your mouse (a big glowing logo) to eat them. The more you eat, the bigger you grow — until you burst.
- **Unlock** — click the unlock button to dismiss the overlay and return to your session.

> This is the **plugin version** (game + lock only). The separate injection-based tool adds a password gate that blocks the app before it loads; that cannot be done from a Cordis plugin, which runs inside the already-loaded app.

## Install

```bash
dsh plugin --profile web add github:<you>/dsh-gate-game
```

Or from a local checkout:

```bash
dsh plugin --profile web add ./dsh-gate-game
```

Then restart `dsh web`. The lock button appears in the sidebar footer.

## Requirements

- DeepSeek Harness `v0.1.0-rc.7` (developer preview)
- Web profile (`dsh web`)

## How it works

This is a standard Cordis client plugin:

- `package.json` declares `dsh.client` (`platform: "web"`) and `dsh.bundle.patch`, so `dsh plugin add` registers it as a profile layer and the module registry auto-scans it into `window.__DSH_BOOT__`.
- `lib/index.js` — node half (empty `apply`; pure UI plugin).
- `lib/client.js` — browser half, registered via `window.__ModuleLoader__.load`. It injects CSS and registers a `LockButton` component into the `sidebar.footer.action` slot.
- `cordis.patch.yml` — inserts the node-half entry.

No app code is modified; the plugin mounts through the official slot system.

## License

MIT
