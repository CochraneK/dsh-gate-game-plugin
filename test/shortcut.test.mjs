import test from "node:test";
import assert from "node:assert/strict";
import {
	DEFAULT_SHORTCUT_NAME,
	buildShortcut,
	buildWebUrl,
	escapeXml,
	normalizeHost,
	sanitizeShortcutName,
} from "../src/index.js";

test("sanitizeShortcutName removes path/control characters", () => {
	assert.equal(sanitizeShortcutName('  ../Deep:Seek\\Harness?.  '), ".._Deep_Seek_Harness_");
	assert.equal(sanitizeShortcutName("   "), DEFAULT_SHORTCUT_NAME);
	assert.ok(sanitizeShortcutName("x".repeat(100)).length <= 80);
});

test("sanitizeShortcutName avoids Windows reserved device names", () => {
	assert.equal(sanitizeShortcutName("CON"), "_CON");
	assert.equal(sanitizeShortcutName("lpt1.txt"), "_lpt1.txt");
	assert.equal(sanitizeShortcutName("console"), "console");
});

test("normalizeHost converts wildcard binds and brackets IPv6", () => {
	assert.equal(normalizeHost("0.0.0.0"), "127.0.0.1");
	assert.equal(normalizeHost("::"), "127.0.0.1");
	assert.equal(normalizeHost("::1"), "[::1]");
	assert.equal(normalizeHost("[::1]"), "[::1]");
	assert.equal(normalizeHost("localhost"), "localhost");
});

test("buildWebUrl validates ports", () => {
	assert.equal(buildWebUrl("::1", 3000), "http://[::1]:3000/");
	assert.equal(buildWebUrl("0.0.0.0", "8080"), "http://127.0.0.1:8080/");
	assert.equal(buildWebUrl("localhost", 0), null);
	assert.equal(buildWebUrl("localhost", 70000), null);
});

test("macOS shortcut escapes XML", () => {
	assert.equal(escapeXml('a&<b>"c\''), "a&amp;&lt;b&gt;&quot;c&apos;");
	const shortcut = buildShortcut("darwin", "http://localhost:3000/?a=1&b=2", "Harness", {});
	assert.match(shortcut.content, /a=1&amp;b=2/);
	assert.equal(shortcut.file, "Harness.webloc");
});

test("Windows shortcut includes icon when supplied", () => {
	const shortcut = buildShortcut("win32", "http://127.0.0.1:3000/", "Harness", { ico: "C:\\icon.ico" });
	assert.match(shortcut.content, /IconFile=C:\\icon\.ico/);
	assert.equal(shortcut.file, "Harness.url");
});

test("Linux shortcut escapes values and is executable", () => {
	const shortcut = buildShortcut("linux", "http://127.0.0.1:3000/", "Harness", { png: "/tmp/icon.png" });
	assert.match(shortcut.content, /^\[Desktop Entry\]/);
	assert.match(shortcut.content, /Type=Link/);
	assert.equal(shortcut.executable, true);
	assert.equal(shortcut.file, "Harness.desktop");
});
