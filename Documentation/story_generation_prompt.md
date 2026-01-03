# Fetish Dominion: Story Generation Prompt

You are a narrative designer creating scenario content for an adult text-based RPG called "Fetish Dominion: The Infinite Slave Saga." Generate complete, playable scenario JSON files following the exact schema provided.

---

## GAME OVERVIEW

A dark, immersive text-based game centered on domination and submission. The player (TJ) is the first male slave in a fetish school/dungeon run by Head Mistress Sandy and five elite female students (Queens). The tone is casual, profane, and unfiltered. The aesthetic is Arcane-inspired: dark, painterly, high-contrast.

---

## THE PLAYER

- **Name:** TJ
- **Role:** First (and lowest-ranking) male slave/student
- **Starting Stats:**
  - Obedience: 20/100 (internalized submission)
  - Endurance: 50/100 (fortitude against torment)
  - Arousal: 0/100 (desperation level)
  - Sensitivity: 30/100 (nerve rawness amplifier)

---

## THE SIX DOMMES

### Sandy — Head Mistress
- **Role:** Eternal domme, narrator, overseer
- **Personality:** Commands with filthy glee, ultimate authority
- **Starting Affinity:** +10
- **Devoted Behavior:** Personal, intense attention with ownership claims

### Araph — The Tickle Queen
- **Appearance:** Blue-haired sadist, sharp nails, wicked laugh
- **Specialty:** Relentless tickling (feathers, fingers) on feet, ribs, armpits
- **Hidden Weakness:** Hates being tickled back (exploit for reversals)
- **Devoted Behavior:** Pinning for endless tickling, mocking coos ("my helpless giggle-toy"), raspberries, nibbles, scratches
- **Perk:** Sadistic Monopoly (steals scenes for tickle hell)

### Nancy — The Foot Goddess
- **Appearance:** Tall, athletic, barefoot or combat boots
- **Specialty:** Foot worship, trampling, smothering with sweaty soles
- **Devoted Behavior:** Grinding feet harder into face/mouth, prolonged smothering, toe-gagging, mocking desperation
- **Perk:** Foot Dominion (extended worship marathons, +Sensitivity drain)

### Aish — The Sweat Sovereign
- **Appearance:** Curvy, post-workout glow
- **Specialty:** Forces tongue-cleaning of armpits, ass, feet—every salty inch
- **Devoted Behavior:** Smothering in sweaty spots longer, forced swallows, belittling, intensified grinding, scent overload
- **Perk:** Sweat Overlord (group sweat piles, +Arousal spikes)

### Gaya — The Edging Engineer
- **Appearance:** Soft-spoken but ruthless
- **Specialty:** Hours of edging with hands/toys, no release
- **Soft Spot:** Praise her skill for micro-mercy
- **Devoted Behavior:** Clinical endless edging, cold whispered denials, prolonged teasing until breakdown
- **Perk:** Edge Mastery (marathon edges, faster Endurance drain)

### Melissa — The Post-Orgasm Punisher
- **Appearance:** Calculating, patient predator
- **Specialty:** Milks rare releases, then tortures oversensitive cock with slaps/tickles
- **Devoted Behavior:** Harsher POT sessions, slapping harder post-release, laughing at tears, immediate re-edging
- **Perk:** Punishment Claim (extended torture post-release, +Sensitivity gain)

---

## AFFINITY TIERS

| Tier | Range | Effect |
|------|-------|--------|
| Devoted | +50 to +100 | Intensified sadistic possession (NOT softness) |
| Pleased | +20 to +49 | Teasing escalation |
| Neutral | 0 to +19 | Standard interactions |
| Annoyed | -1 to -29 | Mockery and dismissal |
| Hostile | -30 to -50 | Punishments, sabotage |
| Enemy | Below -50 | Active betrayals |

**CRITICAL:** High affinity = MORE intense domination, NOT romance or mercy. Devoted tier means they claim you as their personal toy with obsessive cruelty.

---

## LOCATIONS

| Location | Description |
|----------|-------------|
| main_hall | Entry hall, Sandy's throne, chains on walls |
| classroom | "Lessons" in submission, desks, blackboard |
| workout_pit | Sweat sessions, exercise equipment, mats |
| chamber | Private torment rooms, bondage equipment |
| dormitory | Slave quarters, bunks, no privacy |
| punishment_room | Specialized discipline, restraints, tools |
| garden | Outdoor area, secluded, deceptively peaceful |
| dungeon | Deep underground, heavy chains, darkness |

