import { getDB } from '../config/db.js'

const COLLECTION = 'knowledge'

// Default structure for new save slots
const createDefaultKnowledge = (saveSlotId) => ({
  saveSlotId,
  
  // What TJ knows
  tjKnowledge: {
    npcs: {
      sandy: { tier: 'unknown', firstMetTurn: null, lastInteractionTurn: null, encounterCount: 0, secrets: [], facts: [], learnedTraits: [] },
      araph: { tier: 'unknown', firstMetTurn: null, lastInteractionTurn: null, encounterCount: 0, secrets: [], facts: [], learnedTraits: [] },
      nancy: { tier: 'unknown', firstMetTurn: null, lastInteractionTurn: null, encounterCount: 0, secrets: [], facts: [], learnedTraits: [] },
      aish: { tier: 'unknown', firstMetTurn: null, lastInteractionTurn: null, encounterCount: 0, secrets: [], facts: [], learnedTraits: [] },
      gaya: { tier: 'unknown', firstMetTurn: null, lastInteractionTurn: null, encounterCount: 0, secrets: [], facts: [], learnedTraits: [] },
      melissa: { tier: 'unknown', firstMetTurn: null, lastInteractionTurn: null, encounterCount: 0, secrets: [], facts: [], learnedTraits: [] }
    },
    locations: {
      starting_room: { status: 'familiar', firstVisitTurn: 1, visitCount: 1 },
      main_hall: { status: 'undiscovered', firstVisitTurn: null, visitCount: 0 },
      classroom: { status: 'undiscovered', firstVisitTurn: null, visitCount: 0 },
      workout_pit: { status: 'undiscovered', firstVisitTurn: null, visitCount: 0 },
      chamber: { status: 'undiscovered', firstVisitTurn: null, visitCount: 0 },
      dormitory: { status: 'undiscovered', firstVisitTurn: null, visitCount: 0 },
      punishment_room: { status: 'undiscovered', firstVisitTurn: null, visitCount: 0 },
      garden: { status: 'undiscovered', firstVisitTurn: null, visitCount: 0 },
      dungeon: { status: 'undiscovered', firstVisitTurn: null, visitCount: 0 }
    },
    worldFacts: []
  },

  // What each NPC knows about TJ
  npcKnowledgeOfTJ: {
    sandy: { directExperience: [], gossipReceived: [], impression: 'unknown', knownTraits: [], lastDirectTurn: null, lastGossipTurn: null },
    araph: { directExperience: [], gossipReceived: [], impression: 'unknown', knownTraits: [], lastDirectTurn: null, lastGossipTurn: null },
    nancy: { directExperience: [], gossipReceived: [], impression: 'unknown', knownTraits: [], lastDirectTurn: null, lastGossipTurn: null },
    aish: { directExperience: [], gossipReceived: [], impression: 'unknown', knownTraits: [], lastDirectTurn: null, lastGossipTurn: null },
    gaya: { directExperience: [], gossipReceived: [], impression: 'unknown', knownTraits: [], lastDirectTurn: null, lastGossipTurn: null },
    melissa: { directExperience: [], gossipReceived: [], impression: 'unknown', knownTraits: [], lastDirectTurn: null, lastGossipTurn: null }
  },

  // What NPCs know about each other
  npcKnowledgeOfNpcs: {
    sandy: {
      araph: { relationship: 'subordinate', knownTraits: ['sadistic', 'loves_tickling'], knownSecrets: [], trust: 75, lastInteractionTurn: null },
      nancy: { relationship: 'subordinate', knownTraits: ['athletic', 'foot_obsessed'], knownSecrets: [], trust: 70, lastInteractionTurn: null },
      aish: { relationship: 'subordinate', knownTraits: ['dedicated', 'sweat_focused'], knownSecrets: [], trust: 85, lastInteractionTurn: null },
      gaya: { relationship: 'subordinate', knownTraits: ['methodical', 'patient'], knownSecrets: [], trust: 80, lastInteractionTurn: null },
      melissa: { relationship: 'subordinate', knownTraits: ['cruel', 'persistent'], knownSecrets: [], trust: 65, lastInteractionTurn: null }
    },
    araph: {
      sandy: { relationship: 'boss', knownTraits: ['strict', 'powerful'], knownSecrets: [], trust: 80, lastInteractionTurn: null },
      nancy: { relationship: 'rival', knownTraits: ['athletic'], knownSecrets: [], trust: 40, lastInteractionTurn: null },
      aish: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 50, lastInteractionTurn: null },
      gaya: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 45, lastInteractionTurn: null },
      melissa: { relationship: 'ally', knownTraits: ['cruel'], knownSecrets: [], trust: 70, lastInteractionTurn: null }
    },
    nancy: {
      sandy: { relationship: 'boss', knownTraits: ['strict'], knownSecrets: [], trust: 75, lastInteractionTurn: null },
      araph: { relationship: 'rival', knownTraits: ['annoying'], knownSecrets: [], trust: 35, lastInteractionTurn: null },
      aish: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 55, lastInteractionTurn: null },
      gaya: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 50, lastInteractionTurn: null },
      melissa: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 45, lastInteractionTurn: null }
    },
    aish: {
      sandy: { relationship: 'boss', knownTraits: ['respected'], knownSecrets: [], trust: 90, lastInteractionTurn: null },
      araph: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 50, lastInteractionTurn: null },
      nancy: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 55, lastInteractionTurn: null },
      gaya: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 60, lastInteractionTurn: null },
      melissa: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 50, lastInteractionTurn: null }
    },
    gaya: {
      sandy: { relationship: 'boss', knownTraits: ['demanding'], knownSecrets: [], trust: 70, lastInteractionTurn: null },
      araph: { relationship: 'peer', knownTraits: ['loud'], knownSecrets: [], trust: 40, lastInteractionTurn: null },
      nancy: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 45, lastInteractionTurn: null },
      aish: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 55, lastInteractionTurn: null },
      melissa: { relationship: 'ally', knownTraits: ['scheming'], knownSecrets: [], trust: 65, lastInteractionTurn: null }
    },
    melissa: {
      sandy: { relationship: 'boss', knownTraits: ['watchful'], knownSecrets: [], trust: 65, lastInteractionTurn: null },
      araph: { relationship: 'ally', knownTraits: ['fun'], knownSecrets: [], trust: 70, lastInteractionTurn: null },
      nancy: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 40, lastInteractionTurn: null },
      aish: { relationship: 'peer', knownTraits: [], knownSecrets: [], trust: 45, lastInteractionTurn: null },
      gaya: { relationship: 'ally', knownTraits: ['clever'], knownSecrets: [], trust: 65, lastInteractionTurn: null }
    }
  },

  // Gossip activity log
  gossipLog: [],

  createdAt: new Date(),
  updatedAt: new Date()
})

