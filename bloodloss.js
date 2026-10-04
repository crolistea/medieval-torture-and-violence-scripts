"use worker";

/*
 * Bloodloss v0.1
 * Fictional injury-continuity helper. It is intentionally broad and
 * non-medical: it remembers established bleeding/injury state and encourages
 * plausible narrative continuity without diagnosis, treatment, thresholds,
 * anatomy targeting, or procedural harm instructions.
 */

context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";

const HISTORY_DEPTH = 8;
const MAX_TOKENS = 180;
const MIN_ACTIVATION_SCORE = 3;
const DEBUG = false;

const RX = {
  injury: /\b(?:injured|injury|wound|wounded|cut|cuts|bleeding|bled|bloodied|blood|bruise|bruised|burned|burnt|hurt|limping)\b/i,
  bleeding: /\b(?:bleeding|bled|blood(?:ied|y)?|bloodstain|blood-soaked)\b/i,
  weakness: /\b(?:weak|weakened|dizzy|unsteady|faint|fainted|shaking|exhausted|pale|limping|staggering)\b/i,
  care: /\b(?:bandage|bandaged|wrapped|treated|treatment|healer|doctor|medic|hospital|resting|rested|recovering|recovered)\b/i,
  resolved: /\b(?:healed|fully recovered|wound is gone|injury is gone|no longer bleeding)\b/i,
  conflict: /\b(?:fight|fighting|attack|attacked|battle|combat|struggle|violence|violent)\b/i,
};

function textOf(m) {
  if (!m) return "";
  if (typeof m === "string") return m;
  return String(m.message ?? m.content ?? m.text ?? "");
}

const messages = Array.isArray(context?.chat?.last_messages) ? context.chat.last_messages.slice(0, HISTORY_DEPTH) : [];
const texts = messages.map(textOf).filter(Boolean);
const latest = texts[0] || "";
const all = texts.join("\n");

let score = RX.injury.test(latest) ? 4 : RX.injury.test(all) ? 2 : 0;
if (RX.bleeding.test(all)) score += 2;
if (RX.weakness.test(all)) score += 1;
if (RX.resolved.test(latest)) score -= 4;

if (score >= MIN_ACTIVATION_SCORE) {
  const state = [];
  if (RX.bleeding.test(all)) state.push("bleeding/blood has been established");
  if (RX.weakness.test(all)) state.push("weakness or impaired movement has been established");
  if (RX.care.test(all)) state.push("care/recovery has been mentioned");
  if (RX.conflict.test(all)) state.push("the injury exists in an active/recent conflict");

  const lines = [
    "[BLOODLOSS CONTINUITY]",
    "An injury or bleeding state is already part of the fiction. Preserve continuity without turning this into a medical simulation.",
    "- Do not make established wounds, blood, weakness, damaged clothing, or impaired movement vanish between replies unless the story gives a reason.",
    "- Reflect worsening, stabilization, or recovery only from narrative evidence already present; do not invent precise blood volumes, vital signs, survival times, diagnoses, or medical thresholds.",
    "- Keep descriptions cinematic and character-focused. This module is not medical advice and should not provide procedural instructions for causing or treating injury.",
    "- Do not intensify harm simply because this module activated.",
  ];
  if (state.length) lines.splice(2, 0, "- Current signals: " + state.join("; ") + ".");
  let output = lines.join("\n");
  if (Math.ceil(output.length / 4) > MAX_TOKENS) output = lines.slice(0, 5).join("\n");
  context.character.scenario += "\n\n" + output;
  if (DEBUG) console.log("[BLOODLOSS]", { score, state });
}
