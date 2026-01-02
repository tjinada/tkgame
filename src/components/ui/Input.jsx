import { forwardRef } from 'react'

export const Input = forwardRef(function Input({
  label,
  error,
  hint,
  className = '',
  type = 'text',
  ...props
}, ref) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-colors
          bg-background-tertiary text-text-primary placeholder-text-muted
          focus:outline-none focus:ring-2 focus:ring-accent-primary/50
          ${error 
            ? 'border-accent-danger focus:border-accent-danger' 
            : 'border-background-elevated focus:border-accent-primary'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        {...props}
      />
      
      {hint && !error && (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
      
      {error && (
        <p className="text-xs text-accent-danger">{error}</p>
      )}
    </div>
  )
})

export function Textarea({ 
  label, 
  error, 
  hint, 
  className = '', 
  rows = 4,
  ...props 
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      
      <textarea
        rows={rows}
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-colors resize-none
          bg-background-tertiary text-text-primary placeholder-text-muted
          focus:outline-none focus:ring-2 focus:ring-accent-primary/50
          ${error 
            ? 'border-accent-danger focus:border-accent-danger' 
            : 'border-background-elevated focus:border-accent-primary'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        {...props}
      />
      
      {hint && !error && (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
      
      {error && (
        <p className="text-xs text-accent-danger">{error}</p>
      )}
    </div>
  )
}

export default Input
