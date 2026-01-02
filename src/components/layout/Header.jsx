import { Settings, Menu, Pause, MapPin } from 'lucide-react'
import { Button } from '../ui/Button'

export function Header({ 
  chapter = 1, 
  turn = 1, 
  location = null,
  onAdminClick, 
  onMenuClick,
  isPaused = false,
}) {
  // Format location name for display
  const formatLocation = (loc) => {
    if (!loc) return null
    return loc
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  const displayLocation = formatLocation(location)

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background-secondary/50 backdrop-blur-md border-b border-background-tertiary/30">
      {/* Logo and Title */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center">
          <span className="text-xl">⛓️</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            Fetish Dominion
          </h1>
          <p className="text-xs text-text-muted">
            The Infinite Slave Saga
          </p>
        </div>
      </div>

      {/* Location Display (Centered) */}
      {displayLocation && (
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 px-4 py-1.5 bg-background-tertiary/40 rounded-full border border-background-elevated/30">
          <MapPin size={14} className="text-accent-secondary" />
          <span className="text-sm font-medium text-text-primary">
            {displayLocation}
          </span>
        </div>
      )}

      {/* Chapter/Turn Info + Actions */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Desktop chapter/turn/location */}
        <div className="text-right hidden sm:block">
          <p className="text-sm text-text-secondary">
            Chapter <span className="text-text-primary font-mono">{chapter}</span>
          </p>
          <p className="text-xs text-text-muted">
            Turn <span className="font-mono">{turn}</span>
          </p>
        </div>
        
        {/* Mobile: compact display */}
        <div className="sm:hidden text-xs text-text-muted flex flex-col items-end gap-0.5">
          <span>Ch {chapter} / T{turn}</span>
          {displayLocation && (
            <span className="flex items-center gap-1">
              <MapPin size={10} className="text-accent-secondary" />
              {displayLocation}
            </span>
          )}
        </div>

        {/* Menu Button */}
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-2"
          onClick={onMenuClick}
          title="Game Menu (Esc)"
        >
          {isPaused ? <Pause size={18} /> : <Menu size={18} />}
          <span className="hidden md:inline">Menu</span>
        </Button>

        {/* Admin Button */}
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-2"
          onClick={onAdminClick}
          title="Admin Panel"
        >
          <Settings size={18} />
          <span className="hidden md:inline">Admin</span>
        </Button>
      </div>
    </header>
  )
}

export default Header
