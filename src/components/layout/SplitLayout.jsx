export function SplitLayout({ left, right }) {
  return (
    <div className="flex flex-1 gap-4 p-4 overflow-hidden">
      {/* Left Panel - Visual + Dashboard */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
        {left}
      </div>

      {/* Right Panel - Narrative + Choices */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {right}
      </div>
    </div>
  )
}

export default SplitLayout