// ═══════════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════

export async function getKnowledge(saveSlotId) {
  const db = getDB()
  let knowledge = await db.collection(COLLECTION).findOne({ saveSlotId })
  
  if (!knowledge) {
    knowledge = createDefaultKnowledge(saveSlotId)
    await db.collection(COLLECTION).insertOne(knowledge)
  }
  
  return knowledge
}

export async function resetKnowledge(saveSlotId) {
  const db = getDB()
  const knowledge = createDefaultKnowledge(saveSlotId)
  
  await db.collection(COLLECTION).replaceOne(
    { saveSlotId },
    knowledge,
    { upsert: true }
  )
  
  return knowledge
}

export async function deleteKnowledge(saveSlotId) {
  const db = getDB()
  const result = await db.collection(COLLECTION).deleteOne({ saveSlotId })
  return { deleted: result.deletedCount > 0 }
}

// ═══════════════════════════════════════════════════════════════════
// TJ KNOWLEDGE OPERATIONS
// ═══════════════════════════════════════════════════════════════════

export async function updateTJNpcKnowledge(saveSlotId, npcId, updates) {
  const db = getDB()
  const knowledge = await getKnowledge(saveSlotId)
  
  const current = knowledge.tjKnowledge.npcs[npcId]
  if (!current) return null
  
  let newTier = current.tier
  const newEncounterCount = (current.encounterCount || 0) + 1
  
  if (current.tier === 'unknown') {
    newTier = 'met'
  } else if (current.tier === 'met' && newEncounterCount >= 3) {
    newTier = 'familiar'
  } else if (current.tier === 'familiar' && (updates.secrets?.length > 0 || newEncounterCount >= 10)) {
    newTier = 'intimate'
  }
  
  const updateObj = {
    [`tjKnowledge.npcs.${npcId}.tier`]: newTier,
    [`tjKnowledge.npcs.${npcId}.encounterCount`]: newEncounterCount,
    [`tjKnowledge.npcs.${npcId}.lastInteractionTurn`]: updates.turn,
    'updatedAt': new Date()
  }
  
  if (!current.firstMetTurn) {
    updateObj[`tjKnowledge.npcs.${npcId}.firstMetTurn`] = updates.turn
  }
  
  if (updates.traits?.length > 0) {
    const existingTraits = current.learnedTraits || []
    updateObj[`tjKnowledge.npcs.${npcId}.learnedTraits`] = [...new Set([...existingTraits, ...updates.traits])]
  }
  
  if (updates.facts?.length > 0) {
    const existingFacts = current.facts || []
    updateObj[`tjKnowledge.npcs.${npcId}.facts`] = [...new Set([...existingFacts, ...updates.facts])]
  }
  
  if (updates.secrets?.length > 0) {
    const existingSecrets = current.secrets || []
    updateObj[`tjKnowledge.npcs.${npcId}.secrets`] = [...new Set([...existingSecrets, ...updates.secrets])]
  }
  
  await db.collection(COLLECTION).updateOne({ saveSlotId }, { $set: updateObj })
  
  return {
    npcId,
    previousTier: current.tier,
    newTier,
    encounterCount: newEncounterCount,
    tierChanged: current.tier !== newTier
  }
}

