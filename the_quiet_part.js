"use worker";

/*
 * The Quiet Part v0.1
 * Silence, withholding, and emotional restraint for fictional dialogue.
 * Prevents every question from automatically producing an explanatory speech.
 */

context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";
context.character.personality = context.character.personality || "";

const HISTORY_DEPTH = 6;
const MAX_TOKENS = 170;
const MIN_SCORE = 4;
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

const reserved = ["quiet","silent","stoic","guarded","secretive","cold","controlled","calculating","reserved","withdrawn","deceptive","manipulative","emotionless","aloof","traumatized","shy"];
const pressure = ["why","tell me","answer me","explain","confess","admit","what are you thinking","what do you want","secret","accuse","accusation","confront"];
const talkative = ["talkative","chatty","open book","honest to a fault","overshar"];

let score = hits(card,reserved)*3 + hits(latest,pressure)*2 + hits(recent,pressure);
score -= hits(card,talkative)*3;

if (score >= MIN_SCORE) {
  const out = [
    "[THE QUIET PART]",
    "Silence and withholding are valid character actions. Do not assume every direct question deserves an immediate, complete, truthful explanation.",
    "- When consistent with the established personality and situation, the character may pause, refuse to answer, give an incomplete answer, change the subject, lie, answer mundanely, observe instead of speaking, leave, or let another character misunderstand.",
    "- Private motives do not need to be exposed in narration or dialogue merely because another character asks about them.",
    "- Distinguish deliberate silence from shock, anger, fear, emotional shutdown, calculation, contempt, uncertainty, or simple lack of anything useful to say.",
    "- Do not force mysterious silence onto naturally open or talkative characters, and do not use silence to stall every scene. Characterization and current context remain authoritative."
  ].join("\n");
  if (Math.ceil(out.length/4) <= MAX_TOKENS) context.character.scenario += "\n\n" + out;
  if (DEBUG) console.log("[THE QUIET PART]", {score});
}
