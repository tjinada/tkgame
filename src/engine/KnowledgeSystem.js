import KnowledgeService from '../services/KnowledgeService'

/**
 * KnowledgeSystem - Manages the knowledge graph for the game
 * 
 * Three dimensions of knowledge:
 * 1. TJ → World: What TJ knows about NPCs, locations, world facts
 * 2. NPC → TJ: What each NPC knows about TJ from direct interactions
 * 3. NPC → NPC: What NPCs know about each other
 * 
 * Plus gossip mechanics: Information spreading when NPCs meet
 */
class KnowledgeSystem {
  constructor() {
    this.saveSlotId = null
    this.knowledge = null
    this.subscribers = new Set()
    this.config = null
  }

  // ═══════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════

  async initialize(saveSlotId) {
    this.saveSlotId = saveSlotId
    this.knowledge = await KnowledgeService.getKnowledge(saveSlotId)
    
    // Load config dynamically
    try {
      this.config = (await import('../data/knowledge.json')).default
    } catch (e) {
      console.warn('[KnowledgeSystem] Could not load knowledge config:', e)
      this.config = {}
    }
    
    this._notify('initialized', this.knowledge)
    return this.knowledge
  }

  async reset(saveSlotId) {
    this.saveSlotId = saveSlotId
    this.knowledge = await KnowledgeService.resetKnowledge(saveSlotId)
    this._notify('reset', this.knowledge)
    return this.knowledge
  }

  // ═══════════════════════════════════════════════════════════════════
  // EVENT SUBSCRIPTION
  // ═══════════════════════════════════════════════════════════════════

