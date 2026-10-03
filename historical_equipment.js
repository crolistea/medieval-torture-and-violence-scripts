"use worker";

/*
 * Historical Punishment & Torture Equipment — Universal JanitorAI Module
 * v0.3.0
 *
 * Goal: give any compatible character broad, context-sensitive knowledge of
 * historical / historically-inspired equipment without changing their personality.
 * The catalogue is large; only a small ranked shortlist is injected per generation.
 *
 * This is narrative lore, not a real-world procedural guide.
 */

context.character = context.character || {};
context.chat = context.chat || {};
context.character.personality = context.character.personality || "";
context.character.scenario = context.character.scenario || "";
context.character.example_dialogs = context.character.example_dialogs || "";

const CONFIG = {
  DEBUG: false,
  HISTORY_DEPTH: 6,
  MAX_INJECTED: 4,
  MAX_TOKENS: 220,
  FULL_SCORE: 14,
  SUMMARY_SCORE: 8,
  MIN_ACTIVATION_SCORE: 4,
  DIRECT_NAME_BONUS: 14,
  LATEST_MESSAGE_BONUS: 5,
  CONTINUITY_BONUS: 4,
  CATEGORY_MATCH_BONUS: 2,
  SETTING_MATCH_BONUS: 2,
  ACCESS_REQUIRED_FOR_LARGE: true,
  PROACTIVE_THRESHOLD: 7
};

