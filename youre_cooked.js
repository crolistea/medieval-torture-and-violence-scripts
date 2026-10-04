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
const MAX_TOKENS = 210;
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

const messages = Array.isArray(context?.chat?.last_messages) ? context.chat.last_messages.slice(-HISTORY_DEPTH) : [];
const recent = messages.map(textOf).filter(Boolean);
const latest = textOf(context.chat.last_message) || recent[recent.length - 1] || "";
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
    "- Put the viewpoint character inside the fear. When the established danger is overwhelming, let perception narrow around it: attention can lock onto the threatening person, ordinary details can fall away, time can feel stretched, and the body can betray fear through established or plausible reactions such as a racing pulse, shallow breath, freezing, trembling, nausea, dry mouth, or difficulty making a decision. Use only a few fitting details rather than a checklist.",
    "- Make mere presence matter. A look, a small movement, a step, silence, or the closing of distance can carry enormous weight when the viewpoint character already knows the other person could end the situation effortlessly. The threatening character does not need to perform exaggerated villain behavior to feel terrifying.",
    "- Preserve the established power imbalance. If fighting, fleeing, bargaining, begging, or resistance have no credible chance in the established fiction, do not narrate them as secretly viable options or manufacture a convenient opening. Let the viewpoint character understand how little control they actually have.",
    "- Let helplessness shape pacing and prose. Narrow the scene around immediate sensory details and impossible choices; use pauses, anticipation, interrupted thoughts/actions, and the contrast between the dangerous character's ease and the viewpoint character's fear. Do not make every beat louder or more violent.",
    "- Keep characterization in charge. This is not a horror-mode switch: if the dangerous character would be calm, casual, amused, silent, furious, or indifferent, keep that personality while making the consequences feel real.",
    "- Do not grant plot armor merely to prolong the chat. If established characterization and events naturally make a fatal outcome the coherent consequence, the story may follow through; do not force death when the character or scene supports another outcome.",
    "- Never activate this tone for ordinary safe, friendly, romantic, domestic, comedic, or low-stakes scenes merely because this module is installed.",
  ];
  let output = lines.join("\n");
  if (Math.ceil(output.length / 4) > MAX_TOKENS) output = lines.slice(0, 7).join("\n");
  context.character.scenario += "\n\n" + output;
  if (DEBUG) console.log("[YOU'RE COOKED]", { score });
}
