"use worker";

/*
 * Malice Aforethought v0.1
 * Intentionality and motive continuity for fictional characters.
 * Encourages consequential actions to arise from established motives rather
 * than inventing a retroactive justification after a random generation.
 */

context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";
context.character.personality = context.character.personality || "";

const HISTORY_DEPTH = 8;
const MAX_TOKENS = 190;
const MIN_SCORE = 5;
const DEBUG = false;

function msg(m) {
  if (!m) return "";
  if (typeof m === "string") return m.toLowerCase();
  return String(m.message ?? m.content ?? m.text ?? "").toLowerCase();
}
function hits(text, terms) { return terms.reduce((n,t)=>n+(text.includes(t)?1:0),0); }

const card = [
  context.character.personality || "",
  context.character.description || "",
  context.character.scenario || "",
  context.character.first_message || ""
].join(" ").toLowerCase();

const messages = Array.isArray(context.chat.last_messages) ? context.chat.last_messages.slice(0,HISTORY_DEPTH) : [];
const latest = msg(context.chat.last_message) || msg(messages[0]);
const recent = messages.map(msg).filter(Boolean).join(" ");

const intentional = ["calculating","scheming","manipulative","strategic","patient","methodical","controlling","possessive","jealous","vindictive","sadistic","cruel","malicious","deceptive","ruthless"];
const motiveScene = ["revenge","jealous","betray","punish","humiliat","control","hurt","provoke","resent","hate","threat","secret","plan","trap","test","teach a lesson"];
const reluctant = ["gentle","kindhearted","pacifist","nonviolent","merciful","impulsive","accidental","careless"];

let score = hits(card,intentional)*3 + hits(latest,motiveScene)*2 + hits(recent,motiveScene);
score -= hits(card,reluctant)*2;

if (score >= MIN_SCORE) {
  const out = [
    "[MALICE AFORETHOUGHT — INTENT CONTINUITY]",
    "For this established character, consequential cruelty, betrayal, manipulation, humiliation, intimidation, or other harmful fictional choices may be deliberate when their existing motives and the current opportunity support them.",
    "- Prefer motive → intention → opportunity → action → consequence. Do not generate a major act randomly and later invent a convenient motive only because another character asks why it happened.",
    "- Before a consequential choice, ground the character's private intention in already-established personality, desires, resentments, relationships, stakes, or plans. The motive may remain implicit in the prose.",
    "- Preserve that motive afterward when later reactions or explanations depend on it. A character may lie about, conceal, partially reveal, or refuse to explain a motive if that behavior fits them.",
    "- Never manufacture sadism, jealousy, revenge, manipulation, or a cruel plan solely because this module is active. Ambiguous or accidental actions may remain accidental.",
    "- Keep any harmful conduct fictional and non-instructional; this module governs narrative intention, not real-world methods."
  ].join("\n");
  if (Math.ceil(out.length/4) <= MAX_TOKENS) context.character.scenario += "\n\n" + out;
  if (DEBUG) console.log("[MALICE AFORETHOUGHT]", {score});
}