export async function makeTJAwareOfNpc(saveSlotId, npcId, turn) {
  const db = getDB()
  const knowledge = await getKnowledge(saveSlotId)
  
  const current = knowledge.tjKnowledge.npcs[npcId]
  if (!current || current.tier !== 'unknown') return null
  
  await db.collection(COLLECTION).updateOne(
    { saveSlotId },
    {
      $set: {
        [`tjKnowledge.npcs.${npcId}.tier`]: 'aware',
        'updatedAt': new Date()
      }
    }
  )
  
  return { npcId, newTier: 'aware' }
}

export async function updateTJLocationKnowledge(saveSlotId, locationId, turn) {
  const db = getDB()
  const knowledge = await getKnowledge(saveSlotId)
  
  const current = knowledge.tjKnowledge.locations[locationId]
  if (!current) return null
  
  let newStatus = current.status
  const newVisitCount = (current.visitCount || 0) + 1
  
  if (current.status === 'undiscovered' || current.status === 'heard_of') {
    newStatus = 'visited'
  } else if (current.status === 'visited' && newVisitCount >= 3) {
    newStatus = 'familiar'
  }
  
  const updateObj = {
    [`tjKnowledge.locations.${locationId}.status`]: newStatus,
    [`tjKnowledge.locations.${locationId}.visitCount`]: newVisitCount,
    'updatedAt': new Date()
  }
  
  if (!current.firstVisitTurn) {
    updateObj[`tjKnowledge.locations.${locationId}.firstVisitTurn`] = turn
  }
  
  await db.collection(COLLECTION).updateOne({ saveSlotId }, { $set: updateObj })
  
  return {
    locationId,
    previousStatus: current.status,
    newStatus,
    visitCount: newVisitCount,
    statusChanged: current.status !== newStatus
  }
}

export async function addTJWorldFact(saveSlotId, fact) {
  const db = getDB()
  
  await db.collection(COLLECTION).updateOne(
    { saveSlotId },
    {
      $addToSet: { 'tjKnowledge.worldFacts': fact },
      $set: { 'updatedAt': new Date() }
    }
  )
  
  return { fact, added: true }
}

// ═══════════════════════════════════════════════════════════════════
// NPC KNOWLEDGE OF TJ OPERATIONS
// ═══════════════════════════════════════════════════════════════════

function calculateImpression(traits) {
  const positive = ['obedient', 'eager', 'compliant', 'skilled', 'resilient', 'devoted', 'worshipful']
  const negative = ['defiant', 'lazy', 'weak', 'pathetic', 'disobedient', 'rebellious', 'stubborn']
  
  let score = 0
  for (const trait of traits) {
    if (positive.includes(trait)) score += 1
    if (negative.includes(trait)) score -= 1
  }
  
  if (score >= 3) return 'prized'
  if (score >= 1) return 'promising'
  if (score === 0) return 'neutral'
  if (score >= -2) return 'disappointing'
  return 'worthless'
}

export async function addNpcDirectExperience(saveSlotId, npcId, experience) {
  const db = getDB()
  
  const experienceRecord = {
    eventId: experience.eventId || `exp_${Date.now()}`,
    turn: experience.turn,
    summary: experience.summary,
    tags: experience.tags || [],
    intensity: experience.intensity || 5,
    location: experience.location,
    fetishes: experience.fetishes || []
  }
  
  const knowledge = await getKnowledge(saveSlotId)
  const existingTraits = knowledge.npcKnowledgeOfTJ[npcId]?.knownTraits || []
  const newTraits = [...new Set([...existingTraits, ...experienceRecord.tags])]
  const impression = calculateImpression(newTraits)
  
  await db.collection(COLLECTION).updateOne(
    { saveSlotId },
    {
      $push: { [`npcKnowledgeOfTJ.${npcId}.directExperience`]: experienceRecord },
      $set: {
        [`npcKnowledgeOfTJ.${npcId}.knownTraits`]: newTraits,
        [`npcKnowledgeOfTJ.${npcId}.impression`]: impression,
        [`npcKnowledgeOfTJ.${npcId}.lastDirectTurn`]: experience.turn,
        'updatedAt': new Date()
      }
    }
  )
  
  return { npcId, experience: experienceRecord, impression }
}

// ═══════════════════════════════════════════════════════════════════
// GOSSIP OPERATIONS
// ═══════════════════════════════════════════════════════════════════

const GOSSIP_PROFILES = {
  sandy: { style: 'strategic', likelihood: 0.3, sharesTo: ['araph', 'nancy', 'aish', 'gaya', 'melissa'] },
  araph: { style: 'braggart', likelihood: 0.7, sharesTo: ['sandy', 'nancy', 'melissa'] },
  nancy: { style: 'competitive', likelihood: 0.5, sharesTo: ['sandy', 'araph'] },
  aish: { style: 'professional', likelihood: 0.4, sharesTo: ['sandy'] },
  gaya: { style: 'secretive', likelihood: 0.1, sharesTo: [] },
  melissa: { style: 'scheming', likelihood: 0.5, sharesTo: ['araph', 'gaya'] }
}

function generateGossipSummary(fromNpc, experience, style) {
  const templates = {
    braggart: [`${fromNpc} brags about ${experience.summary}`, `${fromNpc} boasts: "${experience.summary}"`],
    strategic: [`${fromNpc} mentions ${experience.summary}`, `${fromNpc} shares intel: ${experience.summary}`],
    competitive: [`${fromNpc} compares notes about ${experience.summary}`],
    professional: [`${fromNpc} reports: ${experience.summary}`],
    scheming: [`${fromNpc} whispers about ${experience.summary}`],
    secretive: [`${fromNpc} reluctantly mentions ${experience.summary}`]
  }
  
  const styleTemplates = templates[style] || templates.strategic
  return styleTemplates[Math.floor(Math.random() * styleTemplates.length)]
}

