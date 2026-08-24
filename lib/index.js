/**
 * dsh-gate-game — node half.
 *
 * Besides the (empty) UI-plugin mount, this half creates a desktop shortcut
 * pointing at the running web UI once the server has listened, so users get a
 * one-click entry after install. Cross-platform:
 *   - Windows: `<Desktop>/<name>.url`   (InternetShortcut, with icon)
 *   - macOS:   `<Desktop>/<name>.webloc`
 *   - Linux:   `<Desktop>/<name>.desktop`
 *
 * Config (cordis entry config):
 *   shortcut:      boolean, default true  — create the shortcut at all
 *   shortcutName:  string,  default "DeepSeek Harness" — shortcut file name
 */
import { homedir, platform } from "node:os";
import { join, dirname } from "node:path";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Service required: the web server (to read the listened port). */
const inject = ["webServer"];

const PKG_DIR = dirname(fileURLToPath(import.meta.url)); // .../lib
const ASSET_DIR = join(PKG_DIR, "..", "assets");
const ICON_ICO = join(ASSET_DIR, "deepseek-logo.ico");
const ICON_PNG = join(ASSET_DIR, "deepseek-logo-256.png");

/** Resolve the user's Desktop directory (best effort, per-platform). */
function desktopDir() {
	const home = homedir();
	const candidates = platform() === "win32"
		? [join(home, "Desktop"), join(home, "OneDrive", "Desktop"), join(home, "OneDrive", "桌面"), join(home, "桌面")]
		: [join(home, "Desktop"), join(home, "桌面")];
	for (const dir of candidates) {
		if (existsSync(dir)) return dir;
	}
	return join(home, "Desktop");
}

/** Build the shortcut file content + extension for the current platform. */
function buildShortcut(url, name) {
	if (platform() === "win32") {
		const lines = [
			"[InternetShortcut]",
			`URL=${url}`,
			"IDList=",
		];
		if (existsSync(ICON_ICO)) lines.push(`IconFile=${ICON_ICO}`, "IconIndex=0");
		return { file: `${name}.url`, content: lines.join("\r\n") + "\r\n" };
	}
	if (platform() === "darwin") {
		const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>URL</key>
	<string>${url}</string>
</dict>
</plist>
`;
		return { file: `${name}.webloc`, content: plist };
	}
	// Linux / others: freedesktop .desktop entry
	const icon = existsSync(ICON_PNG) ? ICON_PNG : "";
	const content = `[Desktop Entry]
Type=Link
Name=${name}
URL=${url}
${icon ? `Icon=${icon}\n` : ""}`;
	return { file: `${name}.desktop`, content };
}

/** Create the desktop shortcut (idempotent: skips if the file already exists). */
function createShortcut(url, name, logger) {
	try {
		const dir = desktopDir();
		mkdirSync(dir, { recursive: true });
		const { file, content } = buildShortcut(url, name);
		const target = join(dir, file);
		if (existsSync(target)) {
			logger.info(`dsh-gate-game: desktop shortcut already exists, skipping (${target})`);
			return;
		}
		writeFileSync(target, content, "utf8");
		logger.info(`dsh-gate-game: created desktop shortcut -> ${target} (${url})`);
	} catch (error) {
		logger.warn(`dsh-gate-game: failed to create desktop shortcut: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Wait until the web server has a listened port, then create the shortcut.
 * There is no "listened" event, so poll briefly (the server listens during
 * boot activation, well before this settles).
 */
function waitForPortAndCreate(ctx, config) {
	const name = config.shortcutName || "DeepSeek Harness";
	let tries = 0;
	const timer = setInterval(() => {
		tries++;
		const port = ctx.webServer?.port;
		if (port) {
			clearInterval(timer);
			const host = ctx.webServer.host === "0.0.0.0" ? "127.0.0.1" : (ctx.webServer.host || "127.0.0.1");
			createShortcut(`http://${host}:${port}/`, name, ctx.logger);
		} else if (tries > 60) { // ~30s
			clearInterval(timer);
			ctx.logger.warn("dsh-gate-game: web server port never resolved; skipped desktop shortcut");
		}
	}, 500);
	// clean up if the plugin is disposed before the port resolves
	ctx.effect(() => () => clearInterval(timer), "dsh-gate-game: shortcut timer cleanup");
}

/** Host plugin body. */
function apply(ctx, config = {}) {
	if (config.shortcut === false) return; // opt-out
	waitForPortAndCreate(ctx, config);
}

export { apply, inject };
