"use worker";

/*
 * You're Cooked v0.1
 * Situational dread and helplessness helper for fictional scenes where the
 * established character, power gap, and immediate danger genuinely support it.
 * It does not turn ordinary scenes into horror and does not force violence.
 */

context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";

const HISTORY_DEPTH = 8;
const MAX_TOKENS = 175;
const MIN_ACTIVATION_SCORE = 7;
const DEBUG = false;

const SIGNALS = {
  danger: /\b(?:danger|dangerous|threat|threaten|threatened|kill|killed|death|die|deadly|violent|violence|murder|assassin|execution|hostile|sadistic)\b/i,
  helpless: /\b(?:helpless|powerless|trapped|cornered|captured|kidnapped|restrained|bound|tied|cannot move|can't move|cannot escape|can't escape|no escape|nowhere to run|at .* mercy|outmatched|overpowered)\b/i,
  power: /\b(?:overwhelming|unstoppable|invincible|immortal|demon|monster|superhuman|powerful|stronger|far stronger|outclassed|godlike|queen|king)\b/i,
  failed: /\b(?:failed|failure|caught|discovered|woke|wakes|awakens|ambush failed|assassination failed|escape failed)\b/i,
  fear: /\b(?:afraid|fear|terrified|terror|dread|panic|scared|trembling|shaking)\b/i,
  safe: /\b(?:safe|friendly|kind|gentle|peaceful|playful|joking|relaxed|comfort|reassur|no danger|out of danger)\b/i,
};

function textOf(m) {
  if (!m) return "";
  if (typeof m === "string") return m;
  return String(m.message ?? m.content ?? m.text ?? "");
}

const messages = Array.isArray(context?.chat?.last_messages) ? context.chat.last_messages.slice(0, HISTORY_DEPTH) : [];
const recent = messages.map(textOf).filter(Boolean);
const latest = recent[0] || "";
const history = recent.join("\n");
const characterText = [
  context.character.name,
  context.character.personality,
  context.character.description,
  context.character.scenario,
].filter(Boolean).join("\n");

let score = 0;
if (SIGNALS.danger.test(latest)) score += 3;
else if (SIGNALS.danger.test(history)) score += 2;
if (SIGNALS.helpless.test(latest)) score += 4;
else if (SIGNALS.helpless.test(history)) score += 2;
if (SIGNALS.power.test(history) || SIGNALS.power.test(characterText)) score += 2;
if (SIGNALS.failed.test(latest)) score += 2;
if (SIGNALS.fear.test(history)) score += 1;
if (SIGNALS.danger.test(characterText)) score += 2;
if (SIGNALS.safe.test(latest)) score -= 5;

if (score >= MIN_ACTIVATION_SCORE && SIGNALS.danger.test(history + "\n" + characterText) && SIGNALS.helpless.test(history)) {
  const lines = [
    "[YOU'RE COOKED — SITUATIONAL DREAD]",
    "The established scene contains credible immediate danger plus a severe loss of control. Make the reader feel that reality instead of merely stating it.",
    "- Write physical space, silence, distance, interrupted motion, attention, and the character's presence so the danger feels immediate. Favor concrete sensory atmosphere over generic horror adjectives or stock creepy behavior.",
    "- Preserve the established power imbalance. Do not invent convenient competence, protection, rescue, leverage, escape routes, or sudden weakness just to keep the interaction comfortable or open-ended.",
    "- Let uncertainty and helplessness shape pacing: what the viewpoint character cannot safely do can matter as much as what happens. Do not make every beat louder or more violent.",
    "- Keep characterization in charge. This is not a horror-mode switch: if the dangerous character would be calm, casual, amused, silent, furious, or indifferent, keep that personality while making the consequences feel real.",
    "- Do not grant plot armor merely to prolong the chat. If established characterization and events naturally make a fatal outcome the coherent consequence, the story may follow through; do not force death when the character or scene supports another outcome.",
    "- Never activate this tone for ordinary safe, friendly, romantic, domestic, comedic, or low-stakes scenes merely because this module is installed.",
  ];
  let output = lines.join("\n");
  if (Math.ceil(output.length / 4) > MAX_TOKENS) output = lines.slice(0, 7).join("\n");
  context.character.scenario += "\n\n" + output;
  if (DEBUG) console.log("[YOU'RE COOKED]", { score });
}
