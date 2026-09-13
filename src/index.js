/**
 * dsh-gate-game — node half.
 *
 * The browser UI is shipped through ./client. The host half only handles the
 * optional desktop shortcut. Shortcut creation is deliberately opt-in because
 * writing to a user's desktop is a side effect unrelated to game rendering.
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const inject = ["webServer"];

const PKG_DIR = dirname(fileURLToPath(import.meta.url));
const ASSET_DIR = join(PKG_DIR, "..", "assets");
const ICON_ICO = join(ASSET_DIR, "deepseek-logo.ico");
const ICON_PNG = join(ASSET_DIR, "deepseek-logo-256.png");
const DEFAULT_SHORTCUT_NAME = "DeepSeek Harness";

/** Make a user-provided file name safe on Windows, macOS, and Linux. */
function sanitizeShortcutName(value) {
	const input = typeof value === "string" ? value.trim() : "";
	let cleaned = input
		.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
		.replace(/\s+/g, " ")
		.replace(/[. ]+$/g, "")
		.slice(0, 80);
	if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(cleaned)) cleaned = `_${cleaned}`;
	return cleaned || DEFAULT_SHORTCUT_NAME;
}

function escapeXml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function escapeDesktopValue(value) {
	return String(value)
		.replace(/\\/g, "\\\\")
		.replace(/\r?\n/g, "\\n");
}

/** Convert a listen host to an address that is usable from a local browser. */
function normalizeHost(value) {
	const raw = typeof value === "string" ? value.trim() : "";
	const unwrapped = raw.startsWith("[") && raw.endsWith("]") ? raw.slice(1, -1) : raw;
	if (!unwrapped || unwrapped === "0.0.0.0" || unwrapped === "::" || unwrapped === "*") return "127.0.0.1";
	if (unwrapped.includes(":")) return `[${unwrapped}]`;
	return unwrapped;
}

function buildWebUrl(host, port) {
	const numericPort = Number(port);
	if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) return null;
	return `http://${normalizeHost(host)}:${numericPort}/`;
}

/** Pure shortcut renderer, exported so platform-specific escaping is testable. */
function buildShortcut(platformName, url, name, icons = {}) {
	const safeName = sanitizeShortcutName(name);
	if (platformName === "win32") {
		const lines = ["[InternetShortcut]", `URL=${url}`, "IDList="];
		if (icons.ico) lines.push(`IconFile=${icons.ico}`, "IconIndex=0");
		return { file: `${safeName}.url`, content: `${lines.join("\r\n")}\r\n`, executable: false };
	}
	if (platformName === "darwin") {
		const plist = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>URL</key>\n\t<string>${escapeXml(url)}</string>\n</dict>\n</plist>\n`;
		return { file: `${safeName}.webloc`, content: plist, executable: false };
	}
	const iconLine = icons.png ? `Icon=${escapeDesktopValue(icons.png)}\n` : "";
	const content = `[Desktop Entry]\nType=Link\nName=${escapeDesktopValue(safeName)}\nURL=${escapeDesktopValue(url)}\n${iconLine}`;
	return { file: `${safeName}.desktop`, content, executable: true };
}

function readXdgDesktopDir(home) {
	try {
		const configHome = process.env.XDG_CONFIG_HOME || join(home, ".config");
		const text = readFileSync(join(configHome, "user-dirs.dirs"), "utf8");
		const match = text.match(/^XDG_DESKTOP_DIR=(.+)$/m);
		if (!match) return null;
		let value = match[1].trim().replace(/^"|"$/g, "");
		value = value.replace(/\$HOME|\$\{HOME\}/g, home).replace(/\\"/g, '"');
		return isAbsolute(value) ? value : null;
	} catch {
		return null;
	}
}

/** Resolve the desktop directory without assuming the English folder name. */
function desktopDir(platformName = platform(), home = homedir()) {
	const candidates = platformName === "win32"
		? [join(home, "Desktop"), join(home, "OneDrive", "Desktop"), join(home, "OneDrive", "桌面"), join(home, "桌面")]
		: platformName === "linux"
			? [readXdgDesktopDir(home), join(home, "Desktop"), join(home, "桌面")].filter(Boolean)
			: [join(home, "Desktop"), join(home, "桌面")];
	for (const dir of candidates) {
		if (existsSync(dir)) return dir;
	}
	return candidates[0] || join(home, "Desktop");
}

/** Create or refresh the configured shortcut. */
function createShortcut(url, name, logger) {
	try {
		const dir = desktopDir();
		mkdirSync(dir, { recursive: true });
		const shortcut = buildShortcut(platform(), url, name, {
			ico: existsSync(ICON_ICO) ? ICON_ICO : "",
			png: existsSync(ICON_PNG) ? ICON_PNG : "",
		});
		const target = join(dir, shortcut.file);
		let previous = null;
		try { previous = readFileSync(target, "utf8"); } catch {}
		if (previous === shortcut.content) {
			logger.info(`dsh-gate-game: desktop shortcut is up to date (${target})`);
			return;
		}
		writeFileSync(target, shortcut.content, "utf8");
		if (shortcut.executable) {
			try { chmodSync(target, 0o755); } catch {}
		}
		logger.info(`dsh-gate-game: ${previous === null ? "created" : "updated"} desktop shortcut -> ${target} (${url})`);
	} catch (error) {
		logger.warn(`dsh-gate-game: failed to create desktop shortcut: ${error instanceof Error ? error.message : String(error)}`);
	}
}

function waitForPortAndCreate(ctx, config) {
	const name = sanitizeShortcutName(config.shortcutName || DEFAULT_SHORTCUT_NAME);
	let tries = 0;
	const timer = setInterval(() => {
		tries += 1;
		const port = ctx.webServer?.port;
		const url = buildWebUrl(ctx.webServer?.host, port);
		if (url) {
			clearInterval(timer);
			createShortcut(url, name, ctx.logger);
		} else if (tries >= 60) {
			clearInterval(timer);
			ctx.logger.warn("dsh-gate-game: web server port never resolved; skipped desktop shortcut");
		}
	}, 500);
	ctx.effect(() => () => clearInterval(timer), "dsh-gate-game: shortcut timer cleanup");
}

function apply(ctx, config = {}) {
	// Opt-in: installing a UI mini-game should not write to the desktop silently.
	if (config.shortcut !== true) return;
	waitForPortAndCreate(ctx, config);
}

export {
	DEFAULT_SHORTCUT_NAME,
	apply,
	buildShortcut,
	buildWebUrl,
	desktopDir,
	escapeXml,
	inject,
	normalizeHost,
	sanitizeShortcutName,
};
