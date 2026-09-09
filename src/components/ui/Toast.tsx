import React from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  text: string
}

const TOAST_ICON: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <AlertTriangle size={18} />,
  info: <Info size={18} />,
}

interface ToastStackProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.type}`} role="status">
          <span className="toast-icon">{TOAST_ICON[toast.type]}</span>
          <span className="toast-text">{toast.text}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(toast.id)}
            title="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
