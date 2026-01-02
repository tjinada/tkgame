import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  onClick,
  ...props 
}) {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary'
  
  const variants = {
    primary: 'bg-accent-primary hover:bg-accent-primary/80 text-white focus:ring-accent-primary',
    secondary: 'bg-background-elevated hover:bg-background-tertiary text-text-primary border border-background-tertiary focus:ring-accent-primary',
    danger: 'bg-accent-danger hover:bg-accent-danger/80 text-white focus:ring-accent-danger',
    ghost: 'bg-transparent hover:bg-background-tertiary text-text-secondary hover:text-text-primary',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], disabledStyles, className))}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
