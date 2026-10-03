"use worker";

/*
 * Action Variety Engine — JanitorAI Script
 * v0.2.0
 *
 * Expands fictional confrontation/intimidation/action vocabulary without
 * changing character personality or forcing violence.
 */
context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";

const CONFIG = { DEBUG:false, HISTORY_DEPTH:5, MAX_ACTIONS:4, MAX_TOKENS:150, RECENT_PENALTY:6 };

const REPETITION = [
  {terms:["grabs his chin","grabs her chin","grabbed his chin","grabbed her chin","tilts his chin","tilts her chin"], tags:["dominance"], label:"chin-grab"},
  {terms:["against the wall","into the wall","pins him","pins her"], tags:["grapple"], label:"wall-pin"},
  {terms:["gut","stomach"], tags:["striking"], label:"body-strike"},
  {terms:["smirk","smirked"], tags:["intimidation"], label:"smirk"},
  {terms:["leans closer","leaned closer","leans in","leaned in"], tags:["intimidation"], label:"lean-in"}
];

const INTENSITY = [
  {level:4, terms:["serious fight","chokehold","weapon","knife","gun","life or death"]},
  {level:3, terms:["fight","brawl","attack","tackle","punch","kick","subdue","grapple"]},
  {level:2, terms:["restrain","grab","shove","struggle","escape","captive","prisoner"]},
  {level:1, terms:["threat","intimidat","angry","rage","menace","argument"]}
];

const ACTIONS = [
  {id:"loom", tags:["intimidation","dominance"], cues:["intimidat","threat","menace","domin"], text:"Use spatial pressure: close distance, block an exit, loom over someone, or force them to yield ground."},
  {id:"wall_pin", tags:["intimidation","grapple"], cues:["pin","corner","wall","grapple","fight"], text:"Consider a brief wall or furniture pin, controlling posture and space rather than defaulting to chin-grabbing."},
  {id:"wrist_control", tags:["restraint","grapple"], cues:["grab","restrain","stop","fight"], text:"Consider wrist/forearm control, redirecting an arm, or controlling both hands during a struggle."},
  {id:"clinch", tags:["grapple","fight"], cues:["fight","brawl","grapple","struggle"], text:"Use a clinch, body lock, off-balancing shove, or struggle for position when close-range fighting fits."},
  {id:"chokehold_fiction", min:4, tags:["grapple","high_intensity"], cues:["chokehold","choke","grapple","fight","subdue"], text:"For high-intensity fictional grappling, a chokehold/head-and-arm restraint can appear as a narrative beat; keep it non-instructional and avoid technical application details."},
  {id:"takedown", min:3, tags:["grapple","fight"], cues:["fight","attack","subdue","tackle"], text:"Consider a tackle, trip, sweep-like takedown, or driving someone to the floor, described cinematically rather than as technique instruction."},
  {id:"drag", tags:["control","intimidation"], cues:["drag","remove","take","captive","prisoner"], text:"Control can be shown by hauling, dragging, steering by clothing/arm, or forcing movement through the environment."},
  {id:"clothing_grab", tags:["intimidation","fight"], cues:["threat","fight","grab","angry"], text:"Consider grabbing a collar, lapel, shirtfront, belt, or coat and using it to pull the other person close or reposition them."},
  {id:"environmental", tags:["fight","improvised"], cues:["fight","brawl","violent","attack"], text:"Let the environment matter: doors, desks, walls, floors, railings, and nearby obstacles can shape the confrontation instead of every exchange being a slap or gut strike."},
  {id:"disarm", tags:["control","fight"], cues:["weapon","knife","gun","armed","fight"], text:"If the narrative establishes a weapon and the character plausibly can respond, portray a contested disarm or struggle abstractly; do not give real-world technique steps."},
  {id:"intercept", tags:["control","intimidation"], cues:["leave","escape","run","door","stop"], text:"Interception can show dominance: step into the path, catch an arm or clothing, shut/block a door, or physically cut off retreat."},
  {id:"ground_control", min:3, tags:["grapple","fight"], cues:["floor","ground","tackle","fight","subdue"], text:"After a fall, vary the beat with a pin, scramble, kneeling restraint, or fight for leverage rather than instantly resetting to standing."},
  {id:"strike_variety", min:3, tags:["fight","striking"], cues:["hit","strike","fight","punch","attack"], text:"Vary fictional strikes when appropriate: punches, elbows, knees, kicks, backhands, stomps near/at an opponent, or combinations—without anatomical targeting or optimization."},
  {id:"object_break", tags:["intimidation","display"], cues:["angry","rage","threat","intimidat"], text:"Intimidation need not touch the other person: slam a hand down, kick furniture aside, break an object, or deliberately invade personal space if it fits the character."},
  {id:"quiet_threat", tags:["intimidation","psychological"], cues:["threat","intimidat","menace","fear"], text:"Use controlled menace too: prolonged silence, deliberate proximity, blocking movement, an unbroken stare, or calmly handling an already-established prop."}
];

