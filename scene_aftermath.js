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

  // Smaller ceiling used when Bloodloss or No Clean Fights has already added
  // its own continuity note to this reply, so the three do not pile up.
  COMPACT_TOKENS: 100,

  // How much established evidence is needed before the note is added.
  MIN_ACTIVATION_SCORE: 3,

  // Breathlessness and shock pass on their own. If they were last mentioned
  // this many turns ago or more, they are no longer carried.
  FADE_AFTER: 6
};

const MARKER = "[SCENE AFTERMATH]";
const SIBLING_MARKERS = ["[BLOODLOSS CONTINUITY]", "[NO CLEAN FIGHTS]"];
const FADING_FAMILIES = ["weakness", "fatigue"];


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
    weight: 2,
    rx: /\b(?:wreck(?:ed|age)|debris|rubble|overturned|knocked over|toppled|broken glass|shards|splinters|blood (?:on|across|pooling on|pooled on) the (?:floor|wall|walls|ground|stairs|table|sheets)|bloodstains?|scorch marks?|in ruins|torn apart|trashed)\b/i
  }
};

const BODY_FAMILIES = ["wound", "bleeding", "bruising", "pain", "mobility", "weakness", "fatigue"];

// Things the story can narrate that change how far along recovery is.
const RECOVERY = {
  care: /\b(?:bandag\w+|stitch(?:es|ed)?|sutur\w+|splint(?:ed)?|dress(?:ed|ing) (?:the|his|her|their|my|your) (?:wound|wounds|cut|cuts|injur(?:y|ies))|cleaned (?:the|his|her|their|my|your) (?:wound|wounds|cut|cuts)|poultice|salve|ointment|treated|tended to|patched (?:up|him|her|them|me|you)|healer|medic|physician|doctor|nurse|infirmary|hospital)\b/i,
  rest: /\b(?:rest(?:s|ed|ing)?|slept|sleeps?|sleeping|asleep|lay down|lies down|lying down|sat down to recover|caught (?:his|her|their|my|your) breath|catch(?:es)? (?:his|her|their|my|your) breath)\b/i,
  hours: /\b(?:(?:an|one|two|three|a few|few|several|some) hours? (?:later|pass|passed|go by|went by)|hours later|later that (?:day|night|evening|afternoon)|by (?:nightfall|evening|dusk|midnight))\b/i,
  days: /\b(?:(?:the )?next (?:morning|day)|the following (?:morning|day)|by (?:morning|dawn)|(?:a|one|two|three|a few|few|several|some) days? (?:later|pass|passed|go by|went by)|days later|overnight)\b/i,
  long: /\b(?:(?:a|one|two|three|a few|few|several|some|many) (?:weeks?|months?|years?) (?:later|pass|passed|go by|went by)|(?:weeks|months|years) later)\b/i
};