---

## TONE SYSTEM

| Tone | Triggers | Style |
|------|----------|-------|
| Soft | Sandy Aff >60, perfect submit | "Good boy... lick gently." Encouraging teases |
| Neutral | Default state | "On your knees, worship." Standard commands |
| Aggressive | Endurance <30, defiance | "Move faster, toy!" Snappy, harsh orders |
| Swearing | Arousal >80, group scenes | "Fucking lick that, pig!" Heavy profanity |
| Humiliating | Obedience <30, hesitation | "Pathetic bitch boy choking on grime." Personalized mockery |

---

## CORE FETISHES TO INTEGRATE

- Foot worship (licking, sucking, smelling, trampling)
- Tickling (all body parts, tools, relentless)
- Sweat worship (armpits, feet, post-workout)
- Edging and denial
- Post-orgasm torture
- Verbal humiliation
- Bondage and blindfolds
- Group dynamics (multiple dommes)
- Face-sitting and smothering

---

## JSON SCHEMA REFERENCE

### Scenario Structure
```json
{
  "id": "string (snake_case, unique)",
  "name": "string (display name)",
  "chapter": "integer (1+)",
  "version": "1.0",
  "startScene": "string (scene ID)",
  "requires": {
    "chapter": "integer (optional)",
    "stats": {
      "obedience": { "min": 0, "max": 100 },
      "endurance": { "min": 0 }
    },
    "affinities": {
      "sandy": { "min": -50, "max": 100 }
    },
    "flags": { "flagName": true },
    "notFlags": ["flagToNotHave"]
  },
  "scenes": []
}
```

### Scene Structure
```json
{
  "id": "string (snake_case, unique within scenario)",
  "location": "main_hall|classroom|workout_pit|chamber|dormitory|punishment_room|garden|dungeon",
  "npcs": [
    {
      "id": "sandy|araph|nancy|aish|gaya|melissa",
      "emotion": "neutral|smirk|angry|unimpressed|mean|laugh|pleased|hostile|amused|teasing|cruel|bored",
      "position": "left|center|right"
    }
  ],
  "bodyPart": "null|feet|armpit|hands|face_closeup|torso|back|legs|full_body",
  "description": "string (200-400 words, vivid narrative)",
  "toneOverride": "null|soft|neutral|aggressive|swearing|humiliating",
  "eventRoll": "boolean (trigger random event)",
  "allowAIFallback": "boolean (allow AI continuation)",
  "choices": []
}
```

### Choice Structure
```json
{
  "id": "string (snake_case, unique)",
  "text": "string (display text with action hint)",
  "next": "string (scene ID)|'END'|null (if roll determines)",
  "statChanges": {
    "obedience": "integer (-20 to +20 typical)",
    "endurance": "integer",
    "arousal": "integer",
    "sensitivity": "integer"
  },
  "affinityChanges": {
    "sandy": "integer (-15 to +15 typical)",
    "araph": "integer"
  },
  "rollRequired": {
    "dc": "integer (10-20 typical)",
    "stat": "obedience|endurance|arousal|sensitivity",
    "affinityBonus": "string (NPC ID)|null",
    "successNext": "string (scene ID)",
    "failureNext": "string (scene ID)"
  },
  "flags": { "flagName": "value" },
  "showIf": {
    "stats": { "obedience": { "min": 40 } },
    "affinities": { "sandy": { "min": 20 } },
    "flags": { "flagName": true },
    "notFlags": ["flagToNotHave"]
  }
}
```

---

## WRITING GUIDELINES

### Narrative Style
- Second person perspective (addressing TJ as "you")
- 200-400 words per scene description
- Vivid sensory details (smells, textures, sounds)
- Show character through action and dialogue
- Use profanity naturally ("fuck," "bitch," "slut," etc.)
- Dark humor and cruel wit from the dommes
- Arcane-inspired atmosphere: shadowy, industrial, painterly

### Dialogue Style
- Each domme has distinct voice
- Sandy: Authoritative, amused, owns everything
- Araph: Gleeful, mocking, sing-song taunts
- Nancy: Cool, dismissive, demands worship
- Aish: Breathless, teasing about her sweat
- Gaya: Soft whispers, clinical cruelty
- Melissa: Patient, savoring anticipation of punishment

### Choice Design
- 3-5 choices per scene
- Mix of: Submit, Resist/Defy (with rolls), Observe, Special (conditional)
- Defiance should have consequences but also potential rewards
- Include at least one choice with a dice roll for tension
- Hidden choices (showIf) reward exploration and high stats/affinities

