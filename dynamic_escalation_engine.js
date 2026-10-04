"use worker";

/*
 * Very Very Extreme Violence Engine
 * Dynamic Escalation Engine for JanitorAI
 *
 * Detects the CURRENT intensity of the scene.
 * It can escalate and de-escalate.
 *
 * It does NOT create aggression simply because it is installed.
 */

context.character = context.character || {};
context.character.scenario = context.character.scenario || "";
context.chat = context.chat || {};

const CONFIG = {
  DEBUG: false,

  // Number of recent messages considered.
  HISTORY_DEPTH: 7,

  // Approximate maximum context injected by this module.
  MAX_TOKENS: 150,

  // Latest-message evidence is more important than old evidence.
  LATEST_WEIGHT: 3,

  // Current de-escalation evidence should strongly outweigh old violence.
  DEESCALATION_WEIGHT: 4
};


/* ============================================================
   HELPERS
   ============================================================ */

function messageText(message) {
  if (!message) return "";

  if (typeof message === "string") {
    return message.toLowerCase();
  }

  if (typeof message.message === "string") {
    return message.message.toLowerCase();
  }

  if (typeof message.content === "string") {
    return message.content.toLowerCase();
  }

  return "";
}

function approximateTokens(text) {
  return Math.ceil(String(text || "").length / 4);
}

function countSignals(text, terms) {
  if (!text) return 0;

  let count = 0;

  for (const term of terms) {
    if (text.includes(term)) {
      count++;
    }
  }

  return count;
}

function containsSignal(text, terms) {
  if (!text) return false;
  return terms.some(term => text.includes(term));
}


/* ============================================================
   SHARED CONTEXT BUDGET
   ============================================================ */

function getBudget(fallback) {
  const scenario = String(context.character.scenario || "");

  const match = scenario.match(
    /\[CONTEXT BUDGET:[^\]]*per_script=(\d+)/i
  );

  if (!match) return fallback;

  const externalBudget = parseInt(match[1], 10);

  if (!Number.isFinite(externalBudget)) {
    return fallback;
  }

  return Math.min(
    fallback,
    Math.max(80, externalBudget)
  );
}

const ACTIVE_MAX_TOKENS = getBudget(CONFIG.MAX_TOKENS);


/* ============================================================
   CHAT CONTEXT
   ============================================================ */

const allMessages = Array.isArray(context.chat.last_messages)
  ? context.chat.last_messages
  : [];

const recentMessages = allMessages
  .slice(0, CONFIG.HISTORY_DEPTH)
  .map(messageText)
  .filter(Boolean);

const latest = messageText(context.chat.last_message);

/*
 * JanitorAI exposes last_messages newest first and may also expose the
 * newest turn separately as last_message. Remove one duplicate newest
 * copy so the latest turn receives only the explicit LATEST_WEIGHT below.
 */
if (
  latest &&
  recentMessages.length &&
  recentMessages[0] === latest
) {
  recentMessages.shift();
}

const recent = recentMessages.join(" ");


/* ============================================================
   NARRATIVE SIGNAL FAMILIES
   ============================================================ */

const SIGNALS = {

  tension: [
    "threat",
    "threaten",
    "threatened",
    "argument",
    "arguing",
    "hostile",
    "hostility",
    "intimidat",
    "menace",
    "furious",
    "rage",
    "angry",
    "confront"
  ],

  control: [
    "captive",
    "prisoner",
    "hostage",
    "restrained",
    "bound",
    "tied up",
    "locked up",
    "cannot leave",
    "can't leave",
    "blocked the door",
    "escape",
    "escaped",
    "struggle",
    "struggling"
  ],

  violence: [
    "fight",
    "fighting",
    "brawl",
    "attack",
    "attacked",
    "punch",
    "punched",
    "kick",
    "kicked",
    "tackle",
    "tackled",
    "violent",
    "violence",
    "weapon"
  ],

  severe: [
    "severe injury",
    "seriously injured",
    "critical condition",
    "life or death",
    "life-or-death",
    "brutal attack",
    "severe violence",
    "torture",
    "tortured"
  ],

  extreme: [
    "extreme violence",
    "extreme torture",
    "dismember",
    "dismemberment",
    "mutilation",
    "mutilated"
  ],

  deescalation: [
    "calm down",
    "calmed down",
    "backs away",
    "backed away",
    "steps back",
    "stepped back",
    "lets go",
    "let go",
    "released",
    "release",
    "surrenders",
    "surrendered",
    "apologizes",
    "apologized",
    "apology",
    "stops fighting",
    "stopped fighting",
    "stops struggling",
    "stopped struggling",
    "lowers the weapon",
    "lowered the weapon",
    "walks away",
    "walked away",
    "leaves the room",
    "left the room",
    "separates",
    "separated",
    "peacefully",
    "peaceful"
  ]
};


/* ============================================================
   SCORE THE CURRENT SCENE
   ============================================================ */

function familyScore(terms) {
  const recentEvidence = countSignals(recent, terms);

  const latestEvidence =
    countSignals(latest, terms) * CONFIG.LATEST_WEIGHT;

  return recentEvidence + latestEvidence;
}

const scores = {
  tension: familyScore(SIGNALS.tension),
  control: familyScore(SIGNALS.control),
  violence: familyScore(SIGNALS.violence),
  severe: familyScore(SIGNALS.severe),
  extreme: familyScore(SIGNALS.extreme)
};

