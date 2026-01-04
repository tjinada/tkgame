/**
 * DiscoveryEventModal.jsx
 * Modal notification when an NPC discovers a weakness
 */

import { useEffect, useState } from 'react';
import { X, AlertTriangle, Eye, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { npcProfileService } from '../../services/NpcProfileService';
import discoveryRules from '../../data/discoveryRules.json';
import activitiesData from '../../data/activities.json';
import bodyPartsData from '../../data/bodyParts.json';

export function DiscoveryEventModal({ event, onClose, autoClose = 5000 }) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-close timer
  useEffect(() => {
    if (autoClose && autoClose > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!event) return null;

  const npc = npcProfileService.getNpc(event.npcId);
  const activity = activitiesData.activities.find(a => a.id === event.activityId);
  const bodyPart = bodyPartsData.bodyParts.find(bp => bp.id === event.bodyPartId);
  const newLevel = discoveryRules.knowledgeLevels[event.newLevel];

  // Get flavor text based on level
  const getFlavorText = () => {
    if (!npc) return event.narrative;
    
    const hints = newLevel?.narrativeHints || [];
    if (hints.length > 0) {
      const hint = hints[Math.floor(Math.random() * hints.length)];
      return hint.replace('{npc}', npc.name);
    }
    
    return event.narrative;
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none"
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="pointer-events-auto w-full max-w-md"
          >
            <div 
              className="relative overflow-hidden rounded-lg shadow-2xl border"
              style={{ 
                backgroundColor: 'rgba(15, 15, 20, 0.95)',
                borderColor: newLevel?.color || '#ef4444'
              }}
            >
              {/* Glow effect */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{ 
                  background: `radial-gradient(circle at center, ${newLevel?.color || '#ef4444'} 0%, transparent 70%)`
                }}
              />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 p-1 text-text-secondary hover:text-white transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="relative p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${newLevel?.color}20` }}
                  >
                    <Eye className="w-5 h-5" style={{ color: newLevel?.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {event.levelChanged ? 'Weakness Discovered!' : 'Growing Suspicion'}
                    </h3>
                    <p className="text-sm" style={{ color: newLevel?.color }}>
                      {npc?.name || 'A Mistress'} now: {newLevel?.name}
                    </p>
                  </div>
                </div>

                {/* What was discovered */}
                <div className="p-3 bg-white/5 rounded-lg mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-text-muted" />
                    <span className="text-text-secondary">Weakness:</span>
                    <span className="text-white font-medium">
                      {activity?.name || event.activityId}
                      {bodyPart && bodyPart.id !== 'any' && bodyPart.id !== 'fullBody' && (
                        <span className="text-text-muted"> ({bodyPart.name})</span>
                      )}
                    </span>
                  </div>
                  
                  {/* Confidence bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                      <span>Knowledge</span>
                      <span>{event.previousConfidence}% → {event.newConfidence}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${event.newConfidence}%`,
                          backgroundColor: newLevel?.color
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Flavor text */}
                <p className="text-sm text-text-secondary italic">
                  "{getFlavorText()}"
                </p>

                {/* Warning for high levels */}
                {(event.newLevel === 'confirmed' || event.newLevel === 'mastered') && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">
                      {event.newLevel === 'mastered' 
                        ? `${npc?.name} will devastatingly exploit this weakness.`
                        : `${npc?.name} will actively target this vulnerability.`
                      }
                    </p>
                  </div>
                )}

                {/* Progress bar timer */}
                {autoClose > 0 && (
                  <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: autoClose / 1000, ease: 'linear' }}
                      className="h-full bg-white/30"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DiscoveryEventModal;
