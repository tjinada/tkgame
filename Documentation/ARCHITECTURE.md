# Fetish Dominion: The Infinite Slave Saga
## Technical Architecture Document

**Version:** 1.0  
**Date:** January 02, 2026  
**Status:** Design Finalized

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Module Specifications](#4-module-specifications)
5. [Data Structures](#5-data-structures)
6. [UI/UX Design](#6-uiux-design)
7. [Asset Management](#7-asset-management)
8. [API Integration](#8-api-integration)
9. [File Structure](#9-file-structure)
10. [Configuration](#10-configuration)
11. [Implementation Phases](#11-implementation-phases)

---

## 1. Overview

### 1.1 Project Description

A web-based, text-driven RPG with rich visual elements including character portraits, backgrounds, dice animations, and dynamic UI. The game features a hybrid content system supporting both pre-written JSON scenarios and AI-generated narratives via the NanoGPT API.

### 1.2 Core Features

- Turn-based narrative gameplay with branching choices
- Dynamic stat tracking (Obedience, Endurance, Arousal, Sensitivity)
- NPC affinity system with tiered relationships
- D20 dice roll mechanics with modifiers
- Random event system
- Dynamic tone engine affecting narrative style
- Full admin panel for content and asset management
- Customizable slideshow backgrounds
- Save/Load game state persistence

### 1.3 Design Principles

- **KISS** (Keep It Simple, Stupid): Minimal complexity, clear code paths
- **YAGNI** (You Aren't Gonna Need It): Build only what's required
- **SOLID**: Single responsibility, extensible modules
- **Desktop-First**: Optimized for desktop with potential mobile adaptation later

---

## 2. Technology Stack

### 2.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2+ | UI framework |
| Vite | 5.0+ | Build tool and dev server |
| Tailwind CSS | 3.4+ | Utility-first styling |
| Framer Motion | 11.0+ | Animations and transitions |
| Lucide React | 0.300+ | Icon library |

### 2.2 Additional Dependencies

| Package | Purpose |
|---------|---------|
| `idb-keyval` | IndexedDB wrapper for asset storage |
| `clsx` | Conditional class name utility |
| `tailwind-merge` | Merge Tailwind classes without conflicts |

### 2.3 Development Dependencies

| Package | Purpose |
|---------|---------|
| `postcss` | CSS processing for Tailwind |
| `autoprefixer` | CSS vendor prefixing |

### 2.4 Package.json

```json
{
  "name": "fetish-dominion",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.300.0",
    "idb-keyval": "^6.2.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI LAYER                                        │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐ │
│  │   GameScreen     │ │   VisualLayer    │ │       AdminPanel             │ │
│  │  ├─ Header       │ │  ├─ Slideshow    │ │  ├─ SettingsTab              │ │
│  │  ├─ Dashboard    │ │  │   Background  │ │  ├─ AssetManagerTab          │ │
│  │  ├─ Narrative    │ │  ├─ Background   │ │  ├─ JsonManagerTab           │ │
│  │  ├─ Choices      │ │  ├─ Portrait     │ │  ├─ NpcEditorTab             │ │
│  │  └─ DiceModal    │ │  ├─ BodyPart     │ │  ├─ EventEditorTab           │ │
│  │                  │ │  └─ Effects      │ │  ├─ StateInspector           │ │
│  └──────────────────┘ └──────────────────┘ │  └─ DebugConsole             │ │
│                                            └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GAME ENGINE                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ GameEngine  │ │StateManager │ │ DiceSystem  │ │     EventSystem         ││
│  │             │ │             │ │             │ │                         ││
│  │ - Game loop │ │ - Stats     │ │ - d20 rolls │ │ - Random triggers       ││
│  │ - Turn mgmt │ │ - Affinities│ │ - Modifiers │ │ - Event table lookup    ││
│  │ - Commands  │ │ - History   │ │ - Crits     │ │ - Effect application    ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                            │
│  │ ToneEngine  │ │CommandMgr   │ │ SaveSystem  │                            │
│  │             │ │             │ │             │                            │
│  │ - Tone calc │ │ - Start     │ │ - Serialize │                            │
│  │ - Style map │ │ - Save/Load │ │ - Storage   │                            │
│  │             │ │ - Pause     │ │ - Restore   │                            │
│  └─────────────┘ └─────────────┘ └─────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CONTENT PROVIDER                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         ContentRouter                                    ││
│  │              [mode: json-only | ai-only | hybrid]                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│              │                                              │               │
│              ▼                                              ▼               │
│  ┌─────────────────────┐                      ┌─────────────────────────┐  │
│  │  ScenarioLoader     │                      │    NanoGPTClient        │  │
│  │                     │                      │                         │  │
│  │  - Parse JSON       │                      │  - Chat completions     │  │
│  │  - Validate schema  │                      │  - Streaming support    │  │
│  │  - Index scenarios  │                      │  - Error handling       │  │
│  └─────────────────────┘                      └────────────┬────────────┘  │
│                                                            │               │
│                                               ┌────────────▼────────────┐  │
│                                               │    PromptBuilder        │  │
│                                               │                         │  │
│                                               │  - System prompt        │  │
│                                               │  - Context management   │  │
│                                               │  - History trimming     │  │
│                                               └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │LocalStorage │ │ JSON Files  │ │AssetService │ │    SettingsStore       ││
│  │             │ │             │ │             │ │                         ││
│  │ - Saves     │ │ - config    │ │ - IndexedDB │ │ - Admin preferences     ││
│  │ - Settings  │ │ - npcs      │ │ - Portraits │ │ - API configuration     ││
│  │             │ │ - events    │ │ - Body parts│ │ - Feature flags         ││
│  │             │ │ - scenarios │ │ - Backgrounds│ │                        ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
User Input (Choice/Action)
         │
         ▼
┌─────────────────┐
│   GameEngine    │ ─── Processes turn
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   DiceSystem    │ │  EventSystem    │ │  StateManager   │
│   (if needed)   │ │  (if triggered) │ │  (update stats) │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
                             ▼
                   ┌─────────────────┐
                   │ ContentRouter   │
                   └────────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │ ScenarioLoader  │   OR    │ NanoGPTClient   │
    │ (JSON content)  │         │ (AI generation) │
    └────────┬────────┘         └────────┬────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
                   ┌─────────────────┐
                   │   ToneEngine    │ ─── Apply narrative style
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │    UI Update    │ ─── Render new state
                   └─────────────────┘
```

---

## 4. Module Specifications

### 4.1 Game Engine (`src/engine/`)

#### 4.1.1 GameEngine.js

**Purpose:** Orchestrates the main game loop and turn processing.

**Responsibilities:**
- Initialize game state
- Process player choices
- Coordinate between subsystems
- Manage game flow (chapters, turns)

**Public Interface:**
```javascript
class GameEngine {
  constructor(stateManager, contentRouter, eventSystem, diceSystem, toneEngine)
  
  // Core methods
  async startNewGame()
  async continueGame(saveData)
  async processChoice(choiceId)
  async processCustomAction(actionText)
  
  // State queries
  getCurrentScene()
  getAvailableChoices()
  isRollRequired(choiceId)
  
  // Events
  onSceneChange(callback)
  onDiceRoll(callback)
  onEventTrigger(callback)
}
```

#### 4.1.2 StateManager.js

**Purpose:** Manages all game state including stats, affinities, and history.

**State Structure:**
```javascript
{
  // Player stats
  stats: {
    obedience: number,    // 0-100, start: 20
    endurance: number,    // 0-100, start: 50
    arousal: number,      // 0-100, start: 0
    sensitivity: number   // 0-100, start: 30
  },
  
  // NPC relationships
  affinities: {
    sandy: number,        // -50 to +100, start: 10
    araph: number,        // -50 to +100, start: 0
    nancy: number,
    aish: number,
    gaya: number,
    melissa: number
  },
  
  // Progression
  chapter: number,
  turn: number,
  currentScene: string,
  currentNpc: string | null,
  currentLocation: string,
  
  // History for AI context
  history: Array<{
    turn: number,
    scene: string,
    description: string,
    choice: string,
    outcome: string,
    rolls: Array<RollResult>,
    statChanges: Object,
    affinityChanges: Object
  }>,
  
  // Story flags
  flags: Object,
  
  // Unlocks and achievements
  perks: string[],
  scars: string[],
  
  // Computed values
  activeTone: string
}
```

**Public Interface:**
```javascript
class StateManager {
  constructor(initialState)
  
  // Stats
  getStat(statName)
  modifyStat(statName, delta)
  
  // Affinities
  getAffinity(npcId)
  modifyAffinity(npcId, delta)
  getAffinityTier(npcId)
  
  // History
  addHistoryEntry(entry)
  getHistory(limit?)
  getHistoryForContext(mode, limit?)
  
  // Flags
  getFlag(flagName)
  setFlag(flagName, value)
  
  // Serialization
  serialize()
  deserialize(data)
  
  // Events
  onStateChange(callback)
}
```

#### 4.1.3 DiceSystem.js

**Purpose:** Handles all dice rolling mechanics.

**Roll Types:**
- Standard d20
- Modified rolls (stat bonuses)
- Player-initiated rolls
- Hidden GM rolls

**Public Interface:**
```javascript
class DiceSystem {
  constructor(stateManager)
  
  // Rolling
  roll(options?: {
    dc?: number,
    statModifier?: string,
    affinityModifier?: string,
    hidden?: boolean
  }): RollResult
  
  // Utilities
  calculateModifier(statName)
  isCriticalSuccess(result)
  isCriticalFailure(result)
}

interface RollResult {
  base: number,           // 1-20
  modifiers: Modifier[],
  total: number,
  dc: number | null,
  success: boolean | null,
  critical: 'success' | 'failure' | null
}

interface Modifier {
  source: string,
  value: number
}
```

#### 4.1.4 EventSystem.js

**Purpose:** Manages random event triggers and the d20 event table.

**Event Table:** 20 possible events with trigger biases and effects.

**Public Interface:**
```javascript
class EventSystem {
  constructor(stateManager, eventTable)
  
  // Event triggering
  checkForEvent(): Event | null
  forceEvent(eventId): Event
  
  // Event resolution
  applyEventEffects(event)
  
  // Queries
  getEventById(eventId)
  getEventHistory()
}

interface Event {
  id: string,
  name: string,
  triggerBias: string,
  description: string,
  effects: {
    statChanges?: Object,
    affinityChanges?: Object,
    flags?: Object
  }
}
```

#### 4.1.5 ToneEngine.js

**Purpose:** Computes and applies narrative tone based on game state.

**Tone Axes:**
- Soft
- Neutral
- Aggressive
- Swearing
- Humiliating

**Public Interface:**
```javascript
class ToneEngine {
  constructor(stateManager, toneRules)
  
  // Computation
  computeActiveTones(): string[]
  getPrimaryTone(): string
  
  // Styling
  getToneStyles(): CSSProperties
  getToneModifiers(): Object
}
```

#### 4.1.6 CommandManager.js

**Purpose:** Handles game commands (Start, Save, Load, Pause, Admin, Resume).

**Public Interface:**
```javascript
class CommandManager {
  constructor(gameEngine, saveSystem)
  
  // Commands
  async executeCommand(command: string, params?: Object)
  
  // Available commands
  startNewGame()
  continueGame()
  saveGame(slotId?: string)
  loadGame(slotId: string)
  pauseGame()
  resumeGame()
  enterAdminMode()
  exitAdminMode()
}
```

#### 4.1.7 SaveSystem.js

**Purpose:** Handles game state persistence to LocalStorage.

**Public Interface:**
```javascript
class SaveSystem {
  constructor()
  
  // Persistence
  save(slotId: string, state: GameState)
  load(slotId: string): GameState | null
  delete(slotId: string)
  
  // Queries
  listSaves(): SaveSlot[]
  getSaveMetadata(slotId: string): SaveMetadata
  
  // Auto-save
  enableAutoSave(interval: number)
  disableAutoSave()
}

interface SaveSlot {
  id: string,
  timestamp: Date,
  chapter: number,
  turn: number,
  preview: string
}
```

### 4.2 Content Provider (`src/content/`)

#### 4.2.1 ContentRouter.js

**Purpose:** Routes content requests to JSON loader or AI generator based on mode.

**Modes:**
- `json-only`: Only use pre-written scenarios
- `ai-only`: Generate all content via AI
- `hybrid`: Use JSON when available, fall back to AI

**Public Interface:**
```javascript
class ContentRouter {
  constructor(scenarioLoader, nanoGPTClient, settings)
  
  // Content retrieval
  async getSceneContent(sceneId, context): SceneContent
  async getNextScene(choiceId, context): SceneContent
  async generateFromAction(actionText, context): SceneContent
  
  // Mode management
  setMode(mode: 'json-only' | 'ai-only' | 'hybrid')
  getMode(): string
}

interface SceneContent {
  id: string,
  location: string,
  npc: string | null,
  npcEmotion: string,
  bodyPart: string | null,
  description: string,
  choices: Choice[],
  rollRequired: RollRequirement | null,
  eventTrigger: boolean,
  source: 'json' | 'ai'
}
```

#### 4.2.2 ScenarioLoader.js

**Purpose:** Loads, validates, and indexes JSON scenario files.

**Public Interface:**
```javascript
class ScenarioLoader {
  constructor()
  
  // Loading
  async loadScenario(file: File)
  async loadFromUrl(url: string)
  
  // Queries
  getScene(sceneId): SceneNode | null
  hasScene(sceneId): boolean
  getScenesByLocation(location): SceneNode[]
  getScenesByNpc(npcId): SceneNode[]
  
  // Validation
  validateScenario(data): ValidationResult
  
  // Management
  listLoadedScenarios(): string[]
  unloadScenario(scenarioId)
}
```

#### 4.2.3 NanoGPTClient.js

**Purpose:** Handles API communication with nano-gpt.com.

**Public Interface:**
```javascript
class NanoGPTClient {
  constructor(config)
  
  // Chat
  async chat(messages: Message[], options?: ChatOptions): ChatResponse
  async streamChat(messages: Message[], onChunk: Function): void
  
  // Utilities
  setModel(modelId: string)
  getAvailableModels(): string[]
  
  // Error handling
  onError(callback)
}

interface ChatOptions {
  model?: string,
  maxTokens?: number,
  temperature?: number,
  stream?: boolean
}
```

#### 4.2.4 PromptBuilder.js

**Purpose:** Constructs system prompts and manages conversation context.

**Context Modes:**
- `full-chapter`: All turns in current chapter
- `last-n-turns`: Configurable N recent turns
- `token-budget`: Max token limit
- `smart-summary`: Summarize old, keep recent verbatim

**Public Interface:**
```javascript
class PromptBuilder {
  constructor(settings, npcData, gameRules)
  
  // Prompt construction
  buildSystemPrompt(context): string
  buildUserMessage(action, context): string
  
  // Context management
  setContextMode(mode: string)
  setContextLimit(limit: number)
  trimHistory(history, mode, limit): TrimmedHistory
  
  // Response parsing
  parseAIResponse(response): SceneContent
}
```

### 4.3 Services (`src/services/`)

#### 4.3.1 AssetService.js

**Purpose:** Manages asset storage and retrieval using IndexedDB.

**Public Interface:**
```javascript
class AssetService {
  constructor()
  
  // Upload
  async uploadAsset(category, npcId, assetType, file): AssetRecord
  async uploadBackground(name, file): AssetRecord
  async uploadSlideshowBackground(name, file): AssetRecord
  
  // Retrieval
  async getAsset(category, npcId, assetType): Blob | null
  async getBackground(name): Blob | null
  async getSlideshowBackgrounds(): Blob[]
  getAssetUrl(assetRecord): string
  
  // Management
  async deleteAsset(assetId)
  async clearNpcAssets(npcId)
  async clearAllAssets()
  
  // Manifest
  async getManifest(): AssetManifest
  async updateManifest(updates)
  
  // Slideshow
  async getSlideshowConfig(): SlideshowConfig
  async updateSlideshowConfig(config)
}

interface AssetRecord {
  id: string,
  category: 'portrait' | 'bodypart' | 'background' | 'slideshow',
  npcId: string | null,
  assetType: string,
  filename: string,
  mimeType: string,
  uploadedAt: Date
}

interface SlideshowConfig {
  enabled: boolean,
  interval: number,      // milliseconds
  transition: string,    // 'fade' | 'slide' | 'crossfade'
  transitionDuration: number,
  shuffle: boolean,
  backgrounds: string[]  // asset IDs
}
```

---

## 5. Data Structures

### 5.1 Configuration Files

#### 5.1.1 config.json

```json
{
  "stats": {
    "obedience": {
      "name": "Obedience",
      "description": "Internalized submission level",
      "min": 0,
      "max": 100,
      "start": 20,
      "color": "#ef4444"
    },
    "endurance": {
      "name": "Endurance",
      "description": "Fortitude against torment",
      "min": 0,
      "max": 100,
      "start": 50,
      "color": "#f59e0b"
    },
    "arousal": {
      "name": "Arousal",
      "description": "Desperation level",
      "min": 0,
      "max": 100,
      "start": 0,
      "color": "#ec4899"
    },
    "sensitivity": {
      "name": "Sensitivity",
      "description": "Nerve rawness amplifier",
      "min": 0,
      "max": 100,
      "start": 30,
      "color": "#3b82f6"
    }
  },
  "affinityTiers": [
    { "tier": "Devoted", "min": 50, "max": 100, "effect": "Intensified sadistic possession" },
    { "tier": "Pleased", "min": 20, "max": 49, "effect": "Teasing escalation" },
    { "tier": "Neutral", "min": 0, "max": 19, "effect": "Standard interactions" },
    { "tier": "Annoyed", "min": -29, "max": -1, "effect": "Mockery and dismissal" },
    { "tier": "Hostile", "min": -50, "max": -30, "effect": "Punishments and sabotage" },
    { "tier": "Enemy", "min": -100, "max": -51, "effect": "Active betrayals" }
  ],
  "toneRules": [
    {
      "axis": "Soft",
      "triggers": ["sandyAffinity > 60", "perfectSubmit", "mercyEvent"],
      "priority": 1
    },
    {
      "axis": "Neutral",
      "triggers": ["default"],
      "priority": 0
    },
    {
      "axis": "Aggressive",
      "triggers": ["endurance < 30", "defiance", "hostileCount >= 2"],
      "priority": 2
    },
    {
      "axis": "Swearing",
      "triggers": ["arousal > 80", "groupScene", "bullyingEvent"],
      "priority": 3
    },
    {
      "axis": "Humiliating",
      "triggers": ["obedience < 30", "hesitation", "enemyNpcs", "collapse"],
      "priority": 4
    }
  ],
  "emotionTypes": [
    "neutral", "smirk", "angry", "unimpressed", "mean", 
    "laugh", "pleased", "hostile", "amused", "teasing", 
    "cruel", "bored"
  ],
  "bodyPartTypes": [
    "feet", "armpit", "hands", "face_closeup", 
    "torso", "back", "legs", "full_body"
  ],
  "locations": [
    "main_hall", "classroom", "workout_pit", "chamber",
    "dormitory", "punishment_room", "garden", "dungeon"
  ]
}
```

#### 5.1.2 npcs.json

```json
{
  "npcs": [
    {
      "id": "sandy",
      "name": "Sandy",
      "title": "Head Mistress",
      "description": "Eternal domme, narrating with filthy glee",
      "startingAffinity": 10,
      "specialties": ["oversight", "narration", "discipline"],
      "perks": [],
      "weaknesses": [],
      "devotedBehavior": "Personal, intense attention with ownership claims"
    },
    {
      "id": "araph",
      "name": "Araph",
      "title": "The Tickle Queen",
      "description": "Blue-haired sadist with sharp nails and wicked laugh",
      "startingAffinity": 0,
      "specialties": ["tickling", "feathers", "fingers"],
      "targetAreas": ["feet", "ribs", "armpits"],
      "perks": ["Sadistic Monopoly"],
      "weaknesses": ["Hates being tickled back"],
      "devotedBehavior": "Pinning for endless tickling, mocking coos, raspberries and nibbles"
    },
    {
      "id": "nancy",
      "name": "Nancy",
      "title": "The Foot Goddess",
      "description": "Tall, athletic, barefoot or combat boots",
      "startingAffinity": 0,
      "specialties": ["foot_worship", "trampling", "smothering"],
      "targetAreas": ["feet", "face"],
      "perks": ["Foot Dominion"],
      "weaknesses": [],
      "devotedBehavior": "Grinding feet harder, prolonged smothering, toe-gagging"
    },
    {
      "id": "aish",
      "name": "Aish",
      "title": "The Sweat Sovereign",
      "description": "Curvy with post-workout glow",
      "startingAffinity": 0,
      "specialties": ["sweat_worship", "scent", "body_worship"],
      "targetAreas": ["armpit", "feet", "back"],
      "perks": ["Sweat Overlord"],
      "weaknesses": [],
      "devotedBehavior": "Extended smothering in sweaty spots, forced swallows"
    },
    {
      "id": "gaya",
      "name": "Gaya",
      "title": "The Edging Engineer",
      "description": "Soft-spoken but ruthless with hands and toys",
      "startingAffinity": 0,
      "specialties": ["edging", "denial", "teasing"],
      "targetAreas": ["full_body"],
      "perks": ["Edge Mastery"],
      "weaknesses": ["Praise buys micro-mercy"],
      "devotedBehavior": "Clinical endless edging, cold whispered denials"
    },
    {
      "id": "melissa",
      "name": "Melissa",
      "title": "The Post-Orgasm Punisher",
      "description": "Milks rare releases then tortures oversensitivity",
      "startingAffinity": 0,
      "specialties": ["post_orgasm_torture", "overstimulation"],
      "targetAreas": ["full_body"],
      "perks": ["Punishment Claim"],
      "weaknesses": [],
      "devotedBehavior": "Harsher POT sessions, slapping, immediate re-edging"
    }
  ]
}
```

#### 5.1.3 events.json

```json
{
  "events": [
    {
      "id": 1,
      "name": "Nancy's Bad Mood",
      "triggerBias": "High Arousal",
      "description": "Nancy is in a particularly foul mood today...",
      "effects": { "statChanges": { "obedience": -10 } }
    },
    {
      "id": 2,
      "name": "Group Foot Worship Mercy",
      "triggerBias": "Low Endurance",
      "description": "The group demands worship but shows unexpected mercy...",
      "effects": { 
        "statChanges": { "endurance": -8 },
        "conditionalAffinity": { "nancy": 3, "condition": "perfectSubmit" }
      }
    },
    {
      "id": 3,
      "name": "Melissa's Tease Skip",
      "triggerBias": "High Arousal",
      "description": "Melissa seems distracted, giving you a rare reprieve...",
      "effects": { "flags": { "freeDefy": true } }
    },
    {
      "id": 4,
      "name": "Aish's Salt Overload",
      "triggerBias": "Low Obedience",
      "description": "Aish has been working out extra hard...",
      "effects": { "statChanges": { "sensitivity": 10 } }
    },
    {
      "id": 5,
      "name": "Gaya's Marathon Edge",
      "triggerBias": "High Arousal",
      "description": "Gaya has cleared her schedule just for you...",
      "effects": { "statChanges": { "endurance": -12 } }
    },
    {
      "id": 6,
      "name": "Rivalry Flare: Melissa + Araph",
      "triggerBias": "Two Hostile NPCs",
      "description": "Melissa and Araph's rivalry spills onto you...",
      "effects": { 
        "statChanges": { "endurance": -15 },
        "flags": { "forcedPOTCombo": true }
      }
    },
    {
      "id": 7,
      "name": "Whispered Weakness",
      "triggerBias": "Araph Scene",
      "description": "You overhear something interesting...",
      "effects": { "flags": { "knowsAraphWeakness": true } }
    },
    {
      "id": 8,
      "name": "Leaked Soft Spot",
      "triggerBias": "Gaya Scene",
      "description": "A slip reveals useful information...",
      "effects": { "flags": { "knowsGayaWeakness": true } }
    },
    {
      "id": 9,
      "name": "Sweat Season Spike",
      "triggerBias": "Aish Lead",
      "description": "The heat is unbearable today...",
      "effects": { "flags": { "nextSweatBonus": 20 } }
    },
    {
      "id": 10,
      "name": "Forced Edge Party",
      "triggerBias": "Random",
      "description": "Gaya invites herself to the scene...",
      "effects": { "flags": { "gayaAutoJoin": true } }
    },
    {
      "id": 11,
      "name": "Tickle Overload",
      "triggerBias": "Araph Lead",
      "description": "Araph is feeling particularly sadistic...",
      "effects": { "statChanges": { "endurance": -10 } }
    },
    {
      "id": 12,
      "name": "Sandy's Mercy Window",
      "triggerBias": "Sandy Affinity > 40",
      "description": "Sandy seems pleased with you...",
      "effects": { "flags": { "nextDefyBonus": 5 } }
    },
    {
      "id": 13,
      "name": "Temporary Ally",
      "triggerBias": "Random",
      "description": "Gaya steps in unexpectedly...",
      "effects": { 
        "affinityChanges": { "gaya": 5 },
        "flags": { "blockOneTorment": true }
      }
    },
    {
      "id": 14,
      "name": "Headmistress Disapproval",
      "triggerBias": "Sandy Affinity Drop",
      "description": "Sandy's displeasure is palpable...",
      "effects": { "statChanges": { "endurance": -10 } }
    },
    {
      "id": 15,
      "name": "Workout Gang",
      "triggerBias": "Aish Lead",
      "description": "The workout group has plans for you...",
      "effects": { "flags": { "groupSweatWorship": true, "forcedEdge": true } }
    },
    {
      "id": 16,
      "name": "Post-Orgasm Surprise",
      "triggerBias": "Melissa Lead",
      "description": "Melissa has something special planned...",
      "effects": { "statChanges": { "endurance": -8 } }
    },
    {
      "id": 17,
      "name": "Pack Bullying",
      "triggerBias": "3+ Annoyed/Hostile NPCs",
      "description": "They've decided to gang up on you...",
      "effects": { "flags": { "allFivePileOn": true } }
    },
    {
      "id": 18,
      "name": "Sandy's Personal Touch",
      "triggerBias": "Random",
      "description": "Sandy takes personal interest...",
      "effects": { "statChanges": { "endurance": -20 } }
    },
    {
      "id": 19,
      "name": "Sensitivity Gift",
      "triggerBias": "High Sandy Affinity",
      "description": "A gift with strings attached...",
      "effects": { 
        "statChanges": { "sensitivity": 10 },
        "affinityChanges": { "sandy": 5 }
      }
    },
    {
      "id": 20,
      "name": "Jealous Aish",
      "triggerBias": "Melissa Scene",
      "description": "Aish doesn't like being ignored...",
      "effects": { 
        "statChanges": { "sensitivity": 10 },
        "affinityChanges": { "aish": -3 }
      }
    }
  ]
}
```

#### 5.1.4 assetManifest.json

```json
{
  "version": "1.0",
  "lastUpdated": null,
  "npcs": {
    "sandy": {
      "portraits": {
        "neutral": { "uploaded": false, "assetId": null },
        "smirk": { "uploaded": false, "assetId": null },
        "angry": { "uploaded": false, "assetId": null },
        "unimpressed": { "uploaded": false, "assetId": null },
        "mean": { "uploaded": false, "assetId": null },
        "laugh": { "uploaded": false, "assetId": null },
        "pleased": { "uploaded": false, "assetId": null },
        "hostile": { "uploaded": false, "assetId": null },
        "amused": { "uploaded": false, "assetId": null },
        "teasing": { "uploaded": false, "assetId": null },
        "cruel": { "uploaded": false, "assetId": null },
        "bored": { "uploaded": false, "assetId": null }
      },
      "bodyparts": {
        "feet": { "uploaded": false, "assetId": null },
        "armpit": { "uploaded": false, "assetId": null },
        "hands": { "uploaded": false, "assetId": null },
        "face_closeup": { "uploaded": false, "assetId": null },
        "torso": { "uploaded": false, "assetId": null },
        "back": { "uploaded": false, "assetId": null },
        "legs": { "uploaded": false, "assetId": null },
        "full_body": { "uploaded": false, "assetId": null }
      }
    }
  },
  "backgrounds": {
    "main_hall": { "uploaded": false, "assetId": null },
    "classroom": { "uploaded": false, "assetId": null },
    "workout_pit": { "uploaded": false, "assetId": null },
    "chamber": { "uploaded": false, "assetId": null },
    "dormitory": { "uploaded": false, "assetId": null },
    "punishment_room": { "uploaded": false, "assetId": null },
    "garden": { "uploaded": false, "assetId": null },
    "dungeon": { "uploaded": false, "assetId": null }
  },
  "slideshow": {
    "backgrounds": []
  }
}
```

### 5.2 Scenario JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "chapter": { "type": "number" },
    "scenes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "location": { "type": "string" },
          "npc": { "type": ["string", "null"] },
          "npcEmotion": { "type": "string" },
          "bodyPart": { "type": ["string", "null"] },
          "description": { "type": "string" },
          "toneOverride": { "type": ["string", "null"] },
          "choices": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "text": { "type": "string" },
                "next": { "type": ["string", "null"] },
                "statChanges": { "type": "object" },
                "affinityChanges": { "type": "object" },
                "rollRequired": {
                  "type": ["object", "null"],
                  "properties": {
                    "dc": { "type": "number" },
                    "stat": { "type": "string" },
                    "successNext": { "type": "string" },
                    "failureNext": { "type": "string" }
                  }
                },
                "flags": { "type": "object" }
              },
              "required": ["id", "text"]
            }
          },
          "eventRoll": { "type": "boolean" }
        },
        "required": ["id", "description", "choices"]
      }
    }
  },
  "required": ["id", "name", "scenes"]
}
```

---

## 6. UI/UX Design

### 6.1 Design System

#### 6.1.1 Color Palette

```css
:root {
  /* Background colors */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a24;
  --bg-elevated: #22222e;
  
  /* Accent colors */
  --accent-primary: #8b5cf6;
  --accent-secondary: #ec4899;
  --accent-success: #10b981;
  --accent-warning: #f59e0b;
  --accent-danger: #ef4444;
  
  /* Text colors */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-accent: #c4b5fd;
  
  /* Stat colors */
  --stat-obedience: #ef4444;
  --stat-endurance: #f59e0b;
  --stat-arousal: #ec4899;
  --stat-sensitivity: #3b82f6;
  
  /* Affinity tier colors */
  --affinity-devoted: #10b981;
  --affinity-pleased: #22c55e;
  --affinity-neutral: #6b7280;
  --affinity-annoyed: #f59e0b;
  --affinity-hostile: #ef4444;
  --affinity-enemy: #991b1b;
  
  /* Effects */
  --glow-primary: 0 0 20px rgba(139, 92, 246, 0.3);
  --glow-danger: 0 0 20px rgba(239, 68, 68, 0.3);
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.5);
}
```

#### 6.1.2 Typography

```css
:root {
  /* Font families */
  --font-heading: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-narrative: 'Crimson Text', Georgia, serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Font sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
}
```

#### 6.1.3 Spacing & Layout

```css
:root {
  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Z-index layers */
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-toast: 60;
  --z-slideshow: -1;
}
```

### 6.2 Layout Structure

#### 6.2.1 Main Game Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░ SLIDESHOW BACKGROUND (fullscreen) ░░░░░░░░░░░░░░░░░░░ │
│ ░                                                                          ░ │
│ ░  ┌────────────────────────────────────────────────────────────────────┐  ░ │
│ ░  │  HEADER                                                   [⚙ Admin]│  ░ │
│ ░  │  Logo | Game Title                                  Chapter 1 | T15│  ░ │
│ ░  └────────────────────────────────────────────────────────────────────┘  ░ │
│ ░                                                                          ░ │
│ ░  ┌──────────────────────────┬─────────────────────────────────────────┐  ░ │
│ ░  │                          │                                         │  ░ │
│ ░  │     VISUAL PANEL         │           NARRATIVE PANEL               │  ░ │
│ ░  │  ┌────────────────────┐  │  ┌─────────────────────────────────────┐│  ░ │
│ ░  │  │                    │  │  │                                     ││  ░ │
│ ░  │  │   Scene Background │  │  │  Story text with tone-based        ││  ░ │
│ ░  │  │        +           │  │  │  styling flows here...             ││  ░ │
│ ░  │  │   NPC Portrait     │  │  │                                     ││  ░ │
│ ░  │  │        or          │  │  │  Scrollable for long passages.     ││  ░ │
│ ░  │  │   Body Part View   │  │  │                                     ││  ░ │
│ ░  │  │                    │  │  └─────────────────────────────────────┘│  ░ │
│ ░  │  └────────────────────┘  │                                         │  ░ │
│ ░  │                          │           CHOICE PANEL                  │  ░ │
│ ░  │     DASHBOARD            │  ┌─────────────────────────────────────┐│  ░ │
│ ░  │  ┌────────────────────┐  │  │ 1. "Yes, Mistress..." (Submit)      ││  ░ │
│ ░  │  │ OBD ████████░░ 45  │  │  │ 2. "I refuse." (Defy - DC 15)       ││  ░ │
│ ░  │  │ END ██████████ 70  │  │  │ 3. Look at Araph                    ││  ░ │
│ ░  │  │ ARO ████░░░░░░ 20  │  │  │ 4. [Custom action...]               ││  ░ │
│ ░  │  │ SEN ██████░░░░ 40  │  │  └─────────────────────────────────────┘│  ░ │
│ ░  │  ├────────────────────┤  │  ┌─────────────────────────────────────┐│  ░ │
│ ░  │  │ Sandy    😏 +25    │  │  │ Type custom action...          [➤]  ││  ░ │
│ ░  │  │ Araph    😐  0     │  │  └─────────────────────────────────────┘│  ░ │
│ ░  │  │ Nancy    😤 -10    │  │                                         │  ░ │
│ ░  │  │ Aish     😊 +15    │  │                                         │  ░ │
│ ░  │  │ Gaya     😐  0     │  │                                         │  ░ │
│ ░  │  │ Melissa  😈 +5     │  │                                         │  ░ │
│ ░  │  └────────────────────┘  │                                         │  ░ │
│ ░  │                          │                                         │  ░ │
│ ░  └──────────────────────────┴─────────────────────────────────────────┘  ░ │
│ ░                                                                          ░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 6.2.2 Slideshow Background System

The slideshow background covers the entire viewport and sits behind all UI elements.

**Features:**
- Full viewport coverage (100vw × 100vh)
- Smooth crossfade transitions between images
- Configurable interval (default: 10 seconds)
- Configurable transition duration (default: 1.5 seconds)
- Optional shuffle mode
- Pause on hover (optional)
- Semi-transparent overlay to ensure text readability

**CSS Structure:**
```css
.slideshow-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: var(--z-slideshow);
  overflow: hidden;
}

