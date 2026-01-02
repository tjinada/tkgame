import { clsx } from 'clsx'

const TIER_CONFIG = {
  Devoted: { color: 'bg-affinity-devoted', emoji: '💚', textColor: 'text-affinity-devoted' },
  Pleased: { color: 'bg-affinity-pleased', emoji: '😊', textColor: 'text-affinity-pleased' },
  Neutral: { color: 'bg-affinity-neutral', emoji: '😐', textColor: 'text-affinity-neutral' },
  Annoyed: { color: 'bg-affinity-annoyed', emoji: '😤', textColor: 'text-affinity-annoyed' },
  Hostile: { color: 'bg-affinity-hostile', emoji: '😠', textColor: 'text-affinity-hostile' },
  Enemy: { color: 'bg-affinity-enemy', emoji: '💀', textColor: 'text-affinity-enemy' },
}

export function AffinityBadge({ 
  npcName, 
  affinity, 
  tier,
  compact = false 
}) {
  const tierConfig = TIER_CONFIG[tier?.tier] || TIER_CONFIG.Neutral
  const sign = affinity >= 0 ? '+' : ''
  
  if (compact) {
    return (
      <div 
        className="flex items-center gap-1 px-2 py-1 rounded bg-background-tertiary"
        title={`${npcName}: ${tier?.tier || 'Neutral'} (${tier?.effect || ''})`}
      >
        <span className="text-sm">{tierConfig.emoji}</span>
        <span className={clsx('font-mono text-sm', tierConfig.textColor)}>
          {sign}{affinity}
        </span>
      </div>
    )
  }

  return (
    <div 
      className="flex items-center justify-between px-3 py-2 rounded-lg bg-background-tertiary hover:bg-background-elevated transition-colors"
      title={tier?.effect || ''}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{tierConfig.emoji}</span>
        <span className="text-text-primary font-medium">{npcName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={clsx('font-mono font-semibold', tierConfig.textColor)}>
          {sign}{affinity}
        </span>
        <span className={clsx('text-xs px-2 py-0.5 rounded', tierConfig.color, 'text-white')}>
          {tier?.tier || 'Neutral'}
        </span>
      </div>
    </div>
  )
}

export default AffinityBadge
