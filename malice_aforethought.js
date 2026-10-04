"use worker";

/* Malice Aforethought v0.2 — motive and intentionality continuity. */
context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";
context.character.personality = context.character.personality || "";

const HISTORY_DEPTH = 8;
const MAX_TOKENS = 130;
const MIN_SCORE = 5;
const DEBUG = false;
const SHARED_BUDGET = 360;
const BUDGET_RE = /\n?\[DIALOGUE MODULE BUDGET: (\d+)\/360\]/;

function words(text) {
  return new Set((text.toLowerCase().match(/[a-z]+(?:-[a-z]+)?/g) || []));
}
function countWords(text, terms) {
  const set = words(text);
  return terms.reduce((n, term) => n + (set.has(term) ? 1 : 0), 0);
}
function countPhrases(text, phrases) {
  const lower = text.toLowerCase();
  return phrases.reduce((n, phrase) => n + (lower.includes(phrase) ? 1 : 0), 0);
}
function appendGuidance(out) {
  const tokens = Math.ceil(out.length / 4);
  if (tokens > MAX_TOKENS) return false;
  const match = context.character.scenario.match(BUDGET_RE);
  const used = match ? Number(match[1]) : 0;
  if (used + tokens > SHARED_BUDGET) return false;
  context.character.scenario = context.character.scenario.replace(BUDGET_RE, "");
  context.character.scenario += "\n\n" + out + "\n[DIALOGUE MODULE BUDGET: " + (used + tokens) + "/" + SHARED_BUDGET + "]";
  return true;
}

function msg(m) {
  if (!m) return "";
  if (typeof m === "string") return m.toLowerCase();
  return String(m.message ?? m.content ?? m.text ?? "").toLowerCase();
}
const card = [context.character.personality, context.character.description || "", context.character.scenario, context.character.first_message || ""].join(" ").toLowerCase();
const messages = Array.isArray(context.chat.last_messages) ? context.chat.last_messages.slice(-HISTORY_DEPTH) : [];
const latest = msg(context.chat.last_message) || msg(messages[0]);
const recent = messages.map(msg).filter(Boolean).join(" ");

const intentional = ["calculating","scheming","manipulative","strategic","methodical","controlling","possessive","jealous","vindictive","sadistic","cruel","malicious","deceptive","ruthless"];
const motives = ["revenge","jealous","betray","punish","humiliate","control","provoke","resent","secret","plan","trap"];
const motivePhrases = ["teach a lesson","make him jealous","make her jealous","make them jealous","get revenge","planned to","intended to"];
const reluctant = ["gentle","kindhearted","pacifist","nonviolent","merciful","accidental","careless"];

let score = countWords(card, intentional) * 3 + countWords(latest, motives) * 2 + countWords(recent, motives);
score += countPhrases(recent, motivePhrases) * 2;
score -= countWords(card, reluctant) * 2;

if (score >= MIN_SCORE) {
  const out = [
    "[MALICE AFORETHOUGHT — INTENT CONTINUITY]",
    "When this established character makes a consequential cruel, deceptive or manipulative fictional choice, let existing motives drive it.",
    "- Prefer motive → intention → opportunity → action → consequence; do not invent a convenient motive only after a random act.",
    "- Ground private intention in established desires, resentments, relationships, stakes or plans, and preserve it afterward.",
    "- The character may conceal, lie about, partially reveal or refuse to explain that motive when fitting.",
    "- Never manufacture cruelty or a plan solely because this module is active; ambiguous or accidental actions may remain so."
  ].join("\n");
  appendGuidance(out);
  if (DEBUG) console.log("[MALICE AFORETHOUGHT]", { score });
}
