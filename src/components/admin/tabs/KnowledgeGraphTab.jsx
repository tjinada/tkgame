import React, { useState, useEffect, useCallback } from 'react'
import { Eye, Users, MapPin, MessageSquare, RefreshCw, Filter } from 'lucide-react'
import GraphRenderer from '../knowledge/GraphRenderer'
import NodeDetails from '../knowledge/NodeDetails'
import KnowledgeService from '../../../services/KnowledgeService'
import knowledgeConfig from '../../../data/knowledge.json'

export default function KnowledgeGraphTab({ saveSlotId }) {
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [perspective, setPerspective] = useState('god')
  const [selectedNode, setSelectedNode] = useState(null)
  const [filters, setFilters] = useState({
    showTJConnections: true,
    showNpcToNpc: true,
    showGossip: true,
    showLocations: false
  })

  const loadGraphData = useCallback(async () => {
    if (!saveSlotId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await KnowledgeService.getKnowledgeGraph(saveSlotId)
      setGraphData(data)
    } catch (err) {
      console.error('Failed to load knowledge graph:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [saveSlotId])

  useEffect(() => {
    loadGraphData()
  }, [loadGraphData])

  const perspectives = [
    { id: 'god', label: 'God View (All)', icon: Eye },
    { id: 'tj', label: "TJ's Perspective", icon: Users },
    { id: 'sandy', label: 'Sandy\'s View' },
    { id: 'araph', label: 'Araph\'s View' },
    { id: 'nancy', label: 'Nancy\'s View' },
    { id: 'aish', label: 'Aish\'s View' },
    { id: 'gaya', label: 'Gaya\'s View' },
    { id: 'melissa', label: 'Melissa\'s View' }
  ]

  const handleNodeSelect = (node) => {
    setSelectedNode(node)
  }

  if (!saveSlotId) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>No active save slot. Start or load a game to view the knowledge graph.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Knowledge Graph
        </h2>
        <button
          onClick={loadGraphData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 
                     text-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 flex">
        {/* Left Sidebar - Controls */}
        <div className="w-64 border-r border-gray-700 p-4 space-y-6 overflow-y-auto">
          {/* Perspective Selector */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              VIEW MODE
            </h3>
            <div className="space-y-1">
              {perspectives.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPerspective(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${perspective === p.id 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              FILTERS
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showTJConnections}
                  onChange={(e) => setFilters(f => ({ ...f, showTJConnections: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                />
                Show TJ connections
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showNpcToNpc}
                  onChange={(e) => setFilters(f => ({ ...f, showNpcToNpc: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                />
                Show NPC-NPC
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showGossip}
                  onChange={(e) => setFilters(f => ({ ...f, showGossip: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                />
                Show gossip flow
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showLocations}
                  onChange={(e) => setFilters(f => ({ ...f, showLocations: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                />
                Show locations
              </label>
            </div>
          </div>

          {/* Legend */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">LEGEND</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-500"></div>
                <span className="text-gray-400">Direct knowledge</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-yellow-500 border-dashed"></div>
                <span className="text-gray-400">Gossip connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-gray-500"></div>
                <span className="text-gray-400">NPC relationship</span>
              </div>
              
              <div className="mt-3 pt-2 border-t border-gray-700">
                <p className="text-gray-500 mb-1">Knowledge tiers:</p>
                {Object.entries(knowledgeConfig.knowledgeTiers.tj_npc).map(([tier, data]) => (
                  <div key={tier} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: data.color }}
                    ></div>
                    <span className="text-gray-400 capitalize">{tier}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Graph Area */}
        <div className="flex-1 relative bg-gray-900">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-400 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Loading graph...
              </div>
            </div>
          ) : graphData ? (
            <GraphRenderer
              data={graphData}
              perspective={perspective}
              filters={filters}
              onNodeSelect={handleNodeSelect}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Right Sidebar - Selected Node Details */}
        {selectedNode && (
          <div className="w-80 border-l border-gray-700 overflow-y-auto">
            <NodeDetails
              node={selectedNode}
              graphData={graphData}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {graphData && (
        <div className="border-t border-gray-700 p-3 flex items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>
              {Object.values(graphData.tjKnowledge?.npcs || {}).filter(n => n.tier !== 'unknown').length} / 6 NPCs known
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>
              {Object.values(graphData.tjKnowledge?.locations || {}).filter(l => l.status !== 'undiscovered').length} locations discovered
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>
              {graphData.gossipLog?.length || 0} gossip events
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