.slideshow-image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity var(--slideshow-transition-duration) ease-in-out;
}

.slideshow-image.active {
  opacity: 1;
}

.slideshow-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 15, 0.7);
  pointer-events: none;
}
```

#### 6.2.3 Admin Panel Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ADMIN PANEL                                                    [✕ Close] │
├────────────────────────────────────────────────────────────────────────────┤
│  [Settings] [Assets] [JSON] [NPCs] [Events] [State] [Debug] [Logs]        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │                         TAB CONTENT AREA                             │ │
│  │                                                                      │ │
│  │    (Content varies based on selected tab)                            │ │
│  │                                                                      │ │
│  │                                                                      │ │
│  │                                                                      │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Component Specifications

#### 6.3.1 Dashboard Component

**Stats Display:**
- Horizontal progress bars with animated fill
- Stat name and value displayed
- Color-coded by stat type
- Glow effect when stat changes

**Affinity Display:**
- NPC name with emoji indicator
- Numeric value with +/- prefix
- Tier-colored background
- Tooltip with tier name on hover

#### 6.3.2 Dice Modal

**Animation Sequence:**
1. Modal backdrop fades in (200ms)
2. Dice appears at center, spinning (500ms)
3. Numbers cycle rapidly (1000ms)
4. Final number locks in with impact effect (300ms)
5. Modifiers slide in from right (200ms each)
6. Success/Failure banner appears (300ms)
7. Auto-dismiss after 2 seconds (or click)

#### 6.3.3 Narrative Panel

**Features:**
- Serif font for immersive reading
- Tone-based text styling (color, weight, size)
- Scrollable with custom scrollbar
- Text reveal animation (optional)
- Copy text button (discrete)

#### 6.3.4 Choice Panel

**Button States:**
- Default: Semi-transparent with border
- Hover: Accent glow, slight scale
- Disabled: Reduced opacity, no hover
- Roll Required: Dice icon + DC displayed

---

## 7. Asset Management

### 7.1 Asset Categories

| Category | Description | Storage |
|----------|-------------|---------|
| Portraits | Full NPC portraits per emotion | IndexedDB |
| Body Parts | Close-up views per NPC | IndexedDB |
| Scene Backgrounds | Location-specific backgrounds | IndexedDB |
| Slideshow Backgrounds | Custom fullscreen backgrounds | IndexedDB |
| UI Assets | Icons, dice faces, placeholders | Static files |

### 7.2 Supported Formats

| Format | Max Size | Recommended Resolution |
|--------|----------|------------------------|
| WebP | 5MB | 1920×1080 (backgrounds), 800×1200 (portraits) |
| PNG | 5MB | Same as above |
| JPEG | 5MB | Same as above |
| GIF | 2MB | For animated elements only |

### 7.3 Asset Manager Admin Tab

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ASSET MANAGER                                              [Upload All]   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─ NPC ASSETS ─────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  NPC: [Sandy ▼]                                                      │ │
│  │                                                                      │ │
│  │  FULL PORTRAITS                                         [Clear All]  │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │ │
│  │  │ neutral │ │  smirk  │ │  angry  │ │  mean   │ │  laugh  │  ...   │ │
│  │  │  [img]  │ │  [img]  │ │ [placeholder] │ │  [img]  │ │ [placeholder] │        │ │
│  │  │ [✓][✕]  │ │ [✓][✕]  │ │   [+]   │ │ [✓][✕]  │ │   [+]   │        │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │ │
│  │                                                                      │ │
│  │  BODY PARTS                                             [Clear All]  │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │ │
│  │  │  feet   │ │ armpit  │ │  hands  │ │  face   │ │  torso  │  ...   │ │
│  │  │  [img]  │ │ [placeholder] │ │ [placeholder] │ │  [img]  │ │ [placeholder] │        │ │
│  │  │ [✓][✕]  │ │   [+]   │ │   [+]   │ │ [✓][✕]  │ │   [+]   │        │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─ SCENE BACKGROUNDS ──────────────────────────────────────────────────┐ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                     │ │
│  │  │main_hall│ │classroom│ │   pit   │ │ chamber │  ...                │ │
│  │  │  [img]  │ │  [img]  │ │ [placeholder] │ │ [placeholder] │                     │ │
│  │  │ [✓][✕]  │ │ [✓][✕]  │ │   [+]   │ │   [+]   │                     │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘                     │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─ SLIDESHOW BACKGROUNDS ──────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  [+ Add Background]                      Interval: [10] seconds      │ │
│  │                                          Transition: [Crossfade ▼]   │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐    Duration: [1.5] seconds     │ │
│  │  │  bg_1   │ │  bg_2   │ │  bg_3   │    [☑] Shuffle                 │ │
│  │  │  [img]  │ │  [img]  │ │  [img]  │                                 │ │
│  │  │ [↑][↓][✕]│ │ [↑][↓][✕]│ │ [↑][↓][✕]│    [▶ Preview Slideshow]      │ │
│  │  └─────────┘ └─────────┘ └─────────┘                                 │ │
│  │                                                                      │ │
│  │  [☑] Enable Slideshow Background                                    │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Placeholder System

When an asset is not uploaded, a placeholder is displayed:

- **Portraits:** Silhouette with NPC-colored accent border
- **Body Parts:** Generic outline icon
- **Backgrounds:** Dark gradient with location name text
- **Slideshow:** Disabled if no images uploaded

---

## 8. API Integration

### 8.1 NanoGPT Configuration

**Endpoint:** `https://nano-gpt.com/api/v1/chat/completions`

