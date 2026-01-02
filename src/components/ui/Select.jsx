import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

export const Select = forwardRef(function Select({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select...',
  className = '',
  ...props
}, ref) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border transition-colors appearance-none
            bg-background-tertiary text-text-primary
            focus:outline-none focus:ring-2 focus:ring-accent-primary/50
            ${error 
              ? 'border-accent-danger focus:border-accent-danger' 
              : 'border-background-elevated focus:border-accent-primary'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className="bg-background-secondary"
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <ChevronDown 
          size={18} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" 
        />
      </div>
      
      {hint && !error && (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
      
      {error && (
        <p className="text-xs text-accent-danger">{error}</p>
      )}
    </div>
  )
})

export default Select
