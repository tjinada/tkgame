import { useState } from 'react'
import { ChevronDown, ChevronUp, Trophy, TrendingUp, Star, Users } from 'lucide-react'

// Experience level labels
const LEVEL_LABELS = ['Unexperienced', 'Introduced', 'Familiar', 'Experienced', 'Seasoned', 'Mastered']

// Stage colors
const STAGE_COLORS = {
  initiation: 'text-stat-sensitivity',
  training: 'text-stat-endurance',
  advanced: 'text-accent-primary',
  veteran: 'text-stat-arousal',
}

// Compact fetish display names
const FETISH_SHORT_NAMES = {
  tickling: 'Tickle',
  footWorship: 'Feet',
  sweatWorship: 'Sweat',
  edging: 'Edge',
  postOrgasmTorture: 'POT',
  bondage: 'Bondage',
  humiliation: 'Humil.',
  trampling: 'Trample',
  smothering: 'Smother',
  groupScenes: 'Group',
  pissPlay: 'WS',
}

export function ProgressionPanel({ progression, lastMilestone, lastStageAdvance }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!progression) {
    return null
  }

  const { stage, maxIntensity, experiences, npcFamiliarity, milestones, streaks, dayNumber } = progression

  // Count completed milestones
  const completedMilestones = Object.values(milestones || {}).filter(m => m.completed).length
  const totalMilestones = Object.keys(milestones || {}).length

  // Get top 3 fetish experiences (by level, then by exposures)
  const topFetishes = Object.entries(experiences || {})
    .filter(([_, data]) => data.level > 0)
    .sort((a, b) => b[1].level - a[1].level || b[1].totalExposures - a[1].totalExposures)
    .slice(0, 3)

  return (
    <div className="space-y-3">
      {/* Header with collapse toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-semibold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <TrendingUp size={14} />
          Progression
        </span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Stage Badge - Always visible */}
      <div className="flex items-center justify-between p-2 bg-background-tertiary/50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold capitalize ${STAGE_COLORS[stage] || 'text-text-primary'}`}>
            {stage}
          </span>
          <span className="text-xs text-text-muted">Day {dayNumber}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-muted">Max</span>
          <span className="text-sm font-semibold text-stat-arousal">{maxIntensity}</span>
        </div>
      </div>

      {/* Milestone Notification (when a new one is completed) */}
      {lastMilestone && (
        <div className="p-2 bg-accent-success/20 border border-accent-success/30 rounded-lg animate-pulse">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-accent-success" />
            <span className="text-sm font-medium text-accent-success">
              {lastMilestone.name || lastMilestone}
            </span>
          </div>
        </div>
      )}

      {/* Stage Advance Notification */}
      {lastStageAdvance && (
        <div className="p-2 bg-accent-primary/20 border border-accent-primary/30 rounded-lg animate-pulse">
          <div className="flex items-center gap-2">
            <Star size={14} className="text-accent-primary" />
            <span className="text-sm font-medium text-accent-primary">
              Advanced to {lastStageAdvance.newStage}!
            </span>
          </div>
        </div>
      )}

      {/* Top Fetishes Preview - Always visible */}
      {topFetishes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {topFetishes.map(([fetish, data]) => (
            <div
              key={fetish}
              className="flex items-center gap-1 px-2 py-1 bg-background-tertiary/50 rounded text-xs"
              title={`${FETISH_SHORT_NAMES[fetish] || fetish}: ${LEVEL_LABELS[data.level]} (${data.totalExposures} exp)`}
            >
              <span className="text-text-secondary">{FETISH_SHORT_NAMES[fetish] || fetish}</span>
              <span className={`font-semibold ${
                data.level >= 5 ? 'text-stat-arousal' :
                data.level >= 3 ? 'text-accent-primary' :
                'text-stat-endurance'
              }`}>
                {data.level}
              </span>
            </div>
          ))}
          {Object.values(experiences || {}).filter(d => d.level > 0).length > 3 && (
            <span className="text-xs text-text-muted self-center">
              +{Object.values(experiences || {}).filter(d => d.level > 0).length - 3}
            </span>
          )}
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-background-elevated/30">
          {/* All Fetish Experience */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Experience Levels
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(experiences || {}).map(([fetish, data]) => (
                <div 
                  key={fetish} 
                  className="flex items-center justify-between p-1.5 bg-background-tertiary/30 rounded"
                >
                  <span className="text-xs text-text-secondary truncate">
                    {FETISH_SHORT_NAMES[fetish] || fetish}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Mini progress bar */}
                    <div className="w-10 h-1.5 bg-background-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          data.level >= 5 ? 'bg-stat-arousal' :
                          data.level >= 3 ? 'bg-accent-primary' :
                          data.level > 0 ? 'bg-stat-endurance' :
                          'bg-background-tertiary'
                        }`}
                        style={{ width: `${(data.level / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-4 text-right ${
                      data.level === 0 ? 'text-text-muted' :
                      data.level >= 5 ? 'text-stat-arousal' :
                      data.level >= 3 ? 'text-accent-primary' :
                      'text-stat-endurance'
                    }`}>
                      {data.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NPC Familiarity */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Users size={12} />
              NPC Encounters
            </h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(npcFamiliarity || {})
                .filter(([_, data]) => data.encounters > 0)
                .sort((a, b) => b[1].encounters - a[1].encounters)
                .map(([npc, data]) => (
                  <div
                    key={npc}
                    className="px-2 py-1 bg-background-tertiary/30 rounded text-xs"
                  >
                    <span className="text-text-secondary capitalize">{npc}</span>
                    <span className="text-text-muted ml-1">×{data.encounters}</span>
                  </div>
                ))}
              {Object.values(npcFamiliarity || {}).every(d => d.encounters === 0) && (
                <span className="text-xs text-text-muted italic">No encounters yet</span>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Trophy size={12} />
              Milestones ({completedMilestones}/{totalMilestones})
            </h4>
            <div className="space-y-1">
              {Object.entries(milestones || {})
                .sort((a, b) => {
                  // Completed first, then by name
                  if (a[1].completed && !b[1].completed) return -1
                  if (!a[1].completed && b[1].completed) return 1
                  return a[1].name?.localeCompare(b[1].name)
                })
                .slice(0, 5) // Show only first 5 in expanded view
                .map(([id, milestone]) => (
                  <div
                    key={id}
                    className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                      milestone.completed 
                        ? 'bg-accent-success/10 text-accent-success' 
                        : 'bg-background-tertiary/30 text-text-muted'
                    }`}
                  >
                    <span className={milestone.completed ? 'font-medium' : ''}>
                      {milestone.completed ? '✓ ' : '○ '}{milestone.name}
                    </span>
                    {milestone.completed && milestone.turn && (
                      <span className="text-xs opacity-70">T{milestone.turn}</span>
                    )}
                  </div>
                ))}
              {totalMilestones > 5 && (
                <span className="text-xs text-text-muted">
                  +{totalMilestones - 5} more milestones
                </span>
              )}
            </div>
          </div>

          {/* Streaks */}
          {(streaks?.submissions > 0 || streaks?.defiances > 0 || streaks?.successfulDefiances > 0) && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Current Streaks
              </h4>
              <div className="flex gap-2">
                {streaks?.submissions > 0 && (
                  <div className="px-2 py-1 bg-accent-success/20 rounded text-xs">
                    <span className="text-accent-success font-semibold">{streaks.submissions}</span>
                    <span className="text-accent-success/70 ml-1">submits</span>
                  </div>
                )}
                {streaks?.successfulDefiances > 0 && (
                  <div className="px-2 py-1 bg-stat-endurance/20 rounded text-xs">
                    <span className="text-stat-endurance font-semibold">{streaks.successfulDefiances}</span>
                    <span className="text-stat-endurance/70 ml-1">defied</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProgressionPanel
