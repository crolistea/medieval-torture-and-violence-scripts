import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { rip, toCleanJson, RipError } from "../src/ripper/index.ts";

const fixture = (name) => fs.readFileSync(new URL(`./fixtures/ripper/${name}`, import.meta.url), "utf8");

/** Runs rip() on input that must be refused, and returns the error. */
function refused(input) {
  try {
    rip(input);
  } catch (error) {
    assert.ok(error instanceof RipError, `expected a RipError, got ${error}`);
    return error;
  }
  assert.fail("expected rip() to refuse this input");
}

const ENTRY_FIELDS = [
  "index", "name", "content", "keys", "secondaryKeys", "order", "priority",
  "category", "comment", "enabled", "constant", "insertion", "extra", "inferred",
];

/* ---------- JSON exports ---------- */

test("lorebook JSON: a list of entries", () => {
  const result = rip(fixture("janitor-lorebook.json"));
  assert.equal(result.format, "lorebook-json");
  assert.equal(result.entries.length, 3);

  const [harbor, voss, ghost] = result.entries;
  assert.deepEqual(harbor.keys, ["harbor", "docks"], "key and keysRaw are merged without repeats");
  assert.deepEqual(harbor.secondaryKeys, ["night"]);
  assert.equal(harbor.content, "A crowded harbor that smells of tar.");
  assert.equal(harbor.name, null, "a comment is not promoted to a name");
  assert.equal(harbor.comment, "The Harbor");
  assert.equal(harbor.order, 10);
  assert.equal(harbor.priority, 3);
  assert.equal(harbor.category, "place");
  assert.equal(harbor.enabled, true);
  assert.equal(harbor.constant, false);
  assert.deepEqual(harbor.insertion, { probability: 100, selective: true, selectiveLogic: 0, caseSensitive: false });
  assert.deepEqual(harbor.extra, { uid: 0 }, "unknown fields are kept as they were");

  assert.deepEqual(voss.keys, ["voss", "the captain"], "a comma separated string becomes a list");
  assert.equal(voss.enabled, false);
  assert.equal(voss.priority, null, "a missing field stays null");

  assert.equal(ghost.content, "");
  assert.ok(result.warnings.some((w) => /Keys but no body.*no content/.test(w)));
  assert.ok(result.warnings.some((w) => /Item 4 has no name, keys or content/.test(w)));
  assert.ok(result.warnings.some((w) => /Item 5 is not an entry object/.test(w)));
});

test("world info JSON: entries stored as a map, book facts kept", () => {
  const result = rip(fixture("worldinfo.json"));
  assert.equal(result.format, "worldinfo-json");
  assert.deepEqual(result.source, { name: "Port Town", description: "Lore for the port.", scan_depth: 4 });
  assert.equal(result.entries.length, 2);

  const [harbor, voss] = result.entries;
  assert.equal(harbor.order, 100);
  assert.equal(harbor.category, "places");
  assert.equal(harbor.enabled, true, "disable:false means enabled");
  assert.deepEqual(harbor.insertion, { position: 1, depth: 4, probability: 100, selective: true, matchWholeWords: true });
  assert.equal(voss.enabled, false, "disable:true means not enabled");
  assert.equal(voss.constant, true);
  assert.deepEqual(voss.secondaryKeys, ["captain"]);
});

test("character card JSON: the lorebook inside the card", () => {
  const result = rip(fixture("character-card.json"));
  assert.equal(result.format, "character-card-json");
  assert.deepEqual(result.source, { name: "Mira's book", character: "Mira" });
  assert.equal(result.entries.length, 1);

  const [forge] = result.entries;
  assert.equal(forge.name, "The Forge");
  assert.equal(forge.comment, "main location");
  assert.deepEqual(forge.keys, ["forge"]);
  assert.deepEqual(forge.secondaryKeys, ["anvil"]);
  assert.equal(forge.order, 7);
  assert.equal(forge.priority, 2);
  assert.deepEqual(forge.insertion, { position: "before_char", caseSensitive: true });
  assert.deepEqual(forge.extra, { id: 1, extensions: { depth: 2 } });
});

test("script record JSON: lorebook stored as a JSON string", () => {
  const record = { id: "abc", title: "Port book", type: "lorebook", script: fixture("janitor-lorebook.json") };
  const result = rip(JSON.stringify(record));
  assert.equal(result.format, "script-record-json");
  assert.deepEqual(result.source, { id: "abc", title: "Port book", type: "lorebook" });
  assert.equal(result.entries.length, 3);
});