  subscribe(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  _notify(eventType, data) {
    this.subscribers.forEach(cb => cb({ type: eventType, data }))
  }

  // ═══════════════════════════════════════════════════════════════════
  // TJ KNOWLEDGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Check if TJ knows about an NPC
   */
  doesTJKnow(npcId) {
    if (!this.knowledge) return false
    const npcKnowledge = this.knowledge.tjKnowledge.npcs[npcId]
    return npcKnowledge && npcKnowledge.tier !== 'unknown'
  }

  /**
   * Get TJ's knowledge tier for an NPC
   */
  getTJKnowledgeTier(npcId) {
    if (!this.knowledge) return 'unknown'
    return this.knowledge.tjKnowledge.npcs[npcId]?.tier || 'unknown'
  }

  /**
   * Get all NPCs that TJ knows (tier > unknown)
   */
  getTJKnownNpcs() {
    if (!this.knowledge) return []
    const known = []
    for (const [npcId, data] of Object.entries(this.knowledge.tjKnowledge.npcs)) {
      if (data.tier !== 'unknown') {
        known.push({ npcId, ...data })
      }
    }
    return known
  }

  /**
   * Check if TJ has discovered a location
   */
  hasTJDiscovered(locationId) {
    if (!this.knowledge) return false
    const loc = this.knowledge.tjKnowledge.locations[locationId]
    return loc && loc.status !== 'undiscovered'
  }

  /**
   * Get all locations TJ has discovered
   */
  getTJDiscoveredLocations() {
    if (!this.knowledge) return []
    const discovered = []
    for (const [locationId, data] of Object.entries(this.knowledge.tjKnowledge.locations)) {
      if (data.status !== 'undiscovered') {
        discovered.push({ locationId, ...data })
      }
    }
    return discovered
  }

  /**
   * Update TJ's knowledge after encountering an NPC
   */
  async recordTJMeetsNpc(npcId, turn, options = {}) {
    if (!this.saveSlotId) return null

    const result = await KnowledgeService.updateTJNpcKnowledge(this.saveSlotId, npcId, {
      turn,
      traits: options.traits || [],
      facts: options.facts || [],
      secrets: options.secrets || []
    })

    // Refresh local cache
    this.knowledge = await KnowledgeService.getKnowledge(this.saveSlotId)
    
    this._notify('tj_met_npc', { npcId, result })
    
    return result
  }

  /**
   * Make TJ aware of an NPC (heard about them)
   */
  async makeTJAware(npcId, turn) {
    if (!this.saveSlotId) return null

    const result = await KnowledgeService.makeTJAwareOfNpc(this.saveSlotId, npcId, turn)
    
    this.knowledge = await KnowledgeService.getKnowledge(this.saveSlotId)
    this._notify('tj_aware_of_npc', { npcId, result })
    
    return result
  }

  /**
   * Record TJ visiting a location
   */
  async recordTJVisitsLocation(locationId, turn) {
    if (!this.saveSlotId) return null

    const result = await KnowledgeService.updateTJLocationKnowledge(this.saveSlotId, locationId, turn)
    
    this.knowledge = await KnowledgeService.getKnowledge(this.saveSlotId)
    this._notify('tj_visited_location', { locationId, result })
    
    return result
  }

  /**
   * Add a world fact to TJ's knowledge
   */
  async addWorldFact(fact) {
    if (!this.saveSlotId) return null

    const result = await KnowledgeService.addTJWorldFact(this.saveSlotId, fact)
    
    this.knowledge = await KnowledgeService.getKnowledge(this.saveSlotId)
    this._notify('tj_learned_fact', { fact })
    
    return result
  }

  // ═══════════════════════════════════════════════════════════════════
  // NPC KNOWLEDGE OF TJ OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get what an NPC knows about TJ
   */
  getNpcKnowledgeOfTJ(npcId) {
    if (!this.knowledge) return null
    return this.knowledge.npcKnowledgeOfTJ[npcId] || null
  }

  /**
   * Record an NPC's direct experience with TJ
   */
  async recordNpcExperience(npcId, experience) {
    if (!this.saveSlotId) return null

    const result = await KnowledgeService.addNpcDirectExperience(this.saveSlotId, npcId, experience)
    
    this.knowledge = await KnowledgeService.getKnowledge(this.saveSlotId)
    this._notify('npc_experience_added', { npcId, experience: result })
    
    return result
  }

  /**
   * Get what an NPC's impression of TJ is
   */
  getNpcImpression(npcId) {
    if (!this.knowledge) return 'unknown'
    return this.knowledge.npcKnowledgeOfTJ[npcId]?.impression || 'unknown'
  }

  /**
   * Get all traits an NPC knows about TJ
   */
  getNpcKnownTraits(npcId) {
    if (!this.knowledge) return []
    return this.knowledge.npcKnowledgeOfTJ[npcId]?.knownTraits || []
  }

  // ═══════════════════════════════════════════════════════════════════
  // GOSSIP OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Process gossip when NPCs appear together in a scene
   * Call this when multiple NPCs are present
   */
  async processSceneGossip(presentNpcs, turn, tjWitnessed = true) {
    if (!this.saveSlotId || presentNpcs.length < 2) return []

    const result = await KnowledgeService.processGossip(
      this.saveSlotId,
      presentNpcs,
      turn,
      tjWitnessed
    )

    this.knowledge = await KnowledgeService.getKnowledge(this.saveSlotId)
    
    if (result.gossipEvents?.length > 0) {
      this._notify('gossip_occurred', { events: result.gossipEvents })
    }
    
    return result.gossipEvents || []
  }

  /**
   * Get recent gossip events
   */
  getRecentGossip(limit = 5) {
    if (!this.knowledge) return []
    return this.knowledge.gossipLog.slice(-limit)
  }

  /**
   * Get gossip TJ witnessed (for narrative)
   */
  getWitnessedGossip() {
    if (!this.knowledge) return []
    return this.knowledge.gossipLog.filter(g => g.tjWitnessed)
  }

  // ═══════════════════════════════════════════════════════════════════
  // NPC-TO-NPC KNOWLEDGE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get what one NPC knows about another
   */
  getNpcKnowledgeOfNpc(observerNpc, subjectNpc) {
    if (!this.knowledge) return null
    return this.knowledge.npcKnowledgeOfNpcs[observerNpc]?.[subjectNpc] || null
  }

  /**
   * Get the trust level between two NPCs
   */
  getNpcTrust(observerNpc, subjectNpc) {
    const knowledge = this.getNpcKnowledgeOfNpc(observerNpc, subjectNpc)
    return knowledge?.trust || 50
  }

  /**
   * Get the relationship type between two NPCs
   */
  getNpcRelationship(observerNpc, subjectNpc) {
    const knowledge = this.getNpcKnowledgeOfNpc(observerNpc, subjectNpc)
    return knowledge?.relationship || 'peer'
  }

  /**
   * Get descriptors for NPCs that TJ hasn't properly met yet
   * For AI context to avoid using names TJ doesn't know
   */
  getUnknownNpcDescriptors() {
    if (!this.knowledge || !this.config?.npcDescriptors) return {}

    const unknownNpcs = {}
    const npcs = ['sandy', 'araph', 'nancy', 'aish', 'gaya', 'melissa']

    for (const npcId of npcs) {
      const tier = this.knowledge.tjKnowledge.npcs[npcId]?.tier || 'unknown'
      
      // Only include NPCs that TJ hasn't properly met (unknown or aware)
      // Once 'met', TJ knows their name from introduction
      if (tier === 'unknown' || tier === 'aware') {
        const descriptors = this.config.npcDescriptors[npcId]?.[tier] || 
                            this.config.npcDescriptors[npcId]?.unknown || 
                            [`the ${npcId}`]
        unknownNpcs[npcId] = {
          tier,
          descriptors,
          // Provide a primary descriptor for consistent reference
          primary: descriptors[0]
        }
      }
    }

    return unknownNpcs
  }

  /**
   * Get the appropriate descriptor for an NPC based on TJ's knowledge
   * Returns the name if known, or a descriptor if not
   */
  getNpcDescriptor(npcId) {
    if (!this.knowledge || !this.config?.npcDescriptors) {
      return npcId.charAt(0).toUpperCase() + npcId.slice(1)
    }

    const tier = this.knowledge.tjKnowledge.npcs[npcId]?.tier || 'unknown'
    
    // If TJ has properly met them, use their name
    if (tier === 'met' || tier === 'familiar' || tier === 'intimate') {
      return npcId.charAt(0).toUpperCase() + npcId.slice(1)
    }

    // Otherwise return a descriptor
    const descriptors = this.config.npcDescriptors[npcId]?.[tier] || 
                        this.config.npcDescriptors[npcId]?.unknown
    
    return descriptors?.[0] || npcId.charAt(0).toUpperCase() + npcId.slice(1)
  }

  // ═══════════════════════════════════════════════════════════════════
  // CHOICE FILTERING
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Filter choices based on TJ's knowledge
   * Removes choices that reference unknown NPCs or locations
   */
  filterChoicesByKnowledge(choices) {
    if (!this.knowledge) return choices

    return choices.filter(choice => {
      // Check if choice references an NPC TJ doesn't know
      if (choice.requiresNpcKnowledge) {
        for (const npcId of choice.requiresNpcKnowledge) {
          if (!this.doesTJKnow(npcId)) {
            return false
          }
        }
      }

      // Check if choice references a location TJ hasn't discovered
      if (choice.requiresLocationKnowledge) {
        for (const locationId of choice.requiresLocationKnowledge) {
          if (!this.hasTJDiscovered(locationId)) {
            return false
          }
        }
      }

      // Check minimum knowledge tier requirement
      if (choice.requiresNpcTier) {
        const { npcId, minTier } = choice.requiresNpcTier
        const currentTier = this.getTJKnowledgeTier(npcId)
        const tierLevels = { unknown: 0, aware: 1, met: 2, familiar: 3, intimate: 4 }
        if (tierLevels[currentTier] < tierLevels[minTier]) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Check if a specific choice should be available based on knowledge
   */
  isChoiceAvailable(choice) {
    const filtered = this.filterChoicesByKnowledge([choice])
    return filtered.length > 0
  }

  // ═══════════════════════════════════════════════════════════════════
  // CONTEXT BUILDING FOR AI
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Build knowledge context for AI prompts
   */
  buildKnowledgeContext() {
    if (!this.knowledge) return ''

    const lines = []
    lines.push('=== TJ\'S KNOWLEDGE ===')

    // NPCs TJ knows
    const knownNpcs = this.getTJKnownNpcs()
    if (knownNpcs.length > 0) {
      lines.push('Known NPCs:')
      for (const npc of knownNpcs) {
        const tierDesc = this.config?.knowledgeTiers?.tj_npc?.[npc.tier]?.description || npc.tier
        lines.push(`  - ${npc.npcId}: ${tierDesc}`)
        if (npc.learnedTraits?.length > 0) {
          lines.push(`    Traits: ${npc.learnedTraits.join(', ')}`)
        }
        if (npc.secrets?.length > 0) {
          lines.push(`    Secrets known: ${npc.secrets.join(', ')}`)
        }
      }
    } else {
      lines.push('TJ doesn\'t know anyone yet.')
    }

    // Locations TJ has visited
    const discoveredLocations = this.getTJDiscoveredLocations()
    if (discoveredLocations.length > 0) {
      lines.push('\nDiscovered Locations:')
      for (const loc of discoveredLocations) {
        const statusDesc = this.config?.knowledgeTiers?.location?.[loc.status]?.description || loc.status
        lines.push(`  - ${loc.locationId}: ${statusDesc}`)
      }
    }

    // World facts
    if (this.knowledge.tjKnowledge.worldFacts?.length > 0) {
      lines.push('\nKnown World Facts:')
      for (const fact of this.knowledge.tjKnowledge.worldFacts) {
        lines.push(`  - ${fact}`)
      }
    }

    lines.push('')
    lines.push('=== WHAT NPCS KNOW ABOUT TJ ===')
    
    for (const [npcId, npcData] of Object.entries(this.knowledge.npcKnowledgeOfTJ)) {
      if (npcData.directExperience?.length > 0 || npcData.gossipReceived?.length > 0) {
        lines.push(`\n${npcId.toUpperCase()}:`)
        lines.push(`  Impression: ${npcData.impression}`)
        if (npcData.knownTraits?.length > 0) {
          lines.push(`  Knows TJ is: ${npcData.knownTraits.join(', ')}`)
        }
        if (npcData.gossipReceived?.length > 0) {
          lines.push(`  Heard gossip from: ${npcData.gossipReceived.map(g => g.fromNpc).join(', ')}`)
        }
      }
    }

    // Recent gossip TJ witnessed
    const witnessedGossip = this.getWitnessedGossip()
    if (witnessedGossip.length > 0) {
      lines.push('')
      lines.push('=== GOSSIP TJ WITNESSED ===')
      for (const gossip of witnessedGossip.slice(-3)) {
        lines.push(`  - ${gossip.witnessDescription}`)
      }
    }

    return lines.join('\n')
  }

  /**
   * Build context about what a specific NPC knows
   * Useful for generating NPC-specific dialogue
   */
  buildNpcKnowledgeContext(npcId) {
    if (!this.knowledge) return ''

    const lines = []
    lines.push(`=== WHAT ${npcId.toUpperCase()} KNOWS ===`)

    // About TJ
    const aboutTJ = this.knowledge.npcKnowledgeOfTJ[npcId]
    if (aboutTJ) {
      lines.push('\nAbout TJ:')
      lines.push(`  Impression: ${aboutTJ.impression}`)
      if (aboutTJ.knownTraits?.length > 0) {
        lines.push(`  Known traits: ${aboutTJ.knownTraits.join(', ')}`)
      }
      
      // Direct experiences
      if (aboutTJ.directExperience?.length > 0) {
        lines.push('  Direct experiences:')
        for (const exp of aboutTJ.directExperience.slice(-3)) {
          lines.push(`    - Turn ${exp.turn}: ${exp.summary}`)
        }
      }
      
      // Gossip received
      if (aboutTJ.gossipReceived?.length > 0) {
        lines.push('  Heard from others:')
        for (const gossip of aboutTJ.gossipReceived.slice(-3)) {
          lines.push(`    - From ${gossip.fromNpc}: ${gossip.summary}`)
        }
      }
    }

    // About other NPCs
    const aboutNpcs = this.knowledge.npcKnowledgeOfNpcs[npcId]
    if (aboutNpcs) {
      lines.push('\nAbout other NPCs:')
      for (const [otherNpc, data] of Object.entries(aboutNpcs)) {
        lines.push(`  ${otherNpc}: ${data.relationship} (trust: ${data.trust})`)
      }
    }

    return lines.join('\n')
  }

  // ═══════════════════════════════════════════════════════════════════
  // GRAPH DATA FOR VISUALIZATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get full knowledge graph data for Three.js visualization
   */
  async getGraphData() {
    if (!this.saveSlotId) return null
    return KnowledgeService.getKnowledgeGraph(this.saveSlotId)
  }

  /**
   * Get filtered graph data for a specific perspective
   */
  getGraphDataForPerspective(perspective = 'god') {
    if (!this.knowledge) return { nodes: [], edges: [] }

    const nodes = []
    const edges = []

    // TJ node
    nodes.push({
      id: 'tj',
      type: 'player',
      label: 'TJ',
      data: {}
    })

    // NPC nodes
    const npcs = ['sandy', 'araph', 'nancy', 'aish', 'gaya', 'melissa']
    for (const npcId of npcs) {
      const tjKnowledge = this.knowledge.tjKnowledge.npcs[npcId]
      const tier = tjKnowledge?.tier || 'unknown'
      
      // In TJ perspective, hide unknown NPCs
      const visible = perspective === 'god' || 
                      perspective === npcId || 
                      (perspective === 'tj' && tier !== 'unknown')

      nodes.push({
        id: npcId,
        type: 'npc',
        label: npcId.charAt(0).toUpperCase() + npcId.slice(1),
        title: this.config?.npcProfiles?.[npcId]?.title || '',
        tier,
        visible
      })
    }

    // TJ → NPC edges (what TJ knows)
    for (const npcId of npcs) {
      const tjKnowledge = this.knowledge.tjKnowledge.npcs[npcId]
      if (tjKnowledge?.tier !== 'unknown') {
        const visible = perspective === 'god' || perspective === 'tj'
        edges.push({
          from: 'tj',
          to: npcId,
          type: 'tj_knows',
          tier: tjKnowledge.tier,
          visible
        })
      }
    }

    // NPC → TJ edges (what NPCs know about TJ)
    for (const npcId of npcs) {
      const npcKnowledge = this.knowledge.npcKnowledgeOfTJ[npcId]
      if (npcKnowledge?.directExperience?.length > 0 || npcKnowledge?.gossipReceived?.length > 0) {
        const visible = perspective === 'god' || 
                        perspective === npcId ||
                        (perspective === 'tj' && this.doesTJKnow(npcId))
        
        edges.push({
          from: npcId,
          to: 'tj',
          type: 'npc_knows_tj',
          impression: npcKnowledge.impression,
          directCount: npcKnowledge.directExperience?.length || 0,
          gossipCount: npcKnowledge.gossipReceived?.length || 0,
          visible
        })
      }
    }

    // NPC → NPC edges
    for (const observerNpc of npcs) {
      const npcKnowledge = this.knowledge.npcKnowledgeOfNpcs[observerNpc]
      if (!npcKnowledge) continue

      for (const [subjectNpc, data] of Object.entries(npcKnowledge)) {
        const visible = perspective === 'god' || perspective === observerNpc

        edges.push({
          from: observerNpc,
          to: subjectNpc,
          type: 'npc_knows_npc',
          relationship: data.relationship,
          trust: data.trust,
          visible
        })
      }
    }

    // Gossip edges
    for (const gossip of this.knowledge.gossipLog) {
      const visible = perspective === 'god' || 
        perspective === gossip.fromNpc || 
        perspective === gossip.toNpc ||
        (perspective === 'tj' && gossip.tjWitnessed)

      edges.push({
        from: gossip.fromNpc,
        to: gossip.toNpc,
        type: 'gossip',
        turn: gossip.turn,
        about: gossip.subject,
        visible
      })
    }

    return { nodes, edges }
  }
}

// Singleton instance
const knowledgeSystem = new KnowledgeSystem()
export default knowledgeSystem