const CATALOGUE = [
  {id:"rack",name:"The Rack",era:"ancient–early modern",status:"documented",cats:["stretching","restraint","stationary","large"],settings:["dungeon","basement","chamber","prison"],aliases:["rack","torture rack","duke of exeter's daughter"],visual:"a long framed apparatus with rollers, ropes or restraints at opposite ends",summary:"large stationary restraint apparatus associated with historical torture and coercion"},
  {id:"scavengers_daughter",name:"Scavenger's Daughter",era:"16th–17th c.",status:"documented",cats:["compression","restraint","stationary","large"],settings:["dungeon","basement","chamber","prison"],aliases:["scavenger's daughter","scavengers daughter","skevington's gyves"],visual:"a hinged iron frame that folds the restrained body into a compressed posture",summary:"rare Tudor-era iron compression and restraint apparatus"},
  {id:"thumbscrew",name:"Thumbscrew / Thumbkin",era:"early modern",status:"documented",cats:["vise","compact","portable","hands"],settings:["table","chamber","basement","prison"],aliases:["thumbscrew","thumb screw","thumbkin","thumbikens","pilliwinks"],visual:"a small metal screw-vise associated with the hands and fingers",summary:"compact historical screw-vise torture implement"},
  {id:"stocks",name:"Stocks",era:"medieval–modern",status:"documented",cats:["restraint","display","humiliation","stationary"],settings:["courtyard","cell","basement","dungeon","hall"],aliases:["stocks","the stocks"],visual:"a heavy hinged board or frame with openings used to immobilize limbs",summary:"historical restraint used for confinement, punishment and public humiliation"},
  {id:"pillory",name:"Pillory",era:"medieval–19th c.",status:"documented",cats:["restraint","display","humiliation","stationary"],settings:["courtyard","hall","dungeon","basement"],aliases:["pillory"],visual:"an upright wooden or metal frame securing the head and hands",summary:"standing restraint strongly associated with public punishment and humiliation"},
  {id:"shrews_fiddle",name:"Shrew's Fiddle",era:"early modern",status:"documented",cats:["restraint","humiliation","portable","hands"],settings:["cell","hall","basement","dungeon"],aliases:["shrew's fiddle","shrews fiddle","neck violin"],visual:"a violin-shaped hinged board restraining neck and wrists together",summary:"historical restraint and humiliation device"},
  {id:"scolds_bridle",name:"Scold's Bridle",era:"16th–19th c.",status:"documented",cats:["restraint","humiliation","head","portable"],settings:["cell","hall","basement","dungeon"],aliases:["scold's bridle","scolds bridle","brank","branks"],visual:"an iron head-cage or bridle associated with punishment and humiliation",summary:"historical head restraint used as punitive humiliation"},
  {id:"iron_gag",name:"Iron Gag",era:"early modern",status:"documented/variant",cats:["restraint","head","portable"],settings:["cell","chamber","basement"],aliases:["iron gag","gag bridle"],visual:"a severe historical metal gag or bridle-like restraint",summary:"historical restraint associated with enforced silence and punishment"},
  {id:"manacles",name:"Iron Manacles",era:"ancient–modern",status:"documented",cats:["restraint","portable","hands"],settings:["any"],aliases:["manacles","iron cuffs","shackles","fetters"],visual:"heavy forged restraints, rings and short lengths of chain",summary:"period-appropriate forged restraints for wrists or limbs"},
  {id:"leg_irons",name:"Leg Irons / Fetters",era:"ancient–modern",status:"documented",cats:["restraint","portable","legs"],settings:["any"],aliases:["leg irons","fetters","ankle shackles"],visual:"heavy ankle restraints linked by chain or bar",summary:"historical restraints limiting movement"},
  {id:"prisoner_chain",name:"Wall Chains and Restraint Rings",era:"medieval–modern",status:"documented/general",cats:["restraint","stationary","chain"],settings:["cell","dungeon","basement","chamber"],aliases:["wall chains","restraint rings","iron rings","wall shackles"],visual:"forged rings, chains and anchor points fixed into masonry or heavy timber",summary:"architectural restraints appropriate to prisons, dungeons and purpose-built rooms"},
  {id:"cage",name:"Iron Prison Cage",era:"medieval–modern",status:"documented/general",cats:["confinement","display","large","stationary"],settings:["dungeon","basement","courtyard","hall"],aliases:["iron cage","prison cage","hanging cage","gibbet cage"],visual:"a human-sized barred iron cage, sometimes freestanding or suspended",summary:"confinement and display apparatus with a stark historical aesthetic"},
  {id:"gibbet",name:"Gibbet / Gibbet Cage",era:"medieval–19th c.",status:"documented",cats:["display","confinement","suspension","large"],settings:["outdoor","courtyard","dungeon"],aliases:["gibbet","gibbet cage","hanging cage"],visual:"an iron framework or cage intended for grim public display",summary:"historical punishment/display structure"},
  {id:"breaking_wheel",name:"Breaking Wheel",era:"antiquity–early modern",status:"documented",cats:["execution","display","large","stationary"],settings:["courtyard","chamber","dungeon"],aliases:["breaking wheel","catherine wheel","execution wheel"],visual:"a large heavy spoked wheel associated with judicial punishment and execution",summary:"large historical punishment/execution apparatus"},
  {id:"strappado",name:"Strappado Apparatus",era:"medieval–early modern",status:"documented",cats:["suspension","restraint","overhead"],settings:["dungeon","basement","chamber","prison"],aliases:["strappado","corda"],visual:"an overhead rope-and-pulley restraint arrangement used in historical torture",summary:"historical suspension-based restraint/torture setup"},
  {id:"judas_cradle",name:"Judas Cradle",era:"claimed early modern",status:"disputed",cats:["display","stationary","large"],settings:["dungeon","basement","chamber"],aliases:["judas cradle","judas chair"],visual:"a pointed pedestal-like apparatus commonly displayed in modern torture museums",summary:"famously attributed torture apparatus whose historical provenance is disputed"},
  {id:"iron_maiden",name:"Iron Maiden",era:"19th c. construction",status:"legendary/misattributed",cats:["confinement","display","large","stationary"],settings:["dungeon","basement","gallery","chamber"],aliases:["iron maiden","iron virgin","virgin of nuremberg"],visual:"a human-sized upright iron cabinet associated with sensationalized 'medieval' imagery",summary:"iconic but historically misattributed torture-museum object; useful as a modern replica or collector's piece"},
  {id:"pear",name:"Pear of Anguish",era:"uncertain/early modern objects",status:"disputed",cats:["compact","display","portable"],settings:["collection","chamber","basement"],aliases:["pear of anguish","choke pear"],visual:"a small segmented metal pear-shaped object commonly labeled as a torture instrument",summary:"museum-famous object with disputed torture provenance"},
  {id:"spanish_boot",name:"The Boot / Spanish Boot",era:"early modern",status:"documented family",cats:["vise","compression","legs","stationary"],settings:["dungeon","basement","chamber","prison"],aliases:["spanish boot","the boot","boots","boot torture"],visual:"a rigid leg-enclosing or clamping apparatus associated with historical judicial torture",summary:"family of historical compression devices associated with the lower leg"},
  {id:"shin_vise",name:"Shin Vise / Leg Crusher",era:"early modern",status:"historical variant",cats:["vise","compression","legs","stationary"],settings:["dungeon","basement","chamber"],aliases:["shin vise","shin crusher","leg crusher"],visual:"paired rigid plates or jaws forming a heavy leg vise",summary:"historically inspired leg-compression apparatus"},
  {id:"finger_pillory",name:"Finger Pillory",era:"early modern",status:"documented variants",cats:["restraint","compact","hands"],settings:["table","cell","chamber"],aliases:["finger pillory","finger stocks"],visual:"a small hinged board or clamp with narrow openings for the fingers",summary:"small restraint associated with punishment of the hands"},
  {id:"neck_stock",name:"Neck Stock / Yoke",era:"medieval–modern",status:"documented variants",cats:["restraint","humiliation","portable"],settings:["cell","hall","courtyard","basement"],aliases:["neck stock","punishment yoke","wooden yoke"],visual:"a heavy wooden restraint carried around the neck and sometimes the wrists",summary:"portable historical restraint used for punishment and humiliation"},
  {id:"wooden_horse",name:"Wooden Horse",era:"early modern",status:"documented variants",cats:["restraint","display","large","stationary"],settings:["yard","chamber","basement","dungeon"],aliases:["wooden horse","spanish donkey","chevalet"],visual:"a narrow raised wooden structure associated with historical military and judicial punishment",summary:"historical punishment apparatus appearing in several regional forms"},
  {id:"torture_chair",name:"Restraint / Torture Chair",era:"early modern–modern replicas",status:"documented concept; many museum variants",cats:["chair","restraint","stationary","large"],settings:["chamber","basement","dungeon"],aliases:["torture chair","restraint chair","interrogation chair","iron chair"],visual:"a heavy chair fitted with numerous straps, rings or iron restraints",summary:"specialized chair-form restraint; exact historical designs vary widely"},
  {id:"iron_chair",name:"Iron Chair",era:"museum/early-modern attributed",status:"mixed provenance",cats:["chair","restraint","display","large"],settings:["chamber","basement","dungeon","gallery"],aliases:["iron chair","witch chair","inquisition chair"],visual:"an imposing metal chair associated with torture-museum collections",summary:"historically attributed or reconstructed punitive chair; provenance varies by specimen"},
  {id:"ducking_stool",name:"Ducking Stool",era:"medieval–early modern",status:"documented",cats:["humiliation","water","large","outdoor"],settings:["outdoor","water","courtyard"],aliases:["ducking stool","cucking stool"],visual:"a chair mounted to a long beam or mechanical frame near water",summary:"documented public punishment apparatus associated with humiliation and ducking"},
  {id:"pillory_cage",name:"Punishment Cage",era:"medieval–early modern",status:"documented variants",cats:["confinement","humiliation","display","large"],settings:["courtyard","hall","dungeon","basement"],aliases:["punishment cage","shame cage"],visual:"a cramped barred or lattice enclosure intended for confinement and display",summary:"historical-style confinement and humiliation cage"},
  {id:"drunkards_cloak",name:"Drunkard's Cloak",era:"17th c.",status:"documented punishment",cats:["humiliation","wearable","display"],settings:["hall","courtyard","collection"],aliases:["drunkard's cloak","newcastle cloak","barrel pillory"],visual:"a barrel-like wearable punishment device with openings for the head and limbs",summary:"historical humiliation punishment associated especially with drunkenness"},
  {id:"mask_of_shame",name:"Mask of Shame",era:"early modern",status:"documented objects; uses vary",cats:["humiliation","head","wearable"],settings:["hall","courtyard","basement","collection"],aliases:["mask of shame","shame mask","schandmaske"],visual:"an elaborate metal mask, sometimes grotesquely shaped, used as punitive display",summary:"early-modern humiliation object; exact use and provenance vary"},
  {id:"pranger",name:"Pranger / Shame Post",era:"medieval–early modern",status:"documented",cats:["restraint","display","humiliation","stationary"],settings:["courtyard","hall"],aliases:["pranger","shame post","punishment post"],visual:"a fixed public post or framework used to restrain and expose a punished person",summary:"public restraint and humiliation fixture"},
  {id:"whipping_post",name:"Whipping Post",era:"medieval–modern",status:"documented",cats:["restraint","display","stationary"],settings:["courtyard","cell","basement","dungeon"],aliases:["whipping post","punishment post"],visual:"a stout post fitted with restraints or rings",summary:"historical punishment fixture used to immobilize a prisoner"},
  {id:"flogging_bench",name:"Punishment Bench",era:"historical variants",status:"documented/general",cats:["restraint","bench","stationary"],settings:["cell","chamber","basement","dungeon"],aliases:["flogging bench","punishment bench","restraint bench"],visual:"a heavy low bench with straps or iron restraint points",summary:"historical-style restraint furniture used in punitive settings"},
  {id:"treadwheel",name:"Prison Treadwheel",era:"19th c.",status:"documented",cats:["labor","punishment","large","stationary"],settings:["prison","yard","large room"],aliases:["prison treadwheel","treadmill punishment","penal treadmill"],visual:"a large stepped wheel or treadmill operated by prisoners",summary:"later historical penal-labor machine rather than a medieval device"},
  {id:"crank_machine",name:"Prison Crank",era:"19th c.",status:"documented",cats:["labor","punishment","stationary"],settings:["prison","cell","collection"],aliases:["prison crank","crank machine"],visual:"a resistance crank installed as deliberately monotonous penal labor",summary:"Victorian penal-labor punishment device"},
  {id:"restraint_cross",name:"Restraint Cross / X-Frame",era:"historical-inspired",status:"generic/reconstruction",cats:["restraint","frame","large","stationary"],settings:["chamber","basement","dungeon"],aliases:["restraint cross","x-frame","x frame","st andrew's cross"],visual:"a large cross-shaped or X-shaped frame fitted with restraint points",summary:"historically inspired restraint frame; exact designs and claimed provenance vary"},
  {id:"upright_frame",name:"Upright Restraint Frame",era:"historical-inspired",status:"generic/reconstruction",cats:["restraint","frame","large","stationary"],settings:["chamber","basement","dungeon"],aliases:["upright restraint frame","restraint frame","standing frame"],visual:"a rigid vertical timber or iron framework with multiple restraint points",summary:"generic period-styled restraint apparatus useful where a specific named device is unnecessary"},
  {id:"restraint_table",name:"Heavy Restraint Table",era:"historical-inspired",status:"generic/reconstruction",cats:["restraint","table","large","stationary"],settings:["chamber","basement","dungeon"],aliases:["restraint table","torture table"],visual:"a heavy timber table fitted with straps, rings and attachment points",summary:"generic historical-style restraint furniture, not a single standardized historical device"},
  {id:"collar_chain",name:"Iron Collar and Chain",era:"ancient–modern",status:"documented/general",cats:["restraint","neck","chain","portable"],settings:["any"],aliases:["iron collar","prisoner collar","chain collar"],visual:"a forged neck collar connected to a chain, wall ring or other restraint",summary:"period-appropriate prisoner restraint appearing in many historical settings"},
  {id:"bilboes",name:"Bilboes",era:"16th–19th c.",status:"documented",cats:["restraint","legs","bar","portable"],settings:["ship","cell","basement","dungeon"],aliases:["bilboes","bilbo"],visual:"a long iron bar with sliding shackles used to secure the ankles",summary:"historical bar-and-shackle restraint used aboard ships and in prisons"},
  {id:"hand_pillory",name:"Hand Stocks / Hand Pillory",era:"medieval–early modern",status:"documented variants",cats:["restraint","hands","portable"],settings:["cell","hall","basement"],aliases:["hand stocks","hand pillory"],visual:"a compact wooden restraint securing both wrists",summary:"portable or bench-mounted historical hand restraint"},
  {id:"chain_gang_bar",name:"Prisoner Restraint Bar",era:"historical",status:"documented variants",cats:["restraint","group","bar"],settings:["prison","yard","cell"],aliases:["restraint bar","prisoner bar","chain gang bar"],visual:"a rigid bar or linked chain arrangement securing multiple prisoners",summary:"historical group-restraint equipment"},
  {id:"gallows",name:"Gallows",era:"ancient–modern",status:"documented",cats:["execution","display","large","stationary"],settings:["courtyard","outdoor","dungeon"],aliases:["gallows","gibbet beam"],visual:"a heavy timber execution frame with an elevated crossbeam",summary:"historical execution and display structure"},
  {id:"execution_block",name:"Execution Block",era:"medieval–modern",status:"documented",cats:["execution","display","stationary"],settings:["courtyard","chamber","dungeon"],aliases:["execution block","headsman's block","chopping block"],visual:"a heavy scarred timber block associated with judicial execution",summary:"historical execution fixture"},
  {id:"garrote_chair",name:"Garrote Chair / Garrote",era:"early modern–20th c.",status:"documented",cats:["execution","chair","restraint","stationary"],settings:["chamber","prison","collection"],aliases:["garrote","garrote chair","garrotte"],visual:"a chair or post-form execution apparatus with a metal collar mechanism",summary:"historical execution apparatus used in several countries; later than the medieval period"},
  {id:"cage_cell",name:"Barred Holding Cell",era:"ancient–modern",status:"documented/general",cats:["confinement","architectural","large"],settings:["basement","dungeon","prison","mansion"],aliases:["holding cell","barred cell","dungeon cell"],visual:"a small barred enclosure built into a room or corridor",summary:"architectural confinement element suitable for historical or modern private-dungeon aesthetics"},
  {id:"oubliette",name:"Oubliette / Bottle Dungeon",era:"medieval attribution",status:"documented term; many claims disputed",cats:["confinement","architectural","pit"],settings:["dungeon","castle","basement"],aliases:["oubliette","bottle dungeon","dungeon pit"],visual:"a deep narrow confinement space reached from an opening above",summary:"famous dungeon concept; individual sites and claimed uses vary in historical certainty"},
  {id:"cage_wheel",name:"Rotating Punishment Cage / Wheel",era:"museum/historical variants",status:"mixed provenance",cats:["display","confinement","large"],settings:["courtyard","gallery","dungeon"],aliases:["punishment wheel","cage wheel","rotating cage"],visual:"a large wheel or rotating cage-like display apparatus",summary:"museum-associated punishment apparatus with varied provenance"},
  {id:"heretics_fork",name:"Heretic's Fork",era:"claimed early modern",status:"disputed/museum-associated",cats:["restraint","wearable","compact"],settings:["collection","chamber","basement"],aliases:["heretic's fork","heretics fork"],visual:"a small double-ended metal object commonly displayed with a neck strap in torture museums",summary:"museum-famous attributed torture implement with uncertain provenance"},
  {id:"breast_ripper",name:"Breast Ripper / Iron Spider",era:"claimed early modern",status:"disputed/museum-associated",cats:["compact","tool","display"],settings:["collection","chamber","basement"],aliases:["breast ripper","iron spider","breast tearer"],visual:"a claw-like iron implement commonly exhibited in sensational torture collections",summary:"attributed torture-museum implement; historical claims should be treated cautiously"},
  {id:"tongue_pliers",name:"Punishment Pliers / Tongue Tongs",era:"early modern attribution",status:"mixed provenance",cats:["compact","tool","portable"],settings:["collection","chamber","basement"],aliases:["tongue tongs","tongue pliers","punishment pliers"],visual:"long forged tongs associated in collections with corporal punishment",summary:"historically attributed punitive implement; exact uses vary by source and specimen"},
  {id:"branding_irons",name:"Branding Irons",era:"ancient–modern",status:"documented",cats:["marking","portable","tool"],settings:["chamber","prison","collection"],aliases:["branding iron","branding irons","brand iron"],visual:"long-handled forged irons bearing symbols, letters or simple shapes",summary:"documented historical punishment and identification implements"},
  {id:"restraint_belt",name:"Iron Restraint Belt",era:"historical variants",status:"documented/general",cats:["restraint","waist","chain","portable"],settings:["any"],aliases:["restraint belt","iron belt","prisoner belt"],visual:"a rigid or chained waist restraint with attachment points for the hands",summary:"historical-style prisoner restraint useful for transport or confinement"},
  {id:"transport_chain",name:"Prisoner Transport Chain",era:"ancient–modern",status:"documented/general",cats:["restraint","chain","portable"],settings:["any"],aliases:["transport chain","prisoner chain","chain gang"],visual:"a linked restraint system connecting cuffs, collars or ankle irons",summary:"historical prisoner-transport equipment"},
  {id:"cangue",name:"Cangue",era:"imperial China–20th c.",status:"documented",cats:["restraint","humiliation","portable","display"],settings:["courtyard","hall","collection"],aliases:["cangue","tcha"],visual:"a large square wooden board worn around the neck as restraint and public punishment",summary:"documented East Asian punishment and humiliation restraint"},
  {id:"kangaroo_cage",name:"Standing Cage / Punishment Cage",era:"historical variants",status:"general",cats:["confinement","display","stationary"],settings:["courtyard","dungeon","basement"],aliases:["standing cage","punishment cage"],visual:"a narrow upright barred enclosure restricting movement",summary:"historical-style display confinement apparatus"},
  {id:"collection_case",name:"Collector's Display of Historical Implements",era:"modern",status:"modern framing",cats:["collection","display","props"],settings:["mansion","basement","gallery","study"],aliases:["torture collection","device collection","antique collection","display case"],visual:"locked cabinets, wall mounts and labeled stands containing antique, replica and disputed historical pieces",summary:"modern collector presentation that makes a broad historical catalogue plausible in a contemporary setting"}
];

