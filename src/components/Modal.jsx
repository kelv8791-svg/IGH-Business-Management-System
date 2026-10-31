import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  const sizeClass = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-4xl',
    xl: 'sm:max-w-6xl',
  }[size] || 'sm:max-w-2xl'

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`modal-content ${sizeClass} w-full max-h-[90vh] flex flex-col rounded-2xl overflow-hidden`}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E3E8EF',
          boxShadow: '0 20px 50px rgba(24, 42, 66, 0.18)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-4 flex-shrink-0"
          style={{
            background: '#F8FAFC',
            borderBottom: '1px solid #E3E8EF',
          }}
        >
          <h2
            className="text-base sm:text-lg font-semibold tracking-tight"
            style={{ color: '#182A42' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: '#69778A' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#EDF2F7'
              e.currentTarget.style.color = '#182A42'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#69778A'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div
          className="p-4 sm:p-6 flex-1 overflow-y-auto"
          style={{ background: 'var(--igh-surface-1)' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
