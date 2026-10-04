"use worker";

/*
 * Test fixture: an "advanced" lorebook written as code, with the kinds of
 * awkward things real ones contain. const fake = [{ name: "in a comment" }]
 */

const CONFIG = { DEBUG: false, MAX_ENTRIES: 3 };

const SHARED_KEYS = ['harbor', "docks"];
const note = "const trap = [{ name: 'inside a string', content: 'no' }]";

// A regular expression with a bracket and a quote in it: /["'\]]+/
const QUOTES = /["'\]]+/g;

const loreEntries = [
  {
    name: 'The Harbor',
    keys: SHARED_KEYS,
    content: "A crowded harbor. It smells of tar, and the gulls don't stop.",
    priority: 10,
    category: "place",
    constant: false,
    filters: { notWith: ['inland'] },
  },
  {
    title: "Captain Voss",
    keywords: "voss, the captain , captain voss",
    content: `Captain Voss runs the night watch.
She limps on her left leg.`,
    insertion_order: 20,
    enabled: true,
    probability: 80,
  },
  {
    name: 'The Toll',
    keys: ['toll', 'fee'],
    content: 'Ships pay ' + 'a toll ' + "at the chain.",
    order: 5,
    weight: Math.max(1, CONFIG.MAX_ENTRIES),
  },
  {
    name: "Rumors",
    keys: ["rumor"],
    content: [
      "- The lighthouse keeper is missing.",
      "- Someone cut the chain last winter.",
    ].join("\n"),
    comment: 'joined with code',
  },
  {
    name: 'Greeting',
    keys: ['hello'],
    content: `Welcome, ${context.character.name}.`,
  },
  { name: 'Empty one', keys: [] },
];

for (const entry of loreEntries) {
  if (context.chat.last_message.includes(entry.keys[0])) {
    context.character.scenario += "\n" + entry.content;
  }
}