const ACTIVATION_TERMS = [
  "torture","torturer","torturing","punish","punishment","dungeon","restraint","restrain",
  "captive","prisoner","basement","chamber","shackle","chain","device","apparatus",
  "collection","interrogation","cruel","sadist","sadistic","torment","humiliate","humiliation"
];

const CATEGORY_TERMS = {
  restraint:["restrain","bound","bind","immobil","captive","prisoner","shackle","chain","cuff"],
  confinement:["cage","cell","confine","imprison","prisoner","captive"],
  display:["display","show","spectacle","humiliat","example","collection"],
  humiliation:["humiliat","degrade","shame","public"],
  stationary:["basement","dungeon","chamber","room","mansion"],
  portable:["carry","portable","small","tool","implement"],
  compact:["small","close","table","handheld"],
  large:["large","room","basement","dungeon","chamber"],
  chair:["chair","seat","seated"],
  suspension:["suspend","overhead","hanging","ceiling","pulley"],
  chain:["chain","shackle","iron","ring"],
  execution:["execute","execution","gallows","death"],
  water:["water","pond","river","pool"],
  architectural:["cell","pit","room","dungeon","basement"]
};

const SETTING_TERMS = ["dungeon","basement","mansion","chamber","cell","prison","courtyard","hall","gallery","collection","outdoor","yard","table","ship","water"];

