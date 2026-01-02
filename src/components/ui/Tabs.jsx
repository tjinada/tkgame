import { useState } from 'react'
import { motion } from 'framer-motion'

export function Tabs({ tabs, defaultTab, onChange }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const activeTabData = tabs.find(t => t.id === activeTab)

  // Support both content (React element) and render (function that returns element)
  const renderContent = () => {
    if (activeTabData?.render) {
      return activeTabData.render()
    }
    return activeTabData?.content
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-background-tertiary overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`
              relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
              ${activeTab === tab.id 
                ? 'text-accent-primary' 
                : 'text-text-muted hover:text-text-primary'
              }
            `}
          >
            <span className="flex items-center gap-2">
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
            </span>
            
            {/* Active indicator */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content - Only render active tab */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  )
}

export function TabPanel({ children, className = '' }) {
  return (
    <div className={`h-full overflow-y-auto p-6 ${className}`}>
      {children}
    </div>
  )
}

export default Tabs
