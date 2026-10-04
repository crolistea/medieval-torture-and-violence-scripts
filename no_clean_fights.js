"use worker";

/*
 * No Clean Fights v0.1
 * Narrative consequence/continuity helper for already-active fictional conflict.
 * Keeps fatigue, mess, damaged surroundings/clothing, and established disruption
 * present without escalating violence or inventing new injuries.
 */

context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";

const HISTORY_DEPTH = 6;
const MAX_TOKENS = 180;
const MIN_ACTIVATION_SCORE = 3;
const DEBUG = false;

const SIGNALS = {
  conflict: /\b(?:fight|fighting|brawl|attack|attacked|struggle|struggling|grapple|shove|shoved|punch|punched|kick|kicked|weapon|blade|battle|combat|violence|violent)\b/i,
  fatigue: /\b(?:tired|exhausted|winded|panting|breathless|shaking|weary|fatigue|staggering)\b/i,
  mess: /\b(?:mud|dust|dirt|grime|rain|smoke|ash|blood|debris|glass|splinter|wreckage|spilled)\b/i,
  clothing: /\b(?:torn|ripped|stained|soaked|dirty|scuffed|clothes|shirt|coat|uniform|armor|armour)\b/i,
  damage: /\b(?:broken|cracked|smashed|shattered|damaged|dented|splintered|overturned|wrecked)\b/i,
  calm: /\b(?:calm down|stops? fighting|backs? away|steps? back|surrender|peace|truce|fight is over|conflict is over)\b/i,
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

let score = SIGNALS.conflict.test(latest) ? 4 : SIGNALS.conflict.test(all) ? 2 : 0;
if (SIGNALS.mess.test(all)) score += 1;
if (SIGNALS.damage.test(all)) score += 1;
if (SIGNALS.fatigue.test(all)) score += 1;
if (SIGNALS.calm.test(latest)) score -= 3;

if (score >= MIN_ACTIVATION_SCORE) {
  const observed = [];
  if (SIGNALS.fatigue.test(all)) observed.push("fatigue already established");
  if (SIGNALS.mess.test(all)) observed.push("mess/contamination already established");
  if (SIGNALS.clothing.test(all)) observed.push("clothing/equipment wear already established");
  if (SIGNALS.damage.test(all)) observed.push("environmental damage already established");

  const lines = [
    "[NO CLEAN FIGHTS]",
    "This scene already contains physical conflict. Keep consequences continuous instead of resetting everyone and everything between replies.",
    "- Preserve any fatigue, dirt, damaged clothing/equipment, displaced objects, broken surroundings, weather exposure, or other disruption that the story has already established.",
    "- Let an extended confrontation feel tiring and messy in broad narrative terms, but do not invent severe injuries merely to make it harsher.",
    "- The environment should remember what happened: established debris, damage, spills, smoke, mud, disorder, and lost objects remain relevant until the story resolves them.",
    "- Do not escalate because this note exists. If the conflict ends, carry the aftermath forward and let the scene become calm.",
  ];
  if (observed.length) lines.splice(2, 0, "- Current continuity signals: " + observed.join("; ") + ".");
  let output = lines.join("\n");
  if (Math.ceil(output.length / 4) > MAX_TOKENS) output = lines.slice(0, 5).join("\n");
  context.character.scenario += "\n\n" + output;
  if (DEBUG) console.log("[NO CLEAN FIGHTS]", { score, observed });
}