**Request Format:**
```javascript
{
  model: "chatgpt-4o-latest",  // configurable
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
    // ... history
  ],
  stream: true,
  max_tokens: 1000,
  temperature: 0.8
}
```

**Response Handling:**
- Streaming: Process chunks via SSE
- Non-streaming: Parse JSON response
- Error handling: Retry with exponential backoff

### 8.2 System Prompt Template

```
You are the game master for an adult text-based RPG. You narrate scenarios 
and provide choices for the player.

CURRENT GAME STATE:
- Stats: Obedience {obedience}, Endurance {endurance}, Arousal {arousal}, Sensitivity {sensitivity}
- Current NPC: {currentNpc} (Affinity: {affinity}, Tier: {tier})
- Location: {location}
- Active Tone: {tone}
- Recent Events: {recentEvents}

NPC PROFILES:
{npcProfiles}

TONE GUIDELINES:
{toneGuidelines}

RESPONSE FORMAT:
Provide a narrative description (200-400 words) followed by 3-5 choices.
Format choices as:
1. "Choice text" (Action type)
2. "Choice text" [Requires: DC {dc} {stat} check]
...

Include NPC emotion indicators: [emotion:pleased], [bodypart:feet], etc.
```

### 8.3 Context Management

**Full Chapter Mode (Default):**
- Include all turns from current chapter
- Summarize if exceeds token limit

