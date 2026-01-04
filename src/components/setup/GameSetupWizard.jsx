/**
 * GameSetupWizard.jsx
 * Main 4-step wizard for creating a new game
 */

import { useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SlaveSelector } from './SlaveSelector';
import { NpcSelector } from './NpcSelector';
import { RulesConfigurator } from './RulesConfigurator';
import { SetupReview } from './SetupReview';
import { scenarioService } from '../../services/ScenarioService';

const STEPS = [
  { id: 'slave', title: 'Choose Your Slave', description: 'Select or customize your character' },
  { id: 'npcs', title: 'Select Mistresses', description: 'Choose your tormentors' },
  { id: 'rules', title: 'Game Rules', description: 'Configure difficulty and options' },
  { id: 'review', title: 'Review & Start', description: 'Confirm and begin' }
];

export function GameSetupWizard({ isOpen, onClose, onStartGame }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    slave: {
      profileId: 'fresh-meat',
      profileType: 'preset',
      overrides: {}
    },
    npcs: [
      { profileId: 'sandy', required: true },
      { profileId: 'araph' },
      { profileId: 'nancy' },
      { profileId: 'aish' },
      { profileId: 'gaya' },
      { profileId: 'melissa' }
    ],
    rules: scenarioService.getDefaultRules()
  });
  const [saveAsScenario, setSaveAsScenario] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Update slave selection
  const handleSlaveChange = useCallback((slaveData) => {
    setSetupData(prev => ({
      ...prev,
      slave: slaveData
    }));
  }, []);

  // Update NPC selection
  const handleNpcsChange = useCallback((npcs) => {
    setSetupData(prev => ({
      ...prev,
      npcs
    }));
  }, []);

  // Update rules
  const handleRulesChange = useCallback((rules) => {
    setSetupData(prev => ({
      ...prev,
      rules
    }));
  }, []);

  // Navigation
  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0: // Slave selection
        return setupData.slave.profileId !== null;
      case 1: // NPC selection
        return setupData.npcs.length >= 1 && setupData.npcs.some(n => n.profileId === 'sandy');
      case 2: // Rules
        return true; // Rules always have defaults
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  // Start game
  const handleStartGame = async () => {
    setIsStarting(true);
    
    try {
      // Save as scenario if requested
      if (saveAsScenario && scenarioName.trim()) {
        scenarioService.createScenario({
          name: scenarioName.trim(),
          description: `Custom scenario created ${new Date().toLocaleDateString()}`,
          slave: setupData.slave,
          npcs: setupData.npcs,
          rules: setupData.rules,
          tags: ['custom']
        });
      }

      // Build game config
      const gameConfig = scenarioService.buildGameConfigFromData({
        slave: setupData.slave,
        npcs: setupData.npcs,
        rules: setupData.rules
      });

      // Start the game
      await onStartGame(gameConfig);
      onClose();
    } catch (error) {
      console.error('Failed to start game:', error);
      alert(`Failed to start game: ${error.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  // Reset wizard
  const handleReset = () => {
    setCurrentStep(0);
    setSetupData({
      slave: {
        profileId: 'fresh-meat',
        profileType: 'preset',
        overrides: {}
      },
      npcs: [
        { profileId: 'sandy', required: true },
        { profileId: 'araph' },
        { profileId: 'nancy' },
        { profileId: 'aish' },
        { profileId: 'gaya' },
        { profileId: 'melissa' }
      ],
      rules: scenarioService.getDefaultRules()
    });
    setSaveAsScenario(false);
    setScenarioName('');
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <SlaveSelector
            selectedSlave={setupData.slave}
            onChange={handleSlaveChange}
          />
        );
      case 1:
        return (
          <NpcSelector
            selectedNpcs={setupData.npcs}
            onChange={handleNpcsChange}
          />
        );
      case 2:
        return (
          <RulesConfigurator
            rules={setupData.rules}
            onChange={handleRulesChange}
          />
        );
      case 3:
        return (
          <SetupReview
            setupData={setupData}
            saveAsScenario={saveAsScenario}
            onSaveAsScenarioChange={setSaveAsScenario}
            scenarioName={scenarioName}
            onScenarioNameChange={setScenarioName}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col h-[80vh] max-h-[900px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">New Game Setup</h2>
            <p className="text-sm text-text-secondary mt-1">
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 p-4 bg-background-secondary/50">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => index < currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${index === currentStep 
                    ? 'bg-accent-primary text-white' 
                    : index < currentStep 
                      ? 'bg-accent-primary/30 text-accent-primary cursor-pointer hover:bg-accent-primary/50' 
                      : 'bg-white/10 text-text-muted cursor-not-allowed'
                  }
                `}
              >
                {index + 1}
              </button>
              {index < STEPS.length - 1 && (
                <div className={`
                  w-12 h-0.5 mx-1
                  ${index < currentStep ? 'bg-accent-primary/50' : 'bg-white/10'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-background-secondary/50">
          <div>
            {currentStep > 0 && (
              <Button variant="ghost" onClick={goBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button 
                variant="primary" 
                onClick={goNext}
                disabled={!canGoNext()}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                variant="primary" 
                onClick={handleStartGame}
                disabled={isStarting || !canGoNext()}
              >
                {isStarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Begin Game
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default GameSetupWizard;
