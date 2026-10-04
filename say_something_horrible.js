"use worker";

/* Say Something Horrible v0.2 — contextual fictional dialogue intensity. */
context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";
context.character.personality = context.character.personality || "";

const HISTORY_DEPTH = 6;
const MAX_TOKENS = 125;
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
const card = [context.character.personality, context.character.description || "", context.character.scenario].join(" ").toLowerCase();
// JanitorAI exposes last_messages chronologically; take the recent tail.
const messages = Array.isArray(context.chat.last_messages) ? context.chat.last_messages.slice(-HISTORY_DEPTH) : [];
const latest = msg(context.chat.last_message) || msg(messages[messages.length - 1]);
const recent = messages.map(msg).filter(Boolean).join(" ");

const cruel = ["sadistic","cruel","vicious","brutal","ruthless","callous","malicious","vindictive","merciless","violent"];
const vulgar = ["vulgar","foul-mouthed","profane","crude","obscene","mouthy"];
const hostile = ["threat","threaten","hate","furious","rage","enemy","revenge","punish","hurt","fight","torture","kill","intimidate","humiliate"];
const hostilePhrases = ["make you suffer","teach you a lesson","you'll regret","you will regret"];
const gentle = ["gentle","kindhearted","kind-hearted","pacifist","nonviolent","soft-spoken","merciful"];

let score = countWords(card, cruel) * 3 + countWords(card, vulgar) * 2;
score += countWords(latest, hostile) * 2 + countWords(recent, hostile) + countPhrases(recent, hostilePhrases) * 2;
score -= countWords(card, gentle) * 4;

if (score >= MIN_SCORE) {
  const out = [
    "[DIALOGUE INTENSITY]",
    "The established character and current scene support harsher speech; preserve their actual personality and motive.",
    "- When natural, dialogue may be vicious, profane, cruel, morbid, humiliating, threatening, or disturbingly matter-of-fact instead of vague stock threats.",
    "- Horrific fictional imagery is allowed, but keep it narrative rather than instructional.",
    "- Do not maximize intensity every reply; understatement, ordinary speech or silence may fit better.",
    "- Never make a gentle or reluctant character cruel merely because this module is installed."
  ].join("\n");
  appendGuidance(out);
  if (DEBUG) console.log("[SAY SOMETHING HORRIBLE]", { score });
}