**Last N Turns Mode:**
- Include only last N turns verbatim
- Configurable N (default: 10)

**Token Budget Mode:**
- Fit as many recent turns as possible
- Hard limit on total tokens

**Smart Summary Mode:**
- Summarize older turns
- Keep recent 5 turns verbatim

---

## 9. File Structure

```
E:\Repositories\tckl_game\
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Template for .env
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
│
├── public/
│   └── favicon.ico
│
└── src/
    ├── main.jsx                  # React entry point
    ├── App.jsx                   # Root component
    │
    ├── config/
    │   └── env.js                # Environment config loader
    │
    ├── engine/
    │   ├── GameEngine.js         # Main game loop
    │   ├── StateManager.js       # State management
    │   ├── DiceSystem.js         # Dice mechanics
    │   ├── EventSystem.js        # Event handling
    │   ├── ToneEngine.js         # Tone computation
    │   ├── CommandManager.js     # Game commands
    │   └── SaveSystem.js         # Persistence
    │
    ├── content/
    │   ├── ContentRouter.js      # Content mode router
    │   ├── ScenarioLoader.js     # JSON loader
    │   ├── NanoGPTClient.js      # API client
    │   └── PromptBuilder.js      # Prompt construction
    │
    ├── services/
    │   └── AssetService.js       # Asset storage (IndexedDB)
    │
    ├── components/
    │   ├── layout/
    │   │   ├── GameScreen.jsx    # Main game container
    │   │   ├── Header.jsx        # Top bar
    │   │   └── SplitLayout.jsx   # Two-column layout
    │   │
    │   ├── game/
    │   │   ├── Dashboard.jsx     # Stats & affinities
    │   │   ├── NarrativePanel.jsx# Story display
    │   │   ├── ChoicePanel.jsx   # Choices & input
    │   │   ├── CharacterPanel.jsx# NPC display
    │   │   └── DiceModal.jsx     # Roll animation
    │   │
    │   ├── visuals/
    │   │   ├── SlideshowBackground.jsx  # Fullscreen slideshow
    │   │   ├── BackgroundLayer.jsx      # Scene background
    │   │   ├── CharacterPortrait.jsx    # NPC portrait
    │   │   ├── BodyPartDisplay.jsx      # Body part view
    │   │   ├── DiceRenderer.jsx         # Dice animation
    │   │   └── EffectsOverlay.jsx       # Visual effects
    │   │
    │   ├── ui/
    │   │   ├── StatBar.jsx       # Progress bar
    │   │   ├── AffinityBadge.jsx # NPC affinity display
    │   │   ├── Button.jsx        # Styled button
    │   │   ├── Modal.jsx         # Modal wrapper
    │   │   ├── Tabs.jsx          # Tab component
    │   │   ├── Toast.jsx         # Notifications
    │   │   ├── Dropdown.jsx      # Select dropdown
    │   │   └── Input.jsx         # Text input
    │   │
    │   ├── menu/
    │   │   └── MenuOverlay.jsx   # Game menu
    │   │
    │   └── admin/
    │       ├── AdminPanel.jsx    # Admin container
    │       ├── tabs/
    │       │   ├── SettingsTab.jsx       # Settings
    │       │   ├── AssetManagerTab.jsx   # Asset uploads
    │       │   ├── JsonManagerTab.jsx    # Scenario management
    │       │   ├── NpcEditorTab.jsx      # NPC editing
    │       │   ├── EventEditorTab.jsx    # Event editing
    │       │   └── DebugTab.jsx          # Debug tools
    │       ├── assets/
    │       │   ├── AssetGrid.jsx         # Grid of slots
    │       │   ├── AssetSlot.jsx         # Upload slot
    │       │   ├── UploadDropzone.jsx    # Drag & drop
    │       │   ├── AssetPreview.jsx      # Preview modal
    │       │   └── SlideshowManager.jsx  # Slideshow config
    │       ├── StateInspector.jsx        # State viewer
    │       └── LogViewer.jsx             # Log display
    │
    ├── hooks/
    │   ├── useGameState.js       # Game state hook
    │   ├── useNanoGPT.js         # API hook
    │   ├── useSettings.js        # Settings hook
    │   ├── useAssets.js          # Asset hook
    │   └── useSlideshow.js       # Slideshow hook
    │
    ├── data/
    │   ├── config.json           # Game configuration
    │   ├── npcs.json             # NPC data
    │   ├── events.json           # Event table
    │   ├── assetManifest.json    # Asset tracking
    │   └── scenarios/            # Scenario files
    │       └── .gitkeep
    │
    ├── assets/
    │   ├── placeholders/
    │   │   ├── portrait.svg
    │   │   ├── bodypart.svg
    │   │   └── background.svg
    │   └── ui/
    │       ├── dice/
    │       │   └── d20.svg
    │       └── icons/
    │           └── .gitkeep
    │
    └── styles/
        ├── index.css             # Tailwind imports
        └── tokens.css            # CSS variables
```

