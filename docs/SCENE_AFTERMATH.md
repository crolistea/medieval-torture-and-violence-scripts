# Scene Aftermath

A JanitorAI Script for consequence continuity. File: `scene_aftermath.js`. Marker: `[SCENE AFTERMATH]`.

Fictional violence happens, and two replies later everyone is clean, rested and unhurt. This script reminds the model of what the story **already established** so it stays true: the wound is still a wound, the shirt is still torn, the chair is still broken.

It does **not** make anything happen. It never starts violence, never invents an injury, and never makes an existing one worse. A calm chat with nothing established gets no note and costs no tokens.

## What it can carry forward

Only when recent messages actually say so:

- wounds, bleeding, bruising
- pain and difficulty moving
- weakness, shock and exhaustion
- damaged or bloody clothing, dirt and grime
- damaged objects and disturbed surroundings

The note names only the families it found. If the story mentioned a limp and nothing else, the note mentions difficulty moving and nothing else.

Phrases that say the opposite ("unharmed", "nobody was hurt", "no blood") are removed before matching, so they cannot establish an injury.

## Recovery

Recovery is judged only from what was narrated:

| The story said | The note says |
|---|---|
| nothing about time or rest | everything is still fresh |
| rest, or a few hours passed | breath and shaking settle first; wounds and soreness remain |
| the next day, or days passed | exhaustion has eased; cuts and bruises are healing but still there |
| weeks or more passed | minor marks and tiredness are gone |
| bandaging, stitches, a healer | treated injuries are dressed and steadier, not gone |
| it was serious (stabbed, broken, badly) | recovery is slow |
| it was minor (a scratch, shallow) | it can fade quickly |

Explicit narration ends things. "Fully healed" ends the body consequences, washing or changing clothes ends clothing and dirt, repairing or leaving the place ends the damage to things. If the consequence is mentioned again afterwards, it counts again.

Breathlessness and shock pass on their own: with no mention for `FADE_AFTER` turns they are dropped. Wounds are not dropped that way.

## Personality stays in charge

The note states that the character's personality decides how a consequence shows (hidden, shrugged off, complained about, raged through) and not whether it exists. A stoic character can hide the pain and still be slowed by the injury.

## Settings

```js
HISTORY_DEPTH: 10,        // recent messages checked
MAX_TOKENS: 160,          // ceiling for the note
COMPACT_TOKENS: 100,      // ceiling when Bloodloss or No Clean Fights already spoke
MIN_ACTIVATION_SCORE: 3,  // evidence needed before it activates
FADE_AFTER: 6             // turns before unmentioned breathlessness/shock is dropped
```

When the budget is tight, lines are dropped in order of importance. The list of what is established and the "do not invent or escalate" rule always stay.

## Using it with the other scripts

It is independent, like every script here. It cooperates in three ways:

- If `[BLOODLOSS CONTINUITY]` or `[NO CLEAN FIGHTS]` is already in the scenario for this reply, it uses the smaller `COMPACT_TOKENS` ceiling so the three notes do not pile up. JanitorAI does not guarantee script order, so this only applies when one of them ran first.
- It respects a `[CONTEXT BUDGET: per_script=N]` marker, with the same floor of 80 the other scripts use.
- It only appends to the scenario, and never adds its own note twice.

No Clean Fights covers the mess while a fight is going on. Bloodloss covers bleeding. Scene Aftermath covers what is left once the scene has calmed down, and how it recovers.

## Tests

```sh
npm run test:aftermath
```

`tests/scene-aftermath.test.mjs` checks that established consequences activate it, that peaceful or negated text does not, that older injuries carry forward, that existing scenario text is untouched, that the note stays within budget, and that time, treatment, severity and explicit healing change the result.
