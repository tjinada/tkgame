import { Modal } from '../ui/Modal'
import { Tabs } from '../ui/Tabs'
import { SettingsTab } from './tabs/SettingsTab'
import { AssetManagerTab } from './tabs/AssetManagerTab'
import { JsonManagerTab } from './tabs/JsonManagerTab'
import { NpcEditorTab } from './tabs/NpcEditorTab'
import { EventEditorTab } from './tabs/EventEditorTab'
import { StateInspectorTab } from './tabs/StateInspectorTab'
import { DebugTab } from './tabs/DebugTab'
import KnowledgeGraphTab from './tabs/KnowledgeGraphTab'
import { Settings, Image, FileJson, Users, Zap, Activity, Bug, Network } from 'lucide-react'

export function AdminPanel({ 
  isOpen, 
  onClose, 
  gameState, 
  onStateChange,
  onStartScenario,
}) {
  // Use render functions for lazy loading - prevents file inputs from being created when not needed
  const tabs = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={16} />,
      render: () => <SettingsTab />,
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: <Image size={16} />,
      render: () => <AssetManagerTab />,
    },
    {
      id: 'scenarios',
      label: 'Scenarios',
      icon: <FileJson size={16} />,
      render: () => (
        <JsonManagerTab 
          gameState={gameState} 
          onStartScenario={onStartScenario}
          onClose={onClose}
        />
      ),
    },
    {
      id: 'npcs',
      label: 'NPCs',
      icon: <Users size={16} />,
      render: () => <NpcEditorTab />,
    },
    {
      id: 'events',
      label: 'Events',
      icon: <Zap size={16} />,
      render: () => <EventEditorTab />,
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      icon: <Network size={16} />,
      render: () => <KnowledgeGraphTab saveSlotId={gameState?.saveSlotId} />,
    },
    {
      id: 'state',
      label: 'State',
      icon: <Activity size={16} />,
      render: () => <StateInspectorTab gameState={gameState} onStateChange={onStateChange} />,
    },
    {
      id: 'debug',
      label: 'Debug',
      icon: <Bug size={16} />,
      render: () => <DebugTab />,
    },
  ]

  // Don't render anything if not open - prevents file inputs from existing in DOM
  if (!isOpen) {
    return null
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Admin Panel"
      size="full"
    >
      <div className="h-[85vh]">
        <Tabs tabs={tabs} defaultTab="settings" />
      </div>
    </Modal>
  )
}

export default AdminPanel