function messageText(m) {
  if (!m) return "";
  if (typeof m === "string") return m.toLowerCase();
  if (typeof m.message === "string") return m.message.toLowerCase();
  if (typeof m.content === "string") return m.content.toLowerCase();
  return "";
}

function getSignals() {
  const messages = Array.isArray(context.chat.last_messages) ? context.chat.last_messages : [];
  const latest = messageText(context.chat.last_message);
  const start = Math.max(0, messages.length - CONFIG.HISTORY_DEPTH);
  const parts = messages.slice(start).map(messageText).filter(Boolean);
  // JanitorAI may already include last_message in last_messages. Keep one copy only.
  if (latest && parts.length && parts[parts.length - 1] === latest) parts.pop();
  return {recent: parts.join(" "), latest};
}

function includesAny(text, terms) {
  return terms.some(t => text.includes(t));
}

function countMentions(text, terms) {
  let n = 0;
  for (const term of terms) {
    let at = 0;
    while ((at = text.indexOf(term, at)) !== -1) { n++; at += Math.max(1, term.length); }
  }
  return n;
}

function estimateTokens(text) { return Math.ceil((text || "").length / 4); }

const signals = getSignals();
const characterText = [
  context.character.personality || "",
  context.character.description || "",
  context.character.scenario || "",
  context.character.first_message || ""
].join(" ").toLowerCase();