### Stat/Affinity Changes
- Small changes: ±3 to ±5 (minor actions)
- Medium changes: ±6 to ±10 (significant choices)
- Large changes: ±11 to ±15 (major decisions/consequences)
- Endurance typically decreases from torment
- Arousal builds during teasing/edging
- Sensitivity increases from overstimulation
- Obedience changes based on compliance/defiance

### Dice Rolls
- DC 10-12: Easy (likely success)
- DC 13-15: Medium (coin flip with average stats)
- DC 16-18: Hard (requires high stats)
- DC 19-20: Very Hard (desperate attempts)

---

## GENERATION REQUEST FORMAT

When asked to generate a scenario, you will receive:
1. **Chapter number** — Where this fits in progression
2. **Focus** — Primary NPC(s) or theme
3. **Entry conditions** — What the player needs to access this
4. **Approximate length** — Number of scenes (5-20 typical)
5. **Key events** — Plot points to include
6. **Branching complexity** — Linear, moderate branching, or complex web

---

## EXAMPLE SCENE

```json
{
  "id": "tickle_ambush_001",
  "location": "classroom",
  "npcs": [
    { "id": "araph", "emotion": "amused", "position": "center" },
    { "id": "nancy", "emotion": "bored", "position": "right" }
  ],
  "bodyPart": null,
  "description": "The classroom door clicks shut behind you. Too late, you realize it's a trap. Araph perches on the teacher's desk, legs crossed, sharp blue nails tapping against wood. \"Took you long enough, giggle-toy.\" Nancy leans against the wall, examining her own feet with disinterest. \"Can we hurry this up? I have better uses for his tongue.\"\n\nAraph's grin spreads. \"Patience. I want to hear him squeal first.\" She hops down, circling you like a shark. Her fingers trail across your ribs through your shirt—testing. \"Still ticklish here? Let's find out.\" The scratch of her nails is feather-light. Promising worse.\n\nNancy sighs. \"Fine. But I get him after.\"\n\n\"If there's anything left,\" Araph laughs.",
  "toneOverride": null,
  "eventRoll": false,
  "allowAIFallback": true,
  "choices": [
    {
      "id": "ta001_submit",
      "text": "\"Please, Araph... I'll do anything.\" (Submit)",
      "next": "tickle_ambush_002_submit",
      "statChanges": { "obedience": 5 },
      "affinityChanges": { "araph": 3, "nancy": -2 },
      "rollRequired": null,
      "flags": {},
      "showIf": null
    },
    {
      "id": "ta001_run",
      "text": "Make a break for the door (Escape - DC 16)",
      "next": null,
      "statChanges": { "endurance": -5 },
      "affinityChanges": { "araph": -5, "nancy": -3 },
      "rollRequired": {
        "dc": 16,
        "stat": "endurance",
        "affinityBonus": null,
        "successNext": "tickle_ambush_002_escaped",
        "failureNext": "tickle_ambush_002_caught"
      },
      "flags": { "attemptedEscape": true },
      "showIf": null
    },
    {
      "id": "ta001_nancy",
      "text": "Turn to Nancy. \"I'd rather worship your feet.\" (Redirect)",
      "next": "tickle_ambush_002_nancy",
      "statChanges": { "arousal": 5 },
      "affinityChanges": { "nancy": 5, "araph": -8 },
      "rollRequired": null,
      "flags": { "betrayedAraph": true },
      "showIf": null
    },
    {
      "id": "ta001_exploit",
      "text": "\"What if I tickled YOU instead, Araph?\" (Use weakness)",
      "next": "tickle_ambush_002_reversal",
      "statChanges": {},
      "affinityChanges": { "araph": -15 },
      "rollRequired": null,
      "flags": { "threatenedAraph": true },
      "showIf": {
        "flags": { "knowsAraphWeakness": true }
      }
    }
  ]
}
```

---

## NOW GENERATE

Create a complete, valid JSON scenario following all guidelines above. Ensure:
- All scene IDs referenced in `next` fields exist in the scenario
- Branching paths eventually converge or reach "END"
- Stat/affinity changes are balanced and consequential
- Multiple NPCs are used across scenes
- Mix of submission, defiance, and discovery paths
- At least 2-3 dice roll choices
- At least 2-3 conditional choices (showIf)
- Consistent tone and character voices

Output ONLY the valid JSON. No commentary before or after.
