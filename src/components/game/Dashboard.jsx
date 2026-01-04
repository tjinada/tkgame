import { StatBar } from '../ui/StatBar'
import { AffinityBadge } from '../ui/AffinityBadge'
import { ProgressionPanel } from './ProgressionPanel'
import { DiscoveryPanel } from './DiscoveryPanel'

export function Dashboard({ gameState }) {
  const { stats, affinities, npcs, statConfigs, getAffinityTier, activeTone, scars, progression, lastMilestone, lastStageAdvance, npcKnowledge, activeNpcIds } = gameState

  return (
    <div className="flex flex-col gap-6 p-4 bg-background-secondary/70 backdrop-blur-md rounded-xl border border-background-elevated/30">
      {/* Stats Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Stats
        </h3>
        <div className="space-y-3">
          {Object.entries(stats).map(([key, value]) => {
            const config = statConfigs[key]
            return (
              <StatBar
                key={key}
                name={config?.name || key}
                value={value}
                max={config?.max || 100}
                color={config?.color || '#8b5cf6'}
              />
            )
          })}
        </div>
      </div>

      {/* Affinities Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Affinities
        </h3>
        <div className="space-y-2">
          {npcs.map((npc) => (
            <AffinityBadge
              key={npc.id}
              npcName={npc.name}
              affinity={affinities[npc.id] ?? 0}
              tier={getAffinityTier(npc.id)}
            />
          ))}
        </div>
      </div>

      {/* Discovery Section */}
      {npcKnowledge && activeNpcIds?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Discovery
          </h3>
          <DiscoveryPanel
            npcKnowledge={npcKnowledge}
            npcIds={activeNpcIds}
            compact={true}
          />
        </div>
      )}

      {/* Progression Section */}
      <ProgressionPanel 
        progression={progression}
        lastMilestone={lastMilestone}
        lastStageAdvance={lastStageAdvance}
      />

      {/* Status Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Status
        </h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-xs bg-accent-primary/20 text-accent-primary rounded">
            Tone: {activeTone}
          </span>
          {scars.map((scar, i) => (
            <span 
              key={i} 
              className="px-2 py-1 text-xs bg-accent-danger/20 text-accent-danger rounded"
            >
              {scar}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