test("script record JSON: lorebook stored as JavaScript", () => {
  const record = { title: "Advanced", type: "advanced", script: fixture("advanced-lorebook.js") };
  const result = rip(JSON.stringify(record));
  assert.equal(result.format, "script-record-json");
  assert.equal(result.source.title, "Advanced");
  assert.equal(result.entries.length, 6);
});

test("other JSON shapes: a wrapper field, a single entry, a name map", () => {
  assert.equal(rip('{"lorebook":[{"keys":["a"],"content":"x"}]}').entries.length, 1);
  assert.equal(rip('{"keys":["a"],"content":"x"}').entries.length, 1);
  const map = rip('{"one":{"keys":["a"],"content":"x"},"two":{"keys":["b"],"content":"y"}}');
  assert.deepEqual(map.entries.map((e) => e.content), ["x", "y"]);
});

test("JSON inside a ``` fence or with a byte order mark is still read", () => {
  assert.equal(rip('```json\n[{"keys":["a"],"content":"x"}]\n```').entries.length, 1);
  assert.equal(rip('﻿[{"keys":["a"],"content":"x"}]').entries.length, 1);
});

/* ---------- JavaScript ---------- */

test("javascript: entries are read from source without running it", () => {
  const result = rip(fixture("advanced-lorebook.js"));
  assert.equal(result.format, "javascript");
  assert.deepEqual(result.source.lists, [{ variable: "loreEntries", line: 16, entries: 6 }]);
  assert.deepEqual(result.source.settings, { DEBUG: false, MAX_ENTRIES: 3 });

  const byName = Object.fromEntries(result.entries.map((e) => [e.name, e]));
  assert.deepEqual(Object.keys(byName), ["The Harbor", "Captain Voss", "The Toll", "Rumors", "Greeting", "Empty one"]);

  assert.deepEqual(byName["The Harbor"].keys, ["harbor", "docks"], "a reference to an earlier list is followed");
  assert.equal(byName["The Harbor"].content, "A crowded harbor. It smells of tar, and the gulls don't stop.");
  assert.equal(byName["The Harbor"].priority, 10);
  assert.equal(byName["The Harbor"].category, "place");
  assert.deepEqual(byName["The Harbor"].extra, { filters: { notWith: ["inland"] } });

  assert.deepEqual(byName["Captain Voss"].keys, ["voss", "the captain", "captain voss"]);
  assert.equal(byName["Captain Voss"].content, "Captain Voss runs the night watch.\nShe limps on her left leg.");
  assert.equal(byName["Captain Voss"].order, 20);
  assert.deepEqual(byName["Captain Voss"].insertion, { probability: 80 });

  assert.equal(byName["The Toll"].content, "Ships pay a toll at the chain.", "joined text is put together");
  assert.equal(byName["Rumors"].content, "- The lighthouse keeper is missing.\n- Someone cut the chain last winter.");
  assert.equal(byName["Rumors"].comment, "joined with code");
});

test("javascript: computed values are left out and reported, never guessed", () => {
  const result = rip(fixture("advanced-lorebook.js"));
  const toll = result.entries.find((e) => e.name === "The Toll");
  assert.ok(!("weight" in toll.extra));
  assert.equal(result.entries.find((e) => e.name === "Greeting").content, "Welcome, ${context.character.name}.");
  assert.ok(result.warnings.some((w) => /"weight"/.test(w) && /placeholder/.test(w)));
});

test("javascript: strings, comments and regular expressions do not fool it", () => {
  const names = rip(fixture("advanced-lorebook.js")).entries.map((e) => e.name);
  assert.ok(!names.includes("in a comment"));
  assert.ok(!names.includes("inside a string"));
});

test("javascript: nothing in the source is executed", () => {
  globalThis.__ripperRan = false;
  const source = 'globalThis.__ripperRan = true;\nconst entries = [{ name: "A", keys: ["a"], content: (globalThis.__ripperRan = true, "x") }];';
  const result = rip(source);
  assert.equal(globalThis.__ripperRan, false);
  assert.equal(result.entries[0].content, "", "a computed content is not invented");
  delete globalThis.__ripperRan;
});