function budgetFromScenario(fallback) {
  const m = String(context.character.scenario || "").match(/\[CONTEXT BUDGET:[^\]]*per_script=(\d+)/i);
  return m ? Math.min(fallback, Math.max(80, parseInt(m[1],10))) : fallback;
}
const ACTIVE_MAX_TOKENS = budgetFromScenario(CONFIG.MAX_TOKENS);
const ACCESS_TERMS = ["collection","owns","owned","private dungeon","torture chamber","equipment room","device room","museum","gallery","workshop","custom-built","replica","apparatus"];
const SCENE_TERMS = ["torture","punishment","punish","captive","prisoner","restrain","restraint","shackle","dungeon","torment","device","apparatus","collection"];
const CAPTIVITY_TERMS = ["kidnap","kidnapped","captive","prisoner","hostage","bound","tied","restrained","locked up","held against","cannot leave","can't leave","cell","dungeon"];
const PROPENSITY_TERMS = ["sadist","sadistic","cruel","torture","torturer","punish","punishment","torment","interrogat","violent","brutal","ruthless","collector","collection"];
const OPPORTUNITY_TERMS = ["basement","dungeon","cell","chamber","private room","prison","collection","equipment room","device room","workshop","gallery"];
const captivityScore = countMentions(signals.recent, CAPTIVITY_TERMS) * 2;
const propensityScore = Math.min(6, countMentions(characterText, PROPENSITY_TERMS) * 2);
const opportunityScore = Math.min(4, countMentions(signals.recent + " " + characterText, OPPORTUNITY_TERMS));
const proactiveScore = captivityScore + propensityScore + opportunityScore;
const directLatest = CATALOGUE.filter(d => includesAny(signals.latest, d.aliases));
const activationScore =
  countMentions(signals.latest, SCENE_TERMS) * 3 +
  countMentions(signals.recent, SCENE_TERMS) +
  directLatest.length * 8;
