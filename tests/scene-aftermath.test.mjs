import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const MARKER = /\[SCENE AFTERMATH\]/;

/** Messages are newest-first, the way JanitorAI hands them to a script. */
function run(messages, { scenario = "", lastMessage, files = ["scene_aftermath.js"] } = {}) {
  const context = {
    character: { scenario, personality: "stoic and quiet" },
    chat: { last_messages: messages.map((content) => ({ content })), last_message: lastMessage },
  };
  for (const file of files) {
    vm.runInNewContext(fs.readFileSync(file, "utf8"), { context, console });
  }
  return context.character.scenario;
}

/** The part this module added, without whatever was in the scenario before. */
function note(out) {
  const at = out.indexOf("[SCENE AFTERMATH]");
  return at === -1 ? "" : out.slice(at);
}

const tokens = (text) => Math.ceil(text.length / 4);

test("established injury activates the module", () => {
  const out = run(["He is limping, and the wound in his side is still bleeding through his torn sleeve."]);
  assert.match(out, MARKER);
  assert.match(out, /wounds/);
  assert.match(out, /bleeding/);
  assert.match(out, /difficulty moving/);
});

test("peaceful chat adds nothing", () => {
  const out = run([
    "We drink tea and talk about books by the window.",
    "I cut the bread and she laughs, tired of the rain.",
    "The garden looks lovely this year.",
  ]);
  assert.equal(out, "");
});

test("empty or missing chat adds nothing and does not throw", () => {
  assert.equal(run([]), "");
  const context = {};
  vm.runInNewContext(fs.readFileSync("scene_aftermath.js", "utf8"), { context, console });
  assert.equal(context.character.scenario, "");
});

test("negated injuries are not treated as established", () => {
  const out = run(["Nobody was hurt. She is unharmed, not injured, and there is no blood anywhere."]);
  assert.doesNotMatch(out, MARKER);
});

test("an argument with no physical consequences stays silent", () => {
  const out = run(["I hate you! I will make you regret this, he shouts, furious, threatening revenge."]);
  assert.doesNotMatch(out, MARKER);
});

test("an older injury carries forward into a calm later turn", () => {
  const out = run([
    "She pours two cups of tea and asks about the harvest.",
    "They sit down at the kitchen table.",
    "He staggers in with a deep gash across his forearm, bruised and bleeding.",
  ]);
  assert.match(out, MARKER);
  assert.match(out, /wounds/);
  assert.match(out, /bruising/);
});

test("the note only names families the story established", () => {
  const out = note(run(["Her ankle is sprained and she is limping badly."]));
  assert.match(out, /wounds, difficulty moving/);
  assert.doesNotMatch(out, /bleeding|bruising|clothing|grime|damaged objects|surroundings/);
});

test("it tells the model not to invent or escalate", () => {
  const out = note(run(["He is limping, and the wound in his side is still bleeding."]));
  assert.match(out, /Do not add new injuries, worsen existing ones, or start violence/);
});

test("personality line is present when a body consequence is carried", () => {
  const out = note(run(["He is limping, and the wound in his side is still bleeding."]));
  assert.match(out, /personality decides how it shows/);
});

test("existing scenario text is kept untouched", () => {
  const scenario = "A quiet inn on the north road. {{char}} owns it.";
  const out = run(["He is limping, and the wound in his side is still bleeding."], { scenario });
  assert.ok(out.startsWith(scenario + "\n\n[SCENE AFTERMATH]"));
});

test("output stays inside the token budget", () => {
  const busy = [
    "The next morning the bandaged wound still aches. She was stabbed and badly bleeding, bruised, limping, pale and exhausted.",
    "Her torn shirt is covered in mud, the broken chair lies in the wreckage, blood on the floor.",
  ];
  assert.ok(tokens(note(run(busy))) <= 160);
  assert.match(run(busy), MARKER);
});

test("a context budget marker lowers the ceiling", () => {
  const scenario = "[CONTEXT BUDGET: per_script=80]";
  const out = note(run(["He is limping, his torn sleeve soaked, the wound in his side still bleeding."], { scenario }));
  assert.ok(out);
  assert.ok(tokens(out) <= 80);
});

