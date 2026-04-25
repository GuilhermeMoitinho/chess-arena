import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "node_modules/stockfish/bin");
const dest = resolve(root, "public/stockfish");

const files = [
  ["stockfish-18-lite-single.js", "stockfish.js"],
  ["stockfish-18-lite-single.wasm", "stockfish.wasm"],
];

if (!existsSync(src)) {
  console.error("[copy-stockfish] stockfish package not found in node_modules. Run install first.");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const [from, to] of files) {
  copyFileSync(resolve(src, from), resolve(dest, to));
  console.log(`[copy-stockfish] ${from} -> public/stockfish/${to}`);
}
