import { Settings, Menu, Pause } from 'lucide-react'
import { Button } from '../ui/Button'

export function Header({ 
  chapter = 1, 
  turn = 1, 
  onAdminClick, 
  onMenuClick,
  isPaused = false,
}) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background-secondary/90 backdrop-blur-sm border-b border-background-tertiary">
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

      {/* Chapter/Turn Info */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-text-secondary">
            Chapter <span className="text-text-primary font-mono">{chapter}</span>
          </p>
          <p className="text-xs text-text-muted">
            Turn <span className="font-mono">{turn}</span>
          </p>
        </div>
        
        {/* Mobile chapter/turn */}
        <div className="sm:hidden text-xs text-text-muted">
          Ch {chapter} / T{turn}
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