test("it shrinks when bloodloss already added a note", () => {
  const messages = ["He is limping, his torn sleeve soaked, the wound in his side still bleeding."];
  const out = run(messages, { files: ["bloodloss.js", "scene_aftermath.js"] });
  assert.match(out, /\[BLOODLOSS CONTINUITY\]/);
  assert.ok(tokens(note(out)) <= 100);
});

test("running twice does not add the note twice", () => {
  const out = run(["He is limping, and the wound in his side is still bleeding."], {
    files: ["scene_aftermath.js", "scene_aftermath.js"],
  });
  assert.equal(out.match(/\[SCENE AFTERMATH\]/g).length, 1);
});

test("with nothing narrated, the injury is still fresh", () => {
  const out = note(run(["He is limping, and the wound in his side is still bleeding."]));
  assert.match(out, /no rest or time skip has been narrated/);
});

test("time, treatment and severity shape the recovery line", () => {
  const out = note(run([
    "The next morning she wakes, the bandaged wound in her side still aching.",
    "She was stabbed and is bleeding badly.",
  ]));
  assert.match(out, /a day or more has passed/);
  assert.match(out, /treated injuries are dressed and steadier, not gone/);
  assert.match(out, /established as serious/);
});

test("a minor injury is allowed to fade quickly", () => {
  const out = note(run(["It is just a scratch, a shallow cut on his arm that stings and is aching."]));
  assert.match(out, /established as minor/);
});

test("explicit full healing ends the body consequences", () => {
  const out = run([
    "The potion works: her wounds are fully healed.",
    "She was stabbed and bleeding badly, limping.",
  ]);
  assert.doesNotMatch(out, MARKER);
});

test("an injury mentioned again after healing counts again", () => {
  const out = run([
    "A new fight leaves him limping with a fresh cut across his cheek, bleeding.",
    "His wounds are fully healed.",
    "He was stabbed.",
  ]);
  assert.match(out, MARKER);
});

test("washing clears clothing and dirt but not the injury", () => {
  const out = note(run([
    "He washed up and put on fresh clothes, still limping.",
    "His torn shirt was covered in mud and his ankle was sprained.",
  ]));
  assert.match(out, /difficulty moving/);
  assert.doesNotMatch(out, /clothing|grime/);
});

test("old breathlessness fades on its own, old wounds do not", () => {
  const filler = Array.from({ length: 7 }, (_, i) => `They talk quietly about the road ahead, part ${i}.`);
  const tired = run([...filler, "She is panting, exhausted and shaking, completely drained."]);
  assert.doesNotMatch(tired, MARKER);

  const wounded = run([...filler, "She has a deep gash on her arm and it is bleeding."]);
  assert.match(wounded, MARKER);
});

test("evidence older than the history window is ignored", () => {
  const filler = Array.from({ length: 10 }, (_, i) => `A calm evening, part ${i}.`);
  const out = run([...filler, "He was stabbed, bleeding badly, limping."]);
  assert.doesNotMatch(out, MARKER);
});

test("damage to things alone gets the place line, not the body lines", () => {
  const out = note(run(["The broken chair lies in the wreckage, broken glass across the floor and debris everywhere."]));
  assert.match(out, /damaged objects/);
  assert.match(out, /disturbed surroundings/);
  assert.match(out, /stay as they were left/);
  assert.doesNotMatch(out, /Recovery:|personality/);
});

test("last_message is read when it is not in last_messages", () => {
  const out = run(["They sit by the fire."], { lastMessage: "My leg is bleeding and I am limping." });
  assert.match(out, MARKER);
});

test("it runs next to the other continuity and violence modules", () => {
  const files = [
    "no_clean_fights.js",
    "bloodloss.js",
    "dynamic_escalation_engine.js",
    "action_variety_engine.js",
    "scene_aftermath.js",
  ];
  const out = run(
    ["The fight left him limping, his coat torn and bloodied, a wound bleeding at his side, the table smashed."],
    { scenario: "Card text.", files },
  );
  assert.ok(out.startsWith("Card text."));
  assert.match(out, MARKER);
});

test("\"the rest of\" is not read as resting", () => {
  const out = note(run(["He limps after the rest of the group, the wound in his side still bleeding."]));
  assert.match(out, /no rest or time skip has been narrated/);
});