// How serious the story said it was. Only ever read from the text.
const SEVERITY = {
  serious: /\b(?:serious(?:ly)?|severe(?:ly)?|grave(?:ly)?|badly|deep (?:wound|cut|gash)|stabbed|shot|impaled|broken (?:rib|ribs|arm|leg|wrist|ankle|nose)|fractur\w+|unconscious|passed out|collaps\w+|can(?:not|'t| not) (?:stand|walk|move)|can barely (?:stand|walk|move)|blood loss|lost (?:a lot of|so much|too much) blood)\b/i,
  minor: /\b(?:minor|shallow|small (?:cut|wound|bruise|scratch)|scratch(?:es|ed)?|scrape[sd]?|graz(?:e|ed|es)|just a (?:cut|bruise|scratch|scrape)|nothing serious|superficial)\b/i
};

// Explicit narration that a consequence is over. Each one clears a group of
// families, but only when it is newer than the last mention of that family.
const RESOLVED = {
  body: {
    families: BODY_FAMILIES,
    rx: /\b(?:fully (?:healed|recovered)|completely (?:healed|recovered)|healed completely|(?:wound|wounds|injury|injuries|cut|cuts|bruise|bruises) (?:is|are|has|have) (?:fully |completely |long )?(?:healed|gone|closed|faded)|magically healed|healing (?:spell|potion|magic) (?:closes|closed|mends|mended|restores|restored)|no longer (?:in pain|bleeding|limping|hurts?))\b/i
  },
  clothing: {
    families: ["clothing", "grime"],
    rx: /\b(?:chang(?:es|ed) (?:into|his|her|their|my|your) (?:\w+ )?(?:clothes|clothing|shirt|outfit)|fresh (?:clothes|clothing|shirt|tunic)|clean (?:clothes|clothing|shirt|tunic)|bath(?:es|ed)|washed (?:up|off|himself|herself|themselves|myself|yourself)|took a (?:bath|shower)|scrubbed (?:clean|off))\b/i
  },
  place: {
    families: ["objects", "surroundings"],
    rx: /\b(?:repair(?:s|ed)|mended|replaced the|swept up|cleaned up the|tid(?:y|ied|ies) (?:up )?the|put (?:the|everything) back|room is (?:clean|tidy|spotless) again|(?:left|leave|leaves|leaving) the (?:room|house|building|tavern|alley|camp|battlefield|scene)|(?:arriv(?:e|es|ed)|walk(?:s|ed)?) (?:at|into|in) (?:a|an|the) (?:new|different|other))\b/i
  }
};

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

const clearedAt = {};
for (const group of Object.values(RESOLVED)) {
  const at = newestIndex(group.rx);
  if (at === -1) continue;
  for (const id of group.families) clearedAt[id] = at;
}

const established = [];
let score = 0;

for (const id of Object.keys(SIGNALS)) {
  const family = SIGNALS[id];
  const at = newestIndex(family.rx);
  if (at === -1) continue;

  // Narrated as over, and not mentioned again since: let it go.
  if (clearedAt[id] !== undefined && clearedAt[id] <= at) continue;

  // Short-lived states that nobody has mentioned for a while have passed.
  if (FADING_FAMILIES.includes(id) && at >= CONFIG.FADE_AFTER) continue;

  established.push(id);
  score += family.weight;
}

const bodyEstablished = established.some(id => BODY_FAMILIES.includes(id));


/* ============================================================
   RECOVERY
   How far along things are, judged only from what was narrated:
   elapsed time, treatment, rest and stated severity.
   ============================================================ */

const windowText = turns.join("\n");

const recovery = {
  care: RECOVERY.care.test(windowText),
  rest: RECOVERY.rest.test(windowText),
  elapsed: RECOVERY.long.test(windowText) ? "long" : RECOVERY.days.test(windowText) ? "days" : RECOVERY.hours.test(windowText) ? "hours" : "none",
  severity: SEVERITY.serious.test(windowText) ? "serious" : SEVERITY.minor.test(windowText) ? "minor" : "unstated"
};

function recoveryLine(short) {
  let stage;

  if (recovery.elapsed === "long") {
    stage = "a long time has passed, so minor marks and tiredness are gone";
  } else if (recovery.elapsed === "days") {
    stage = "a day or more has passed, so exhaustion has eased while cuts and bruises are healing but visible";
  } else if (recovery.elapsed === "hours" || recovery.rest) {
    stage = "some rest or a few hours have passed, so breath and shaking settle first while wounds and soreness remain";
  } else {
    stage = "no rest or time skip has been narrated, so everything is still fresh";
  }

  if (recovery.care) stage += "; treated injuries are dressed and steadier, not gone";

  if (recovery.severity === "serious") {
    stage += ". It was established as serious: recovery is slow.";
  } else if (recovery.severity === "minor") {
    stage += ". It was established as minor: it can fade quickly.";
  } else {
    stage += ".";
  }

  if (short) return "- Recovery: " + stage;
  return "- Recovery: " + stage + " More healing needs time, treatment, rest or explicit narration.";
}


/* ============================================================
   OUTPUT
   The header, the list of what was established and the "do not
   invent" rule always go in. The other lines are added in order
   of importance while they still fit the budget.
   ============================================================ */

function buildNote(maxTokens) {
  const labels = established.map(id => SIGNALS[id].label);

  const head = MARKER;
  const rule = "- Carry forward only what the story established. Do not add new injuries, worsen existing ones, or start violence because of this note.";
  const stillTrue = () => "Already established and still true now: " + labels.join(", ") + ". These do not reset between replies.";

  // A very small budget keeps the most important families and drops the rest.
  while (labels.length > 1 && approximateTokens([head, stillTrue(), rule].join("\n")) > maxTokens) {
    labels.pop();
  }

  const lines = [head, stillTrue(), rule];
  if (approximateTokens(lines.join("\n")) > maxTokens) return "";

  // Each slot lists its wordings from longest to shortest; the first one that fits is used.
  const optional = bodyEstablished
    ? [
        ["- {{char}}'s personality decides how it shows (hidden, shrugged off, complained about, raged through), not whether it exists."],
        [recoveryLine(false), recoveryLine(true)]
      ]
    : [["- Damage, mess and dirt stay as they were left until someone in the story cleans, repairs or leaves them."]];

  for (const wordings of optional) {
    const line = wordings.find(text => approximateTokens(lines.concat(text).join("\n")) <= maxTokens);
    if (line) lines.splice(lines.length - 1, 0, line);
  }

  return lines.join("\n");
}

/*
 * Shared context budget. A marker such as [CONTEXT BUDGET: per_script=120] in
 * the scenario lowers the ceiling, the same way the other modules read it.
 */
function getBudget(fallback) {
  const match = scenarioBefore.match(/\[CONTEXT BUDGET:[^\]]*per_script=(\d+)/i);
  if (!match) return fallback;

  const external = parseInt(match[1], 10);
  if (!Number.isFinite(external)) return fallback;

  return Math.min(fallback, Math.max(80, external));
}

const scenarioBefore = String(context.character.scenario);
const alreadyAdded = scenarioBefore.includes(MARKER);
const siblingActive = SIBLING_MARKERS.some(marker => scenarioBefore.includes(marker));
const budget = getBudget(siblingActive ? CONFIG.COMPACT_TOKENS : CONFIG.MAX_TOKENS);

if (!alreadyAdded && score >= CONFIG.MIN_ACTIVATION_SCORE && established.length) {
  const output = buildNote(budget);

  // Only ever append. Nothing already in the scenario is touched.
  if (output) context.character.scenario += "\n\n" + output;

  if (CONFIG.DEBUG) {
    console.log(MARKER, { score, established, recovery, budget, tokens: approximateTokens(output) });
  }
} else if (CONFIG.DEBUG) {
  console.log(MARKER + " inactive", { score, established, alreadyAdded });
}