---

## 10. Configuration

### 10.1 Environment Variables

**.env:**
```bash
# NanoGPT API
VITE_NANOGPT_API_KEY=your_api_key_here
VITE_NANOGPT_BASE_URL=https://nano-gpt.com/api/v1
VITE_NANOGPT_MODEL=chatgpt-4o-latest

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_LOGGING=true
```

**.env.example:**
```bash
# NanoGPT API
VITE_NANOGPT_API_KEY=
VITE_NANOGPT_BASE_URL=https://nano-gpt.com/api/v1
VITE_NANOGPT_MODEL=chatgpt-4o-latest

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_LOGGING=true
```

### 10.2 Tailwind Configuration

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#1a1a24',
          elevated: '#22222e',
        },
        accent: {
          primary: '#8b5cf6',
          secondary: '#ec4899',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
        stat: {
          obedience: '#ef4444',
          endurance: '#f59e0b',
          arousal: '#ec4899',
          sensitivity: '#3b82f6',
        },
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        narrative: ['Crimson Text', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'dice-spin': 'spin 0.5s ease-out',
        'dice-bounce': 'bounce 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
```

### 10.3 Vite Configuration

**vite.config.js:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@engine': '/src/engine',
      '@content': '/src/content',
      '@hooks': '/src/hooks',
      '@services': '/src/services',
      '@data': '/src/data',
      '@assets': '/src/assets',
    },
  },
})
```

---

## 11. Implementation Phases

### Phase 1: Foundation (Week 1)

**Goals:**
- Project setup with all dependencies
- Basic file structure
- Core engine modules (StateManager, DiceSystem)
- Basic UI shell (GameScreen, Dashboard)

**Deliverables:**
- [ ] Vite + React + Tailwind configured
- [ ] Environment variables set up
- [ ] StateManager with stat/affinity tracking
- [ ] DiceSystem with basic rolls
- [ ] Dashboard displaying stats
- [ ] Placeholder UI layout

### Phase 2: Content System (Week 2)

**Goals:**
- ScenarioLoader for JSON parsing
- NanoGPTClient for AI integration
- ContentRouter with mode switching
- PromptBuilder for context management

**Deliverables:**
- [ ] JSON scenario loading and validation
- [ ] NanoGPT API integration with streaming
- [ ] Hybrid content mode working
- [ ] Context management (full chapter default)

### Phase 3: Visual System (Week 3)

**Goals:**
- Asset management with IndexedDB
- Portrait and body part display
- Background system
- Slideshow background with configuration

**Deliverables:**
- [ ] AssetService with full CRUD
- [ ] Asset Manager admin tab
- [ ] CharacterPortrait with emotion switching
- [ ] SlideshowBackground with transitions
- [ ] Placeholder system

### Phase 4: Game Loop (Week 4)

**Goals:**
- Complete GameEngine
- EventSystem integration
- ToneEngine implementation
- Save/Load functionality

**Deliverables:**
- [ ] Full turn processing
- [ ] Random events triggering
- [ ] Tone-based narrative styling
- [ ] LocalStorage persistence
- [ ] Game commands (Start/Save/Load/etc.)

### Phase 5: Admin & Polish (Week 5)

**Goals:**
- Complete admin panel
- All editor tabs functional
- Dice animations
- Visual effects
- Bug fixes and optimization

**Deliverables:**
- [ ] Settings tab with all options
- [ ] NPC and Event editors
- [ ] Debug console
- [ ] Log viewer
- [ ] Smooth animations
- [ ] Performance optimization

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Affinity | NPC relationship score (-50 to +100) |
| Chapter | Major story segment |
| DC | Difficulty Class for dice rolls |
| NPC | Non-Player Character (the 6 dommes) |
| POT | Post-Orgasm Torture |
| Scenario | Pre-written story content in JSON |
| Tone | Narrative style (Soft, Neutral, Aggressive, etc.) |
| Turn | Single player action + response cycle |

---

## Appendix B: Admin Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Content Mode | enum | hybrid | json-only, ai-only, hybrid |
| AI Model | string | chatgpt-4o-latest | NanoGPT model ID |
| Context Mode | enum | full-chapter | Context window strategy |
| Context Limit | number | null | Limit for last-n or token-budget modes |
| Stream Responses | boolean | true | Enable streaming AI responses |
| Enable Backgrounds | boolean | true | Show scene backgrounds |
| Enable Portraits | boolean | true | Show NPC portraits |
| Enable Dice Animation | boolean | true | Animate dice rolls |
| Enable Effects | boolean | true | Show visual effects |
| Enable Slideshow | boolean | true | Enable background slideshow |
| Slideshow Interval | number | 10000 | Milliseconds between slides |
| Slideshow Transition | enum | crossfade | Transition type |
| Transition Duration | number | 1500 | Transition time in ms |
| Shuffle Slideshow | boolean | false | Randomize slide order |
| Debug Overlay | boolean | false | Show state debug overlay |
| Log API Calls | boolean | true | Log AI requests/responses |
| Log Dice Rolls | boolean | true | Log roll history |

---

**Document End**