test("javascript: the scripts in this repository can be read", () => {
  const equipment = rip(fs.readFileSync("historical_equipment.js", "utf8"));
  assert.equal(equipment.format, "javascript");
  assert.ok(equipment.entries.length > 20);
  assert.equal(equipment.entries[0].name, "The Rack");
  assert.ok(equipment.entries[0].keys.includes("rack"));
  assert.equal(equipment.source.settings.MAX_TOKENS, 220);
});

test("javascript: several lists are told apart by an inferred category", () => {
  const result = rip(fs.readFileSync("action_variety_engine.js", "utf8"));
  assert.ok(result.source.lists.length > 1);
  const first = result.entries[0];
  assert.equal(first.category, result.source.lists[0].variable);
  assert.deepEqual(first.inferred, ["category"], "a guessed field is marked as guessed");
});

test("javascript: a list passed straight to a call or assigned to a property", () => {
  assert.equal(rip('"use worker";\naddLore([{ keys: ["a"], content: "x" }]);').entries.length, 1);
  const assigned = rip('context.lore = [{ keys: ["a"], content: "x" }, { keys: ["b"], content: "y" }];');
  assert.equal(assigned.entries.length, 2);
  assert.equal(assigned.source.lists[0].variable, "context.lore");
});

test("javascript: loose JSON with single quotes and trailing commas", () => {
  const result = rip("[{name:'A', keys:['a','b',], content:'x',},]");
  assert.equal(result.format, "lorebook-json");
  assert.deepEqual(result.entries[0].keys, ["a", "b"]);
  assert.ok(result.warnings.some((w) => /not strict JSON/.test(w)));
});

test("javascript: a script with no entry list is refused with the variables it saw", () => {
  const error = refused(fs.readFileSync("bloodloss.js", "utf8"));
  assert.equal(error.code, "no-entries");
  assert.match(error.hint, /HISTORY_DEPTH/);
});

test("javascript: broken source is refused with a line number", () => {
  const error = refused('const entries = [\n  { name: "A", content: "never closed }\n];');
  assert.equal(error.code, "bad-javascript");
  assert.equal(error.line, 2);
  assert.match(error.message, /quote is never closed/);

  assert.equal(refused("const a = [{ name: 'x', content: 'y' }; /* open").code, "bad-javascript");
});

/* ---------- Text ---------- */

test("plain text: Name / Keys / Category lines and separators", () => {
  const result = rip(fixture("notes.txt"));
  assert.equal(result.format, "plain-text");
  assert.equal(result.entries.length, 3);

  const [harbor, voss, loose] = result.entries;
  assert.equal(harbor.name, "The Harbor");
  assert.deepEqual(harbor.keys, ["harbor", "docks"]);
  assert.equal(harbor.category, "place");
  assert.equal(harbor.order, 5);
  assert.equal(harbor.comment, "first one");
  assert.equal(harbor.content, "A crowded harbor.\n\nIt smells of tar.");

  assert.equal(voss.name, "Voss");
  assert.deepEqual(voss.keys, ["voss", "the captain"]);
  assert.equal(voss.content, "She limps on her left leg.");

  assert.equal(loose.name, null);
  assert.deepEqual(loose.keys, []);
  assert.deepEqual(result.warnings, []);
});

test("plain text: headings name entries", () => {
  const result = rip("[The Harbor]\nKeys: harbor\nA crowded harbor.\n\n## Voss\nShe limps.\n\n== Toll ==\nShips pay.");
  assert.deepEqual(result.entries.map((e) => e.name), ["The Harbor", "Voss", "Toll"]);
  assert.deepEqual(result.entries[0].keys, ["harbor"]);
});

test("plain text: with no structure, paragraphs become unnamed entries and it says so", () => {
  const result = rip("A harbor town.\nIt smells of tar.\n\nCaptain Voss runs the watch.");
  assert.equal(result.entries.length, 2);
  assert.ok(result.entries.every((e) => e.name === null && e.keys.length === 0 && e.inferred.length === 0));
  assert.equal(result.entries[0].content, "A harbor town.\nIt smells of tar.");
  assert.ok(result.warnings.some((w) => /each paragraph became one entry/.test(w)));
});

/* ---------- Assembled prompts ---------- */

