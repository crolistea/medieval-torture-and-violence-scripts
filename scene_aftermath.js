"use worker";

/*
 * Scene Aftermath — JanitorAI
 * v0.1.0
 *
 * Consequence-continuity helper. When the recent story has ALREADY established
 * injuries, pain, exhaustion, ruined clothing or a wrecked room, it reminds the
 * model that those things are still true in the next reply.
 *
 * It never starts violence, never invents an injury and never worsens one.
 * A calm chat with nothing established gets no note at all.
 */

context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";

const CONFIG = {
  DEBUG: false,

  // Number of recent messages considered. Aftermath outlives the fight, so
  // this window is a little longer than the conflict modules use.
  HISTORY_DEPTH: 10,

  // Approximate maximum context injected by this module.
  MAX_TOKENS: 160,

  // How much established evidence is needed before the note is added.
  MIN_ACTIVATION_SCORE: 3
};


/* ============================================================
   SIGNALS
   Each family is something the story can establish. "body"
   families describe a person; the rest describe things.
   ============================================================ */

const SIGNALS = {
  wound: {
    label: "wounds",
    weight: 2,
    rx: /\b(?:wound(?:s|ed)?|gash(?:es|ed)?|lacerat\w+|stab(?:bed)? wound|injur(?:y|ies|ed)|(?:deep|shallow|fresh|bleeding|long|ragged) cuts?|cuts? (?:on|across|along|above|over|down) (?:his|her|their|my|your|the)|split lip|broken (?:nose|rib|ribs|arm|leg|wrist|finger|fingers|ankle)|fractur\w+|sprain\w*|burn(?:s|ed|t)? (?:on|across|along)|scald\w*)\b/i
  },
  bleeding: {
    label: "bleeding",
    weight: 2,
    rx: /\b(?:bleed(?:s|ing)?|bled|blood loss|losing blood|lost (?:a lot of |so much |too much )?blood|blood (?:runs|ran|drips|dripped|dripping|seeps|seeped|seeping|soaks|soaked|soaking|trickles|trickled|trickling))\b/i
  },
  bruising: {
    label: "bruising",
    weight: 2,
    rx: /\b(?:bruis(?:e|es|ed|ing)|black eye|swollen|swelling|welts?)\b/i
  },
  pain: {
    label: "pain",
    weight: 2,
    rx: /\b(?:in pain|pain (?:in|shoots|shot|flares|flared|throbs)|painful|aching|aches|throbbing|throbs|sore|winc(?:e|es|ed|ing)|agony|hurts to (?:move|breathe|walk|stand|talk))\b/i
  },
  mobility: {
    label: "difficulty moving",
    weight: 2,
    rx: /\b(?:limp(?:s|ed|ing)?|hobbl\w+|can(?:not|'t| not) (?:stand|walk|move|lift|grip)|can barely (?:stand|walk|move|lift|grip)|favou?r(?:s|ed|ing)? (?:his|her|their|my|your|the) (?:leg|arm|side|ankle|shoulder|knee)|leans? on|leaning on|drag(?:s|ged|ging)? (?:his|her|their|my|your|the) (?:leg|foot))\b/i
  },
  weakness: {
    label: "weakness or shock",
    weight: 1,
    rx: /\b(?:weak(?:ened|ness)?|dizzy|dizziness|light-?headed|faint(?:s|ed|ing)?|unsteady|trembl\w+|shaking|shaky|shivering|pale|ashen|clammy|in shock|numb|dazed|nause\w+)\b/i
  },
  fatigue: {
    label: "exhaustion",
    weight: 1,
    rx: /\b(?:exhaust(?:ed|ion)|worn out|spent|drained|winded|out of breath|breathless|panting|gasping|fatigue[d]?|weary|can barely keep (?:his|her|their|my|your) eyes open)\b/i
  },
  clothing: {
    label: "damaged or bloody clothing",
    weight: 1,
    rx: /\b(?:(?:torn|ripped|shredded|tattered|blood-?(?:stained|soaked|ied)|bloody|bloodied|ruined|singed|scorched) (?:\w+ )?(?:shirt|sleeve|sleeves|coat|cloak|tunic|dress|trousers|pants|jacket|uniform|collar|clothes|clothing|armou?r|glove|gloves|boot|boots)|(?:shirt|sleeve|sleeves|coat|cloak|tunic|dress|trousers|pants|jacket|uniform|collar|clothes|clothing|armou?r) (?:is|are|was|were|hangs?|hung) (?:\w+ )?(?:torn|ripped|shredded|tattered|bloody|bloodied|ruined|soaked))\b/i
  },
  grime: {
    label: "dirt and grime",
    weight: 1,
    rx: /\b(?:covered in (?:mud|dirt|dust|soot|ash|blood|grime|filth)|caked (?:in|with) (?:mud|dirt|dust|blood|grime)|filthy|grimy|mud-?(?:caked|spattered|stained)|soot-?(?:stained|streaked)|blood-?spattered|dried blood|smeared with)\b/i
  },
  objects: {
    label: "damaged objects",
    weight: 1,
    rx: /\b(?:(?:broken|cracked|shattered|smashed|splintered|dented|bent|snapped) (?:\w+ )?(?:sword|blade|shield|chair|table|door|window|glass|mirror|lamp|bottle|cup|vase|staff|bow|helmet|lock|phone|shelf|shelves|railing|cart)|(?:sword|blade|shield|chair|table|door|window|mirror|lamp|vase|staff|bow|helmet|lock|phone|railing) (?:is|was|lies|lay) (?:\w+ )?(?:broken|cracked|shattered|smashed|splintered|dented|bent|snapped))\b/i
  },
  surroundings: {
    label: "disturbed surroundings",
    weight: 1,
    rx: /\b(?:wreck(?:ed|age)|debris|rubble|overturned|knocked over|toppled|broken glass|shards|splinters|blood (?:on|across|pooling on|pooled on) the (?:floor|wall|walls|ground|stairs|table|sheets)|bloodstains?|scorch marks?|in ruins|torn apart|trashed)\b/i
  }
};

const BODY_FAMILIES = ["wound", "bleeding", "bruising", "pain", "mobility", "weakness", "fatigue"];

// Phrases that say the opposite of a signal. They are blanked out before
// matching so "nobody was injured" cannot establish an injury.
const NEGATIONS = /\b(?:un(?:harmed|hurt|injured|scathed|wounded)|(?:not|never|isn't|aren't|wasn't|weren't|no one (?:is|was)|nobody (?:is|was)) (?:\w+ )?(?:hurt|injured|wounded|bleeding|bruised|in pain|tired|exhausted|limping)|no (?:injur(?:y|ies)|wounds?|blood|bruises?|pain|damage)|without (?:a|any) (?:scratch|wound|injury|bruise)|pain(?:less|-free)|good as new)\b/gi;


/* ============================================================
   HELPERS
   ============================================================ */

function messageText(message) {
  if (!message) return "";
  if (typeof message === "string") return message;
  return String(message.message ?? message.content ?? message.text ?? "");
}

function approximateTokens(text) {
  return Math.ceil(String(text || "").length / 4);
}

function clean(text) {
  return text.replace(NEGATIONS, " ");
}


/* ============================================================
   CHAT CONTEXT
   JanitorAI exposes last_messages newest-first. Index 0 is the
   newest turn, so a smaller index always means "more recent".
   ============================================================ */

const recentMessages = (Array.isArray(context.chat.last_messages) ? context.chat.last_messages : [])
  .slice(0, CONFIG.HISTORY_DEPTH)
  .map(messageText)
  .filter(Boolean);

const latest = messageText(context.chat.last_message);
if (latest && recentMessages[0] !== latest) recentMessages.unshift(latest);

const turns = recentMessages.slice(0, CONFIG.HISTORY_DEPTH).map(clean);

/** Index of the newest turn that matches, or -1. */
function newestIndex(rx) {
  for (let i = 0; i < turns.length; i++) {
    if (rx.test(turns[i])) return i;
  }
  return -1;
}


/* ============================================================
   WHAT HAS BEEN ESTABLISHED
   ============================================================ */

const established = [];
let score = 0;

for (const id of Object.keys(SIGNALS)) {
  const family = SIGNALS[id];
  const at = newestIndex(family.rx);
  if (at === -1) continue;
  established.push(id);
  score += family.weight;
}

const bodyEstablished = established.some(id => BODY_FAMILIES.includes(id));


/* ============================================================
   OUTPUT
   ============================================================ */

if (score >= CONFIG.MIN_ACTIVATION_SCORE && established.length) {
  const carried = established.map(id => SIGNALS[id].label).join(", ");

  const lines = [
    "[SCENE AFTERMATH]",
    "The story has already established consequences that are still true now: " + carried + ".",
    "- Keep them present in the next reply. They do not reset between messages.",
    "- Carry forward only what the story established. Do not add new injuries, worsen existing ones, or start violence because of this note."
  ];

  if (bodyEstablished) {
    lines.push("- {{char}}'s personality decides how it shows (hidden, shrugged off, complained about, raged through), not whether it exists.");
  }

  const output = lines.join("\n");

  if (approximateTokens(output) <= CONFIG.MAX_TOKENS) {
    context.character.scenario += "\n\n" + output;
  }

  if (CONFIG.DEBUG) {
    console.log("[SCENE AFTERMATH]", { score, established, tokens: approximateTokens(output) });
  }
} else if (CONFIG.DEBUG) {
  console.log("[SCENE AFTERMATH] inactive", { score, established });
}