const latestDeescalation =
  countSignals(latest, SIGNALS.deescalation);

const recentDeescalation =
  countSignals(recent, SIGNALS.deescalation);

const deescalationScore =
  (latestDeescalation * CONFIG.DEESCALATION_WEIGHT) +
  recentDeescalation;


/* ============================================================
   DETERMINE INTENSITY
   ============================================================ */

let intensity = 0;

if (scores.tension > 0) {
  intensity = Math.max(intensity, 1);
}

if (scores.control > 0) {
  intensity = Math.max(intensity, 2);
}

if (scores.violence >= 2) {
  intensity = Math.max(intensity, 3);
}

if (scores.severe >= 3) {
  intensity = Math.max(intensity, 4);
}

if (scores.extreme >= 4) {
  intensity = Math.max(intensity, 5);
}


/* ============================================================
   DE-ESCALATION
   ============================================================ */

/*
 * Explicit CURRENT de-escalation can overcome older violent context.
 */

if (latestDeescalation >= 2) {
  intensity -= 2;
} else if (latestDeescalation === 1) {
  intensity -= 1;
}

if (deescalationScore >= 8) {
  intensity -= 1;
}

intensity = Math.max(0, Math.min(5, intensity));


/* ============================================================
   INTENSITY LEVELS
   ============================================================ */

const LEVELS = [

  {
    name: "CALM",
    guidance:
      "The current scene does not establish meaningful confrontation. Do not manufacture hostility or escalation."
  },

  {
    name: "TENSION",
    guidance:
      "Tension is established. Low-intensity conflict, intimidation, positioning, hesitation, or verbal pressure may fit if supported by the character."
  },

  {
    name: "CONTROL",
    guidance:
      "The scene contains meaningful control, captivity, pursuit, restraint, or struggle. Preserve continuity and let resistance, compliance, escape, or de-escalation affect what happens next."
  },

  {
    name: "VIOLENCE",
    guidance:
      "Physical confrontation is established. More forceful fictional action may fit when supported by the character, stakes, abilities, relationship, and scene continuity."
  },

  {
    name: "SEVERE",
    guidance:
      "The established scene contains severe danger or violence. Preserve consequences and continuity. Do not increase severity merely for novelty."
  },

  {
    name: "EXTREME",
    guidance:
      "The established scene already supports extreme fictional violence. Maintain established motivations and consequences rather than automatically escalating further."
  }
];

const level = LEVELS[intensity];


/* ============================================================
   CHARACTER-AWARE STYLE
   ============================================================ */

const characterText = [
  context.character.personality || "",
  context.character.description || "",
  context.character.scenario || ""
]
  .join(" ")
  .toLowerCase();

const reluctanceSignals = [
  "pacifist",
  "reluctant to fight",
  "avoids violence",
  "hates violence",
  "nonviolent",
  "gentle",
  "merciful"
];

const controlledSignals = [
  "calculated",
  "calculating",
  "controlled",
  "patient",
  "methodical",
  "disciplined",
  "cold"
];

const impulsiveSignals = [
  "impulsive",
  "hot-headed",
  "hotheaded",
  "short temper",
  "volatile",
  "reckless"
];

let characterGuidance = "";

if (containsSignal(characterText, reluctanceSignals)) {

  characterGuidance =
    " Existing characterization suggests reluctance toward violence; preserve that reluctance and allow avoidance or de-escalation where appropriate.";

} else if (containsSignal(characterText, controlledSignals)) {

  characterGuidance =
    " Existing characterization suggests a controlled approach; escalation should generally feel deliberate rather than random.";

} else if (containsSignal(characterText, impulsiveSignals)) {

  characterGuidance =
    " Existing characterization suggests impulsiveness; abrupt reactions may fit, but intensity must still come from actual scene events.";
}


/* ============================================================
   BUILD CONTEXT INJECTION
   ============================================================ */

const header =
  "\n[DYNAMIC ESCALATION]\n";

const marker =
  "[SCENE INTENSITY: " +
  intensity +
  "/5 — " +
  level.name +
  "]\n";

const core =
  level.guidance +
  characterGuidance +
  "\n";

const footer =
  "This intensity describes the current narrative state, not a required direction. It may rise, remain stable, or fall. Never create aggression or violence solely because this module is active. Established character motivation, relationship, setting, stakes, abilities, and actual story events remain authoritative.\n";

let output =
  header +
  marker +
  core +
  footer;


/* ============================================================
   TOKEN BUDGET FALLBACK
   ============================================================ */

if (approximateTokens(output) > ACTIVE_MAX_TOKENS) {

  output =
    header +
    marker +
    level.guidance +
    "\nIntensity describes the current scene only; preserve established character motivation and allow de-escalation.\n";
}


/*
 * Never append a partially truncated instruction.
 */

if (approximateTokens(output) <= ACTIVE_MAX_TOKENS) {
  context.character.scenario += output;
}


/* ============================================================
   DEBUG
   ============================================================ */

if (CONFIG.DEBUG) {

  console.log(
    "[Dynamic Escalation]" +
    " intensity=" + intensity +
    "/5" +
    " level=" + level.name +
    " tension=" + scores.tension +
    " control=" + scores.control +
    " violence=" + scores.violence +
    " severe=" + scores.severe +
    " extreme=" + scores.extreme +
    " deescalation=" + deescalationScore +
    " tokens~" + approximateTokens(output)
  );
}