import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function run(file, character, messages, lastMessage) {
  const context = { character: { scenario: "", ...character }, chat: { last_messages: messages, last_message: lastMessage } };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), { context, console });
  return context.character.scenario;
}

test("quiet module ignores a normal question", () => {
  const out = run("the_quiet_part.js", { personality: "quiet and reserved" }, [{ content: "Why is the sky blue?" }]);
  assert.doesNotMatch(out, /\[THE QUIET PART\]/);
});

test("quiet module activates for guarded character under confrontation", () => {
  const out = run("the_quiet_part.js", { personality: "guarded and secretive" }, [{ content: "Tell me the truth. What are you hiding?" }]);
  assert.match(out, /\[THE QUIET PART\]/);
});

test("talkative characterization resists silence guidance", () => {
  const out = run("the_quiet_part.js", { personality: "talkative, chatty, candid, guarded" }, [{ content: "Tell me the truth. What are you hiding?" }]);
  assert.doesNotMatch(out, /\[THE QUIET PART\]/);
});

test("newest-first history ignores an old hostile tail message", () => {
  const messages = [
    { content: "We are calmly discussing dinner." },
    { content: "The weather is mild." },
    { content: "Nothing hostile happens." },
    { content: "A quiet afternoon." },
    { content: "They talk about books." },
    { content: "They drink tea." },
    { content: "revenge punish torture kill humiliate" }
  ];
  const out = run("say_something_horrible.js", { personality: "vulgar" }, messages);
  assert.doesNotMatch(out, /\[DIALOGUE INTENSITY\]/);
});

test("shared budget is never exceeded when all modules run", () => {
  const context = {
    character: { scenario: "", personality: "sadistic cruel vulgar calculating manipulative guarded secretive vindictive" },
    chat: { last_messages: [{ content: "Tell me the truth. Why did you plan revenge and threaten to punish him?" }] }
  };
  for (const file of ["say_something_horrible.js", "malice_aforethought.js", "the_quiet_part.js"]) {
    vm.runInNewContext(fs.readFileSync(file, "utf8"), { context, console });
  }
  const m = context.character.scenario.match(/\[DIALOGUE MODULE BUDGET: (\d+)\/360\]/);
  assert.ok(m);
  assert.ok(Number(m[1]) <= 360);
});
