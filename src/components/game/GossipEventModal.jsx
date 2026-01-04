/**
 * GossipEventModal.jsx
 * Modal notification when NPCs share information about the slave
 */

import { useEffect, useState } from 'react';
import { X, MessageCircle, Users, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { npcProfileService } from '../../services/NpcProfileService';

export function GossipEventModal({ event, onClose, autoClose = 4000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && autoClose > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!event) return null;

  const sourceNpc = npcProfileService.getNpc(event.sourceNpcId);
  const targetNpc = npcProfileService.getNpc(event.targetNpcId);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Get gossip flavor text
  const getGossipText = () => {
    const templates = [
      `${sourceNpc?.name} whispers something to ${targetNpc?.name}...`,
      `${sourceNpc?.name} and ${targetNpc?.name} exchange knowing glances.`,
      `You catch ${sourceNpc?.name} sharing notes with ${targetNpc?.name}.`,
      `${targetNpc?.name} smirks after ${sourceNpc?.name} whispers in her ear.`,
      `"You should try this..." ${sourceNpc?.name} tells ${targetNpc?.name}.`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
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
            className="pointer-events-auto w-full max-w-sm"
          >
            <div className="relative overflow-hidden rounded-lg shadow-2xl border border-purple-500/50 bg-background-elevated/95">
              {/* Glow effect */}
              <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-purple-500 to-pink-500" />

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
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Gossip...</h3>
                </div>

                {/* NPC transfer visual */}
                <div className="flex items-center justify-center gap-3 py-3">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
                      <Users className="w-6 h-6 text-text-muted" />
                    </div>
                    <span className="text-sm text-white">{sourceNpc?.name}</span>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-purple-400" />
                  
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
                      <Users className="w-6 h-6 text-text-muted" />
                    </div>
                    <span className="text-sm text-white">{targetNpc?.name}</span>
                  </div>
                </div>

                {/* Shared knowledge count */}
                <div className="text-center text-sm text-text-secondary mb-2">
                  {event.sharedCount} weakness{event.sharedCount !== 1 ? 'es' : ''} shared
                </div>

                {/* Flavor text */}
                <p className="text-sm text-text-secondary italic text-center">
                  "{getGossipText()}"
                </p>

                {/* Progress timer */}
                {autoClose > 0 && (
                  <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: autoClose / 1000, ease: 'linear' }}
                      className="h-full bg-purple-500/50"
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

export default GossipEventModal;
