import React, { useEffect, useRef, useCallback } from 'react'
import knowledgeConfig from '../../../data/knowledge.json'

/**
 * 2D Knowledge Graph Renderer using Canvas
 * Displays the relationship network between TJ, NPCs, and information flow
 */
export default function GraphRenderer({ data, perspective, filters, onNodeSelect }) {
  const canvasRef = useRef(null)
  const nodesRef = useRef([])
  const animationRef = useRef(null)

  // Build graph nodes and edges from data
  const buildGraph = useCallback(() => {
    if (!data) return { nodes: [], edges: [] }

    const nodes = []
    const edges = []
    const npcs = ['sandy', 'araph', 'nancy', 'aish', 'gaya', 'melissa']
    const centerX = 400
    const centerY = 300
    const radius = 200

    // TJ node (center)
    nodes.push({
      id: 'tj',
      type: 'player',
      label: 'TJ',
      x: centerX,
      y: centerY,
      color: knowledgeConfig.graphVisualization.nodeColors.player,
      radius: 30,
      visible: true
    })

    // NPC nodes (arranged in a circle around TJ)
    npcs.forEach((npcId, index) => {
      const angle = (index / npcs.length) * Math.PI * 2 - Math.PI / 2
      const tjKnowledge = data.tjKnowledge?.npcs?.[npcId]
      const tier = tjKnowledge?.tier || 'unknown'
      
      const visible = perspective === 'god' || 
                      perspective === npcId || 
                      (perspective === 'tj' && tier !== 'unknown')

      nodes.push({
        id: npcId,
        type: 'npc',
        label: npcId.charAt(0).toUpperCase() + npcId.slice(1),
        title: knowledgeConfig.npcProfiles[npcId]?.title || '',
        tier,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        color: knowledgeConfig.graphVisualization.tierColors[tier] || '#374151',
        radius: 25,
        visible
      })
    })

    // TJ → NPC edges (what TJ knows)
    if (filters.showTJConnections) {
      npcs.forEach(npcId => {
        const tjKnowledge = data.tjKnowledge?.npcs?.[npcId]
        if (tjKnowledge && tjKnowledge.tier !== 'unknown') {
          const visible = perspective === 'god' || perspective === 'tj'
          edges.push({
            from: 'tj',
            to: npcId,
            type: 'tj_knows',
            color: knowledgeConfig.graphVisualization.edgeColors.tj_knows,
            thickness: Math.min(tjKnowledge.encounterCount || 1, 5),
            visible
          })
        }
      })
    }

    // NPC → TJ edges (what NPCs know about TJ)
    if (filters.showTJConnections) {
      npcs.forEach(npcId => {
        const npcKnowledge = data.npcKnowledgeOfTJ?.[npcId]
        if (npcKnowledge && (npcKnowledge.directExperience?.length > 0 || npcKnowledge.gossipReceived?.length > 0)) {
          const visible = perspective === 'god' || 
                          perspective === npcId ||
                          (perspective === 'tj' && data.tjKnowledge?.npcs?.[npcId]?.tier !== 'unknown')
          
          edges.push({
            from: npcId,
            to: 'tj',
            type: 'npc_knows_tj',
            color: knowledgeConfig.graphVisualization.edgeColors.npc_knows_tj,
            thickness: (npcKnowledge.directExperience?.length || 0) + (npcKnowledge.gossipReceived?.length || 0) * 0.5,
            visible,
            offset: 15
          })
        }
      })
    }

    // NPC → NPC edges
    if (filters.showNpcToNpc) {
      npcs.forEach(observerNpc => {
        const npcKnowledge = data.npcKnowledgeOfNpcs?.[observerNpc]
        if (!npcKnowledge) return

        Object.entries(npcKnowledge).forEach(([subjectNpc, relationship]) => {
          const visible = perspective === 'god' || perspective === observerNpc

          edges.push({
            from: observerNpc,
            to: subjectNpc,
            type: 'npc_knows_npc',
            color: knowledgeConfig.graphVisualization.edgeColors.npc_knows_npc,
            thickness: relationship.trust / 30,
            visible,
            opacity: 0.3
          })
        })
      })
    }

    // Gossip edges
    if (filters.showGossip && data.gossipLog) {
      data.gossipLog.forEach((gossip) => {
        const visible = perspective === 'god' ||
                        perspective === gossip.fromNpc ||
                        perspective === gossip.toNpc ||
                        (perspective === 'tj' && gossip.tjWitnessed)

        edges.push({
          from: gossip.fromNpc,
          to: gossip.toNpc,
          type: 'gossip',
          color: knowledgeConfig.graphVisualization.edgeColors.gossip,
          thickness: 2,
          visible,
          dashed: true
        })
      })
    }

    return { nodes, edges }
  }, [data, perspective, filters])

  // Draw the graph
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const { nodes, edges } = buildGraph()
    nodesRef.current = nodes

    // Clear canvas
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw edges
    edges.forEach(edge => {
      if (!edge.visible) return

      const fromNode = nodes.find(n => n.id === edge.from)
      const toNode = nodes.find(n => n.id === edge.to)
      if (!fromNode || !toNode || !fromNode.visible || !toNode.visible) return

      ctx.beginPath()
      ctx.strokeStyle = edge.color
      ctx.lineWidth = Math.max(edge.thickness, 1)
      ctx.globalAlpha = edge.opacity || 0.8

      if (edge.dashed) {
        ctx.setLineDash([5, 5])
      } else {
        ctx.setLineDash([])
      }

      // Calculate offset for bidirectional edges
      let fromX = fromNode.x
      let fromY = fromNode.y
      let toX = toNode.x
      let toY = toNode.y

      if (edge.offset) {
        const dx = toX - fromX
        const dy = toY - fromY
        const len = Math.sqrt(dx * dx + dy * dy)
        const perpX = -dy / len * edge.offset
        const perpY = dx / len * edge.offset
        fromX += perpX
        fromY += perpY
        toX += perpX
        toY += perpY
      }

      ctx.moveTo(fromX, fromY)
      ctx.lineTo(toX, toY)
      ctx.stroke()
      ctx.globalAlpha = 1

      // Draw arrow for directed edges
      if (edge.type === 'tj_knows' || edge.type === 'npc_knows_tj' || edge.type === 'gossip') {
        const angle = Math.atan2(toY - fromY, toX - fromX)
        const arrowLen = 10
        const arrowX = toX - Math.cos(angle) * toNode.radius
        const arrowY = toY - Math.sin(angle) * toNode.radius

        ctx.beginPath()
        ctx.moveTo(arrowX, arrowY)
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle - Math.PI / 6),
          arrowY - arrowLen * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(arrowX, arrowY)
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle + Math.PI / 6),
          arrowY - arrowLen * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
      }
    })

    ctx.setLineDash([])

    // Draw nodes
    nodes.forEach(node => {
      if (!node.visible) return

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      ctx.fillStyle = node.color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Node label
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.label, node.x, node.y)

      // Tier/title label below
      if (node.type === 'npc' && node.tier !== 'unknown') {
        ctx.fillStyle = '#9ca3af'
        ctx.font = '10px Inter, sans-serif'
        ctx.fillText(node.tier, node.x, node.y + node.radius + 12)
      }
    })

  }, [buildGraph])

  // Handle click
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if click is on a node
    for (const node of nodesRef.current) {
      if (!node.visible) continue
      const dx = x - node.x
      const dy = y - node.y
      if (dx * dx + dy * dy <= node.radius * node.radius) {
        onNodeSelect?.(node)
        return
      }
    }
  }, [onNodeSelect])

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
        draw()
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [draw])

  // Redraw when data changes
  useEffect(() => {
    draw()
  }, [draw, data, perspective, filters])

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="w-full h-full cursor-pointer"
      style={{ minHeight: '400px' }}
    />
  )
}
