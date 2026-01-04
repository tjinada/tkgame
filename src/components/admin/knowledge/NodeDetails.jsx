import React from 'react'
import { X, User, Users, MessageSquare, Eye, Heart, AlertTriangle } from 'lucide-react'
import knowledgeConfig from '../../../data/knowledge.json'

/**
 * NodeDetails - Shows detailed information about a selected node in the knowledge graph
 */
export default function NodeDetails({ node, graphData, onClose }) {
  if (!node) return null

  const renderTJDetails = () => {
    const tjKnowledge = graphData?.tjKnowledge
    if (!tjKnowledge) return null

    const knownNpcs = Object.entries(tjKnowledge.npcs || {})
      .filter(([_, data]) => data.tier !== 'unknown')
    
    const discoveredLocations = Object.entries(tjKnowledge.locations || {})
      .filter(([_, data]) => data.status !== 'undiscovered')

    return (
      <div className="space-y-4">
        {/* Known NPCs */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Known NPCs ({knownNpcs.length}/6)
          </h4>
          {knownNpcs.length > 0 ? (
            <div className="space-y-2">
              {knownNpcs.map(([npcId, data]) => (
                <div key={npcId} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white capitalize font-medium">{npcId}</span>
                    <span 
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: knowledgeConfig.knowledgeTiers.tj_npc[data.tier]?.color + '33',
                        color: knowledgeConfig.knowledgeTiers.tj_npc[data.tier]?.color
                      }}
                    >
                      {data.tier}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {data.encounterCount} encounters • First met: Turn {data.firstMetTurn}
                  </div>
                  {data.learnedTraits?.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Traits: {data.learnedTraits.join(', ')}
                    </div>
                  )}
                  {data.secrets?.length > 0 && (
                    <div className="text-xs text-purple-400 mt-1">
                      🔓 Secrets: {data.secrets.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">TJ doesn't know anyone yet.</p>
          )}
        </div>

        {/* Discovered Locations */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">
            Discovered Locations ({discoveredLocations.length})
          </h4>
          {discoveredLocations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {discoveredLocations.map(([locId, data]) => (
                <span 
                  key={locId}
                  className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
                >
                  {locId.replace(/_/g, ' ')} ({data.status})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Only starting room discovered.</p>
          )}
        </div>

        {/* World Facts */}
        {tjKnowledge.worldFacts?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Known Facts</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              {tjKnowledge.worldFacts.map((fact, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {fact.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const renderNpcDetails = (npcId) => {
    const npcProfile = knowledgeConfig.npcProfiles[npcId]
    const npcKnowledgeOfTJ = graphData?.npcKnowledgeOfTJ?.[npcId]
    const npcKnowledgeOfNpcs = graphData?.npcKnowledgeOfNpcs?.[npcId]
    const tjKnowledgeOfNpc = graphData?.tjKnowledge?.npcs?.[npcId]

    return (
      <div className="space-y-4">
        {/* NPC Profile */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-lg font-medium text-white capitalize">{npcId}</div>
          <div className="text-sm text-purple-400">{npcProfile?.title}</div>
          <div className="text-xs text-gray-400 mt-1">
            Gossip style: {npcProfile?.gossipStyle} ({Math.round(npcProfile?.gossipLikelihood * 100)}% likelihood)
          </div>
        </div>

        {/* What this NPC knows about TJ */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            What {npcId} knows about TJ
          </h4>
          
          {npcKnowledgeOfTJ?.directExperience?.length > 0 || npcKnowledgeOfTJ?.gossipReceived?.length > 0 ? (
            <div className="space-y-3">
              {/* Impression */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Impression:</span>
                <span 
                  className="px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: knowledgeConfig.impressionLevels[npcKnowledgeOfTJ.impression]?.color + '33',
                    color: knowledgeConfig.impressionLevels[npcKnowledgeOfTJ.impression]?.color
                  }}
                >
                  {npcKnowledgeOfTJ.impression}
                </span>
              </div>

              {/* Known traits */}
              {npcKnowledgeOfTJ.knownTraits?.length > 0 && (
                <div>
                  <span className="text-xs text-gray-400">Known traits: </span>
                  <span className="text-xs text-gray-300">
                    {npcKnowledgeOfTJ.knownTraits.join(', ')}
                  </span>
                </div>
              )}

              {/* Direct experiences */}
              {npcKnowledgeOfTJ.directExperience?.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    Direct experiences ({npcKnowledgeOfTJ.directExperience.length}):
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {npcKnowledgeOfTJ.directExperience.slice(-5).map((exp, i) => (
                      <div key={i} className="text-xs bg-gray-900 rounded p-2">
                        <span className="text-gray-500">T{exp.turn}:</span>{' '}
                        <span className="text-gray-300">{exp.summary}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gossip received */}
              {npcKnowledgeOfTJ.gossipReceived?.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Gossip received ({npcKnowledgeOfTJ.gossipReceived.length}):
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {npcKnowledgeOfTJ.gossipReceived.slice(-5).map((g, i) => (
                      <div key={i} className="text-xs bg-gray-900 rounded p-2">
                        <span className="text-yellow-500">From {g.fromNpc}:</span>{' '}
                        <span className="text-gray-300">{g.summary}</span>
                        {g.tjWitnessed && (
                          <span className="text-red-400 ml-1">(TJ saw this)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No knowledge of TJ yet.</p>
          )}
        </div>

        {/* Relationships with other NPCs */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Relationships with other NPCs
          </h4>
          {npcKnowledgeOfNpcs ? (
            <div className="space-y-2">
              {Object.entries(npcKnowledgeOfNpcs).map(([otherNpc, rel]) => (
                <div key={otherNpc} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                  <span className="text-gray-300 capitalize">{otherNpc}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      rel.relationship === 'ally' ? 'bg-green-900 text-green-300' :
                      rel.relationship === 'rival' ? 'bg-red-900 text-red-300' :
                      rel.relationship === 'boss' ? 'bg-purple-900 text-purple-300' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {rel.relationship}
                    </span>
                    <span className="text-xs text-gray-500">
                      Trust: {rel.trust}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data available.</p>
          )}
        </div>

        {/* What TJ knows about this NPC */}
        {tjKnowledgeOfNpc && tjKnowledgeOfNpc.tier !== 'unknown' && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              What TJ knows about {npcId}
            </h4>
            <div className="bg-gray-800 rounded-lg p-3 text-sm">
              <div>
                Tier: <span className="text-white capitalize">{tjKnowledgeOfNpc.tier}</span>
              </div>
              <div>
                Encounters: <span className="text-white">{tjKnowledgeOfNpc.encounterCount}</span>
              </div>
              {tjKnowledgeOfNpc.learnedTraits?.length > 0 && (
                <div className="mt-1 text-xs text-gray-400">
                  Known traits: {tjKnowledgeOfNpc.learnedTraits.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-medium text-white capitalize">
            {node.label || node.id}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {node.id === 'tj' ? renderTJDetails() : renderNpcDetails(node.id)}
      </div>
    </div>
  )
}