const TRIGGERS=["fight","fighting","violent","violence","attack","threat","intimidat","angry","rage","grab","restrain","subdue","captive","prisoner","brawl","struggle","hit","punch","choke","domin"];
function msg(m){if(!m)return "";if(typeof m==="string")return m.toLowerCase();if(typeof m.message==="string")return m.message.toLowerCase();if(typeof m.content==="string")return m.content.toLowerCase();return "";}
function any(t,a){return a.some(x=>t.includes(x));}
function tok(t){return Math.ceil(t.length/4);}
function budget(fallback){
  const m=String(context.character.scenario||"").match(/\[CONTEXT BUDGET:[^\]]*per_script=(\d+)/i);
  return m?Math.min(fallback,Math.max(80,parseInt(m[1],10))):fallback;
}
const ms=Array.isArray(context.chat.last_messages)?context.chat.last_messages:[];
const latest=msg(context.chat.last_message);
const recentParts=ms.slice(Math.max(0,ms.length-CONFIG.HISTORY_DEPTH)).map(msg).filter(Boolean);
if(latest&&recentParts.length&&recentParts[recentParts.length-1]===latest)recentParts.pop();
const recent=recentParts.join(" ");
const combined=(recent+" "+latest).toLowerCase();
let intensity=0;
for(const tier of INTENSITY){if(any(combined,tier.terms)){intensity=tier.level;break;}}
const repeated=REPETITION.filter(r=>r.terms.some(t=>combined.includes(t)));
if(any(latest,TRIGGERS)||any(recent,TRIGGERS)){
  const ranked=ACTIONS.map((a,i)=>{
    if((a.min||1)>intensity)return {a,score:-999};
    let score=0;
    for(const c of a.cues){if(latest.includes(c))score+=4; else if(recent.includes(c))score+=1;}
    if(recent.includes(a.id.replace(/_/g," ")))score-=CONFIG.RECENT_PENALTY;
    for(const r of repeated){if(r.tags.some(t=>a.tags.includes(t)))score-=CONFIG.RECENT_PENALTY;}
    score+=(10-(i%10))/100;
    return {a,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,CONFIG.MAX_ACTIONS);

  const ACTIVE_MAX_TOKENS=budget(CONFIG.MAX_TOKENS);
  const header="\n[ACTION VARIETY] Preserve {{char}}'s motives and current scene. When confrontation already exists, vary physical beats instead of repeating clichés. Keep action cinematic and non-instructional.\n";
  const repetitionLine=repeated.length?"Recent repetitive beat families detected ("+repeated.map(r=>r.label).join(", ")+"); prefer a materially different beat unless continuity requires repetition.\n":"";
  const footer="Intensity="+intensity+"/4. Match established stakes, abilities and continuity; never escalate merely for novelty.\n";
  let out=header;
  let used=tok(header)+tok(repetitionLine)+tok(footer), emitted=[];
  for(const x of ranked){
    const line="- "+x.a.text+"\n";
    if(used+tok(line)>ACTIVE_MAX_TOKENS)break;
    out+=line; used+=tok(line); emitted.push(x.a.id);
  }
  out+=repetitionLine+footer;
  if(tok(out)<=ACTIVE_MAX_TOKENS)context.character.scenario+=out;
  if(CONFIG.DEBUG)console.log("[Action Variety] intensity="+intensity+" tokens~"+tok(out)+" actions="+emitted.join(","));
}