const activated = activationScore >= CONFIG.MIN_ACTIVATION_SCORE || proactiveScore >= CONFIG.PROACTIVE_THRESHOLD;

if (activated) {
  const accessEstablished = includesAny(signals.recent + " " + characterText, ACCESS_TERMS) || opportunityScore >= 2;
  const scored = CATALOGUE.map((d, index) => {
    const latestMentions = countMentions(signals.latest, d.aliases);
    const recentMentions = countMentions(signals.recent, d.aliases);
    let score = latestMentions * CONFIG.DIRECT_NAME_BONUS;
    score += recentMentions * CONFIG.CONTINUITY_BONUS;
    if (latestMentions) score += CONFIG.LATEST_MESSAGE_BONUS;

    for (const cat of d.cats) {
      const terms = CATEGORY_TERMS[cat] || [];
      if (includesAny(signals.latest, terms)) score += CONFIG.CATEGORY_MATCH_BONUS * 2;
      else if (includesAny(signals.recent, terms)) score += CONFIG.CATEGORY_MATCH_BONUS;
    }
    for (const setting of d.settings) {
      if (setting !== "any" && signals.recent.includes(setting)) score += CONFIG.SETTING_MATCH_BONUS;
    }

    // Do not casually materialize room-sized equipment where ownership/access
    // has not been established. Direct mentions always override this penalty.
    const large = d.cats.includes("large") || d.cats.includes("stationary");
    if (CONFIG.ACCESS_REQUIRED_FOR_LARGE && large && !accessEstablished && !latestMentions) score -= 4;

    // Stable tiebreaker only; no random device cycling.
    score += (10 - (index % 10)) / 100;
    return {device:d, score, latestMentions, recentMentions};
  }).filter(x => x.score >= CONFIG.MIN_ACTIVATION_SCORE);

  scored.sort((a,b) => b.score - a.score);

  const chosen = [];
  const primaryCounts = {};
  for (const item of scored) {
    if (chosen.length >= CONFIG.MAX_INJECTED) break;
    const primary = item.device.cats[0] || "other";
    if ((primaryCounts[primary] || 0) >= 2 && !item.latestMentions) continue;
    chosen.push(item);
    primaryCounts[primary] = (primaryCounts[primary] || 0) + 1;
  }

  const header = "\n[HISTORICAL EQUIPMENT] Supplement {{char}} only; never create motives or cruelty. Use only if the established scene independently makes this equipment relevant. Preserve already-established equipment and access. Modern settings may contain antiques/replicas. Disputed pieces are not proven medieval history.\n";
  const footer = "These are narrative options, not mandatory actions. If {{char}}'s established motives make punishment, coercion, or restraint appropriate now, {{char}} may independently introduce an appropriate established/accessible device without waiting for {{user}} to request one. Never invent that motive from this module. Choose only as fits personality, location, access, space, and continuity.\n";
  let block = header;
  let used = estimateTokens(header) + estimateTokens(footer);
  const emitted = [];

  for (let i = 0; i < chosen.length; i++) {
    const item = chosen[i], d = item.device;
    const full = "- " + d.name + " [" + d.status + "]: " + d.visual + "; " + d.summary + ".\n";
    const summary = "- " + d.name + ": " + d.summary + ".\n";
    const bullet = "- " + d.name + " [" + d.status + "].\n";
    let line = item.score >= CONFIG.FULL_SCORE ? full : (item.score >= CONFIG.SUMMARY_SCORE ? summary : bullet);
    if (used + estimateTokens(line) > ACTIVE_MAX_TOKENS) line = bullet;
    if (used + estimateTokens(line) > ACTIVE_MAX_TOKENS) break;
    block += line;
    used += estimateTokens(line);
    emitted.push(d.id);
  }

  if (emitted.length) {
    block += footer;
    if (estimateTokens(block) <= ACTIVE_MAX_TOKENS) context.character.scenario += block;
  }

  if (CONFIG.DEBUG) {
    console.log("[Historical Equipment v0.3] activation=" + activationScore + " tokens~" + estimateTokens(block) + " access=" + accessEstablished + " emitted=" + emitted.join(","));
    console.log("[Historical Equipment v0.3] scores=" + scored.slice(0,10).map(x => x.device.id + ":" + x.score.toFixed(2)).join(" | "));
  }
} else if (CONFIG.DEBUG) {
  console.log("[Historical Equipment v0.3] inactive activation=" + activationScore);
}
