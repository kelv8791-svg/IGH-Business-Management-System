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
      style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`modal-content ${sizeClass} w-full max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 overflow-hidden`}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-4 flex-shrink-0 bg-slate-50/70 dark:bg-slate-900/70 border-b border-slate-100 dark:border-slate-800"
        >
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all"
          >
            <X size={19} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-white dark:bg-[#111827]">
          {children}
        </div>
      </div>
    </div>
  )
}
