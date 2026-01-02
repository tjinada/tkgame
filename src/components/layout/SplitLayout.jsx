/**
 * Split layout component that adjusts width when body part panel is visible
 * - Left panel: Portrait + Dashboard (fixed width)
 * - Center panel: Narrative + Choices (flexible, compresses when body part appears)
 * - Right panel: Body Part (slides in when active)
 */
export function SplitLayout({ left, right, bodyPartPanel = null }) {
  const hasBodyPartPanel = bodyPartPanel !== null

  return (
    <div className="flex flex-1 gap-4 p-4 overflow-hidden">
      {/* Left Panel - Visual + Dashboard */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
        {left}
      </div>

      {/* Center Panel - Narrative + Choices */}
      <div 
        className={`
          flex-1 flex flex-col gap-4 min-w-0 overflow-hidden
          transition-all duration-300 ease-out
        `}
      >
        {right}
      </div>

      {/* Right Panel - Body Part (slides in when active) */}
      {bodyPartPanel}
    </div>
  )
}

export default SplitLayout
