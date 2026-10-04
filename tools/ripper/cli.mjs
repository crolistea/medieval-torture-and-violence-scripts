#!/usr/bin/env node
/*
 * The Ripper, from a terminal. Same code as the page on the site.
 *
 *   node tools/ripper/cli.mjs lorebook.json              clean JSON on screen
 *   node tools/ripper/cli.mjs script.js -o clean.json    clean JSON in a file
 *   node tools/ripper/cli.mjs notes.txt --summary        one line per entry
 *   type notes.txt | node tools/ripper/cli.mjs -         read from standard input
 *
 * It reads the file you name and nothing else. Needs Node 22.18 or newer.
 */
import fs from "node:fs";
import process from "node:process";
import { rip, toCleanJson, RipError } from "../../src/ripper/index.ts";

const USAGE = "Usage: node tools/ripper/cli.mjs <file | -> [-o output.json] [--summary]";

const args = process.argv.slice(2);
if (!args.length || args.includes("-h") || args.includes("--help")) {
  console.log(USAGE);
  process.exit(args.length ? 0 : 1);
}

const summary = args.includes("--summary");
const outAt = args.indexOf("-o");
const outFile = outAt === -1 ? null : args[outAt + 1];
// The input is the first argument that is not a flag and not the value of -o.
const inputFile = args.find((arg, i) => (arg === "-" || !arg.startsWith("-")) && (outAt === -1 || i !== outAt + 1));

if (!inputFile || (outAt !== -1 && !outFile)) {
  console.error(USAGE);
  process.exit(1);
}

let input;
try {
  // File descriptor 0 is standard input.
  input = fs.readFileSync(inputFile === "-" ? 0 : inputFile, "utf8");
} catch (error) {
  console.error(`Could not read ${inputFile}: ${error.message}`);
  process.exit(1);
}

try {
  const result = rip(input);

  for (const warning of result.warnings) console.error(`note: ${warning}`);
  console.error(`${result.entries.length} entries, read as: ${result.formatLabel}`);

  if (summary) {
    for (const entry of result.entries) {
      const keys = entry.keys.length ? ` [${entry.keys.join(", ")}]` : "";
      console.log(`${String(entry.index).padStart(3)}  ${entry.name ?? entry.comment ?? "(no name)"}${keys}`);
    }
  } else if (outFile) {
    fs.writeFileSync(outFile, toCleanJson(result) + "\n");
    console.error(`wrote ${outFile}`);
  } else {
    console.log(toCleanJson(result));
  }
} catch (error) {
  if (!(error instanceof RipError)) throw error;
  console.error(`error: ${error.message}`);
  if (error.hint) console.error(`hint: ${error.hint}`);
  process.exit(2);
}
