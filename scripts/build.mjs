import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = ["index.js", "client.js"];
const check = process.argv.includes("--check");
let mismatches = 0;

await mkdir(resolve(root, "lib"), { recursive: true });
for (const name of files) {
	const src = resolve(root, "src", name);
	const out = resolve(root, "lib", name);
	const content = await readFile(src, "utf8");
	if (check) {
		let current = "";
		try { current = await readFile(out, "utf8"); } catch {}
		if (current !== content) {
			console.error(`generated file is stale: lib/${name}`);
			mismatches += 1;
		}
	} else {
		await writeFile(out, content, "utf8");
		console.log(`built lib/${name}`);
	}
}
if (mismatches) process.exitCode = 1;
