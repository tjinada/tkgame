import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showClose = true,
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              relative w-full ${sizes[size]} 
              bg-background-secondary border border-background-elevated 
              rounded-xl shadow-2xl overflow-hidden
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-background-tertiary">
                {title && (
                  <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-background-tertiary transition-colors text-text-muted hover:text-text-primary"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Modal