test("chat request JSON: the system prompt is split into its sections", () => {
  const result = rip(fixture("chat-payload.json"));
  assert.equal(result.format, "chat-payload-json");
  assert.deepEqual(result.source, { model: "example-model", temperature: 0.8 });
  assert.deepEqual(
    result.entries.map((e) => [e.name, e.content]),
    [
      [null, "[System note: stay in character]"],
      ["Mira's Persona", "Mira is a smith.\n\nShe is blunt."],
      ["Scenario", "A forge at night."],
      [null, "The Guild controls iron prices."],
      [null, "The harbor closes at dusk."],
    ],
  );
  assert.ok(result.warnings.some((w) => /3 blocks of text sat outside any tag/.test(w)));
});

test("prompt text: pasted tagged sections are detected", () => {
  const result = rip("<Scenario>A forge at night.</Scenario>\n<Rules>No magic.</Rules>");
  assert.equal(result.format, "prompt-text");
  assert.deepEqual(result.entries.map((e) => e.name), ["Scenario", "Rules"]);
  assert.deepEqual(result.warnings, []);
});

test("chat request JSON without a system message is refused", () => {
  const error = refused('{"messages":[{"role":"user","content":"hi"}]}');
  assert.equal(error.code, "no-entries");
  assert.match(error.message, /no system message/);
});

/* ---------- Bad input ---------- */

test("empty input is refused", () => {
  for (const input of ["", "   \n\t ", undefined, null, 42]) {
    assert.equal(refused(input).code, "empty");
  }
});

test("malformed JSON is refused with a reason and a position", () => {
  const cases = [
    ['{"a": 1,\n "b": }', 2, /Unexpected "}"/],
    ['[{"keys":["a"],"content":"x"},,]', 1, /Unexpected ","/],
    ['[{"keys":["a"],\n"content":"x}]', 2, /quote is never closed/],
    ['{"entries": [{"content":"x"}', 1, /ends before/],
    ['[{"content":"x"}] trailing', 1, /extra text after the end/],
  ];
  for (const [input, line, reason] of cases) {
    const error = refused(input);
    assert.equal(error.code, "bad-json", input);
    assert.equal(error.line, line, input);
    assert.match(error.message, reason);
    assert.ok(error.hint);
  }
});

test("valid JSON with no entries is refused and says what it found", () => {
  assert.equal(refused("[]").code, "no-entries");
  assert.equal(refused("[1, 2, 3]").code, "no-entries");
  const error = refused('{"version": 2, "settings": {"a": 1}}');
  assert.equal(error.code, "no-entries");
  assert.match(error.hint, /version, settings/);
  assert.equal(refused('{"script": "  "}').code, "no-entries");
  assert.equal(refused('{"character_book": {"name": "x"}}').code, "no-entries");
});

test("a list where every item is empty is refused, not returned empty", () => {
  const error = refused('[{}, {"uid": 4}]');
  assert.equal(error.code, "no-entries");
  assert.match(error.message, /Nothing usable/);
});

/* ---------- Output ---------- */

test("every entry has the same fields, whatever the input was", () => {
  const inputs = [
    fixture("janitor-lorebook.json"),
    fixture("worldinfo.json"),
    fixture("character-card.json"),
    fixture("chat-payload.json"),
    fixture("advanced-lorebook.js"),
    fixture("notes.txt"),
    "Just one paragraph.",
  ];
  for (const input of inputs) {
    const result = rip(input);
    assert.ok(result.formatLabel);
    result.entries.forEach((entry, position) => {
      assert.deepEqual(Object.keys(entry), ENTRY_FIELDS);
      assert.equal(entry.index, position + 1);
      assert.equal(typeof entry.content, "string");
      assert.ok(Array.isArray(entry.keys) && Array.isArray(entry.secondaryKeys) && Array.isArray(entry.inferred));
    });
  }
});

test("clean JSON output round-trips and can be ripped again", () => {
  const first = rip(fixture("janitor-lorebook.json"));
  const clean = toCleanJson(first);
  const parsed = JSON.parse(clean);
  assert.equal(parsed.count, 3);
  assert.equal(parsed.format, "lorebook-json");

  const again = rip(clean);
  assert.equal(again.entries.length, 3);
  assert.deepEqual(again.entries[0].keys, first.entries[0].keys);
  assert.equal(again.entries[0].content, first.entries[0].content);
  assert.equal(again.entries[0].order, first.entries[0].order);
});

test("Windows line endings do not change the result", () => {
  const unix = rip(fixture("notes.txt").replace(/\r\n/g, "\n"));
  const windows = rip(fixture("notes.txt").replace(/\r?\n/g, "\r\n"));
  assert.deepEqual(windows.entries, unix.entries);
});
