"use worker";

/*
 * Stop Fucking Smirking v0.1
 * Anti-cliche prose variety for JanitorAI.
 * Reads recent prose, notices repeated mannerisms/phrasings, and injects a
 * compact reminder to vary them. It does not change character motives.
 */

context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";

const HISTORY_DEPTH = 7;
const MAX_TOKENS = 150;
const REPEAT_THRESHOLD = 2;
const DEBUG = false;

const CLICHES = [
  { id: "smirk", label: "smirking", re: /\bsmirk(?:s|ed|ing)?\b/gi, alternatives: "Use a different facial reaction, or no facial reaction at all." },
  { id: "chuckle", label: "dark/low chuckling", re: /\bchuckl(?:e|es|ed|ing)\b/gi, alternatives: "Vary vocal reactions; silence can be stronger than another chuckle." },
  { id: "lean", label: "leaning closer", re: /\blean(?:s|ed|ing)?\s+(?:in|closer|forward)\b/gi, alternatives: "Change distance, posture, movement, or keep the character still." },
  { id: "chin", label: "grabbing/lifting the chin", re: /\b(?:grab|grabs|grabbed|grabbing|grip|grips|gripped|lift|lifts|lifted|tilt|tilts|tilted)\b[^.!?\n]{0,45}\bchin\b/gi, alternatives: "Avoid repeating chin-touching as a dominance beat." },
  { id: "wall", label: "slamming/pinning someone against a wall", re: /\b(?:slam|slams|slammed|pin|pins|pinned|press|presses|pressed|shove|shoves|shoved)\b[^.!?\n]{0,55}\b(?:wall|door)\b/gi, alternatives: "Choose a different blocking or movement beat if conflict already exists." },
  { id: "growl", label: "growling words", re: /\b(?:growl|growls|growled|growling)\b/gi, alternatives: "Vary delivery through cadence, volume, pauses, or ordinary speech." },
  { id: "darkly", label: "doing things 'darkly'", re: /\bdarkly\b/gi, alternatives: "Show the tone through the scene instead of repeatedly naming it." },
  { id: "predator", label: "predator/prey comparisons", re: /\b(?:predator|prey|like a predator|like prey)\b/gi, alternatives: "Use fresher imagery grounded in the current setting." },
  { id: "eyes", label: "eyes darkening", re: /\beyes?\b[^.!?\n]{0,28}\b(?:darken|darkens|darkened|darkening)\b/gi, alternatives: "Use another observable reaction or leave the emotion implicit." },
  { id: "breath", label: "breath hitching", re: /\bbreath\b[^.!?\n]{0,24}\b(?:hitch|hitches|hitched|catches|caught)\b/gi, alternatives: "Vary physical reactions instead of recycling the same breath beat." },
];

function textOf(message) {
  if (!message) return "";
  if (typeof message === "string") return message;
  return String(message.message ?? message.content ?? message.text ?? "");
}

function recentText() {
  const messages = context?.chat?.last_messages;
  if (!Array.isArray(messages)) return "";
  // JanitorAI exposes last_messages newest-first; take the recent head.
  return messages.slice(0, HISTORY_DEPTH).map(textOf).filter(Boolean).join("\n");
}

function countMatches(text, re) {
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

function tokenEstimate(text) {
  return Math.ceil(text.length / 4);
}

const recent = recentText();
if (recent) {
  const repeated = CLICHES
    .map((entry) => ({ ...entry, count: countMatches(recent, entry.re) }))
    .filter((entry) => entry.count >= REPEAT_THRESHOLD)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  if (repeated.length) {
    const lines = ["[ANTI-CLICHE PROSE]", "Recent prose is repeating these beats. Preserve personality and intent, but vary the writing:"];
    for (const item of repeated) {
      const line = `- ${item.label} (${item.count}x): ${item.alternatives}`;
      if (tokenEstimate(lines.concat(line).join("\n")) <= MAX_TOKENS) lines.push(line);
    }
    lines.push("Do not force an alternative action. Sometimes the freshest choice is simply not repeating the mannerism.");
    context.character.scenario += "\n\n" + lines.join("\n");
    if (DEBUG) console.log("[STOP FUCKING SMIRKING]", repeated.map((x) => [x.id, x.count]));
  }
}
