import { clsx } from 'clsx'

export function StatBar({ 
  name, 
  value, 
  max = 100, 
  color, 
  showLabel = true,
  size = 'md' 
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className={clsx('flex justify-between mb-1', labelSizes[size])}>
          <span className="text-text-secondary font-medium uppercase tracking-wide">
            {name}
          </span>
          <span className="text-text-primary font-mono">
            {value}/{max}
          </span>
        </div>
      )}
      <div className={clsx('w-full bg-background-tertiary rounded-full overflow-hidden', sizes[size])}>
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  )
}

export default StatBar
