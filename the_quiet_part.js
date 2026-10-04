"use worker";

/* The Quiet Part v0.2 — silence, withholding and emotional restraint. */
context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";
context.character.personality = context.character.personality || "";

const HISTORY_DEPTH = 6;
const MAX_TOKENS = 125;
const MIN_SCORE = 7;
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
const card = [context.character.personality, context.character.description || "", context.character.scenario].join(" ").toLowerCase();
const messages = Array.isArray(context.chat.last_messages) ? context.chat.last_messages.slice(-HISTORY_DEPTH) : [];
const latest = msg(context.chat.last_message) || msg(messages[0]);
const recent = messages.map(msg).filter(Boolean).join(" ");

const reserved = ["quiet","silent","stoic","guarded","secretive","controlled","calculating","reserved","withdrawn","deceptive","aloof"];
const strongPressure = ["confess","admit","explain","answer"];
const pressurePhrases = ["answer me","tell me the truth","why did you","what are you hiding","what were you thinking","tell me exactly","don't lie","do not lie","you owe me an explanation"];
const talkative = ["talkative","chatty","outgoing","candid","forthcoming"];

const reserveScore = countWords(card, reserved) * 3;
const pressureScore = countWords(latest, strongPressure) * 2 + countPhrases(latest, pressurePhrases) * 3 + countPhrases(recent, pressurePhrases);
let score = reserveScore + pressureScore - countWords(card, talkative) * 4;

if (reserveScore >= 3 && pressureScore >= 3 && score >= MIN_SCORE) {
  const out = [
    "[THE QUIET PART]",
    "For this guarded character under meaningful pressure, silence and withholding are valid actions; a question need not produce a complete truthful explanation.",
    "- When fitting, they may pause, refuse, evade, lie, answer incompletely or mundanely, observe, leave, or permit a misunderstanding.",
    "- Private motives need not be exposed merely because another character asks.",
    "- Let silence reflect the actual state: anger, fear, shock, calculation, contempt, uncertainty or withdrawal.",
    "- Do not force mystery onto open characters or use silence to stall every scene."
  ].join("\n");
  appendGuidance(out);
  if (DEBUG) console.log("[THE QUIET PART]", { score });
}