function generateWitnessDescription(fromNpc, toNpc) {
  const descriptions = [
    `You notice ${fromNpc} whispering to ${toNpc}, both glancing your way`,
    `${fromNpc} leans close to ${toNpc}, gesturing in your direction`,
    `You catch ${fromNpc} and ${toNpc} exchanging knowing looks about you`,
    `${fromNpc} murmurs something to ${toNpc}, who smirks at you`
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

export async function processGossip(saveSlotId, presentNpcs, turn, tjWitnessed = true) {
  const db = getDB()
  const knowledge = await getKnowledge(saveSlotId)
  const gossipEvents = []
  
  for (const fromNpc of presentNpcs) {
    for (const toNpc of presentNpcs) {
      if (fromNpc === toNpc) continue
      
      const profile = GOSSIP_PROFILES[fromNpc]
      if (!profile || !profile.sharesTo.includes(toNpc)) continue
      
      const fromKnowledge = knowledge.npcKnowledgeOfTJ[fromNpc]
      if (!fromKnowledge?.directExperience?.length) continue
      
      const toKnowledge = knowledge.npcKnowledgeOfTJ[toNpc]
      const alreadyKnownEventIds = new Set([
        ...(toKnowledge?.directExperience?.map(e => e.eventId) || []),
        ...(toKnowledge?.gossipReceived?.map(g => g.aboutEventId) || [])
      ])
      
      const unsharedExperiences = fromKnowledge.directExperience.filter(
        exp => !alreadyKnownEventIds.has(exp.eventId)
      )
      
      if (unsharedExperiences.length === 0) continue
      if (Math.random() > profile.likelihood) continue
      
      const experience = unsharedExperiences[unsharedExperiences.length - 1]
      
      const gossipRecord = {
        id: `gossip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        turn,
        type: 'about_tj',
        fromNpc,
        toNpc,
        subject: 'tj',
        aboutEventId: experience.eventId,
        summary: generateGossipSummary(fromNpc, experience, profile.style),
        tags: experience.tags,
        tjWitnessed,
        witnessDescription: tjWitnessed ? generateWitnessDescription(fromNpc, toNpc) : null
      }
      
      gossipEvents.push(gossipRecord)
    }
  }
  
  for (const gossip of gossipEvents) {
    await db.collection(COLLECTION).updateOne(
      { saveSlotId },
      { $push: { 'gossipLog': gossip } }
    )
    
    const toNpcKnowledge = knowledge.npcKnowledgeOfTJ[gossip.toNpc]
    const existingTraits = toNpcKnowledge?.knownTraits || []
    const newTraits = [...new Set([...existingTraits, ...gossip.tags])]
    const impression = calculateImpression(newTraits)
    
    await db.collection(COLLECTION).updateOne(
      { saveSlotId },
      {
        $push: {
          [`npcKnowledgeOfTJ.${gossip.toNpc}.gossipReceived`]: {
            id: gossip.id,
            fromNpc: gossip.fromNpc,
            turn: gossip.turn,
            aboutEventId: gossip.aboutEventId,
            summary: gossip.summary,
            tags: gossip.tags,
            tjWitnessed: gossip.tjWitnessed
          }
        },
        $set: {
          [`npcKnowledgeOfTJ.${gossip.toNpc}.knownTraits`]: newTraits,
          [`npcKnowledgeOfTJ.${gossip.toNpc}.impression`]: impression,
          [`npcKnowledgeOfTJ.${gossip.toNpc}.lastGossipTurn`]: gossip.turn,
          'updatedAt': new Date()
        }
      }
    )
  }
  
  return gossipEvents
}

// ═══════════════════════════════════════════════════════════════════
// NPC-TO-NPC KNOWLEDGE OPERATIONS
// ═══════════════════════════════════════════════════════════════════

export async function updateNpcToNpcKnowledge(saveSlotId, observerNpc, subjectNpc, updates) {
  const db = getDB()
  const updateObj = { 'updatedAt': new Date() }
  
  if (updates.traits?.length > 0) {
    const knowledge = await getKnowledge(saveSlotId)
    const existing = knowledge.npcKnowledgeOfNpcs[observerNpc]?.[subjectNpc]?.knownTraits || []
    updateObj[`npcKnowledgeOfNpcs.${observerNpc}.${subjectNpc}.knownTraits`] = [...new Set([...existing, ...updates.traits])]
  }
  
  if (updates.secrets?.length > 0) {
    const knowledge = await getKnowledge(saveSlotId)
    const existing = knowledge.npcKnowledgeOfNpcs[observerNpc]?.[subjectNpc]?.knownSecrets || []
    updateObj[`npcKnowledgeOfNpcs.${observerNpc}.${subjectNpc}.knownSecrets`] = [...new Set([...existing, ...updates.secrets])]
  }
  
  if (updates.trust !== undefined) {
    updateObj[`npcKnowledgeOfNpcs.${observerNpc}.${subjectNpc}.trust`] = updates.trust
  }
  
  if (updates.turn) {
    updateObj[`npcKnowledgeOfNpcs.${observerNpc}.${subjectNpc}.lastInteractionTurn`] = updates.turn
  }
  
  await db.collection(COLLECTION).updateOne({ saveSlotId }, { $set: updateObj })
  
  return { observerNpc, subjectNpc, updates }
}

// ═══════════════════════════════════════════════════════════════════
// QUERY OPERATIONS
// ═══════════════════════════════════════════════════════════════════

export async function getTJKnowledgeOfNpc(saveSlotId, npcId) {
  const knowledge = await getKnowledge(saveSlotId)
  return knowledge.tjKnowledge.npcs[npcId] || null
}

export async function getNpcKnowledgeOfTJ(saveSlotId, npcId) {
  const knowledge = await getKnowledge(saveSlotId)
  return knowledge.npcKnowledgeOfTJ[npcId] || null
}

export async function getTJKnownNpcs(saveSlotId) {
  const knowledge = await getKnowledge(saveSlotId)
  const known = []
  
  for (const [npcId, data] of Object.entries(knowledge.tjKnowledge.npcs)) {
    if (data.tier !== 'unknown') {
      known.push({ npcId, ...data })
    }
  }
  
  return known
}

export async function getTJDiscoveredLocations(saveSlotId) {
  const knowledge = await getKnowledge(saveSlotId)
  const discovered = []
  
  for (const [locationId, data] of Object.entries(knowledge.tjKnowledge.locations)) {
    if (data.status !== 'undiscovered') {
      discovered.push({ locationId, ...data })
    }
  }
  
  return discovered
}

export async function getRecentGossip(saveSlotId, limit = 5) {
  const knowledge = await getKnowledge(saveSlotId)
  return knowledge.gossipLog.slice(-limit)
}

export async function getWitnessedGossip(saveSlotId) {
  const knowledge = await getKnowledge(saveSlotId)
  return knowledge.gossipLog.filter(g => g.tjWitnessed)
}

export async function getKnowledgeGraph(saveSlotId) {
  const knowledge = await getKnowledge(saveSlotId)
  return {
    tjKnowledge: knowledge.tjKnowledge,
    npcKnowledgeOfTJ: knowledge.npcKnowledgeOfTJ,
    npcKnowledgeOfNpcs: knowledge.npcKnowledgeOfNpcs,
    gossipLog: knowledge.gossipLog
  }
}

export async function createIndexes() {
  const db = getDB()
  await db.collection(COLLECTION).createIndex({ saveSlotId: 1 }, { unique: true })
}

export default {
  getKnowledge,
  resetKnowledge,
  deleteKnowledge,
  updateTJNpcKnowledge,
  makeTJAwareOfNpc,
  updateTJLocationKnowledge,
  addTJWorldFact,
  addNpcDirectExperience,
  processGossip,
  updateNpcToNpcKnowledge,
  getTJKnowledgeOfNpc,
  getNpcKnowledgeOfTJ,
  getTJKnownNpcs,
  getTJDiscoveredLocations,
  getRecentGossip,
  getWitnessedGossip,
  getKnowledgeGraph,
  createIndexes
}
