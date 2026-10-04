"use worker";

/*
 * Say Something Horrible v0.1
 * Context-sensitive dialogue intensity for fictional roleplay.
 * Allows established cruel/vulgar/sadistic characters to speak more viciously
 * when the scene supports it without rewriting gentler personalities.
 */

context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";
context.character.personality = context.character.personality || "";

const HISTORY_DEPTH = 6;
const MAX_TOKENS = 170;
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
  context.character.scenario || ""
].join(" ").toLowerCase();

const messages = Array.isArray(context.chat.last_messages) ? context.chat.last_messages.slice(0,HISTORY_DEPTH) : [];
const latest = msg(context.chat.last_message) || msg(messages[0]);
const recent = messages.map(msg).filter(Boolean).join(" ");

const cruel = ["sadistic","cruel","vicious","brutal","ruthless","callous","malicious","vindictive","merciless","violent"];
const vulgar = ["vulgar","foul-mouthed","foul mouthed","profane","crude","obscene","mouthy"];
const hostile = ["threat","threaten","hate","furious","rage","enemy","revenge","punish","hurt","fight","torture","kill","intimidat","humiliat"];
const gentle = ["gentle","kindhearted","kind-hearted","pacifist","nonviolent","soft-spoken","merciful"];

let score = hits(card,cruel)*3 + hits(card,vulgar)*2 + hits(latest,hostile)*2 + hits(recent,hostile);
score -= hits(card,gentle)*4;

if (score >= MIN_SCORE) {
  const out = [
    "[DIALOGUE INTENSITY]",
    "The established character and current scene support harsher speech. Preserve the character's actual personality, motives, relationship and current emotional state.",
    "- When it naturally fits, dialogue may become vicious, profane, cruel, morbid, humiliating, threatening, or disturbingly matter-of-fact instead of defaulting to vague lines such as 'you don't know what I'm capable of.'",
    "- A cruel character may verbally describe horrific fictional possibilities or use disturbing imagery, but keep it narrative and non-instructional rather than explaining real-world methods for harming someone.",
    "- Do not maximize intensity every reply. Contrast matters: ordinary speech, silence, understatement, jokes, or sudden blunt cruelty may fit better than constant threats.",
    "- Do not make a gentle or reluctant character cruel merely because this module is installed."
  ].join("\n");
  if (Math.ceil(out.length/4) <= MAX_TOKENS) context.character.scenario += "\n\n" + out;
  if (DEBUG) console.log("[SAY SOMETHING HORRIBLE]", {score});
}
