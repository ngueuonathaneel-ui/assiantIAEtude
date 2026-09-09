import React from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'

export interface ConfirmRequest {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
}

interface ConfirmDialogProps {
  request: ConfirmRequest | null
  onClose: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ request, onClose }) => {
  if (!request) return null

  const handleConfirm = () => {
    request.onConfirm()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container confirm-modal-size"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="modal-body">
          <div className="confirm-body">
            <div className={`confirm-icon-ring ${request.danger ? 'danger' : 'neutral'}`}>
              {request.danger ? <AlertTriangle size={26} /> : <HelpCircle size={26} />}
            </div>
            <h4>{request.title}</h4>
            <p>{request.message}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-cancel">
            {request.cancelLabel || 'Annuler'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={request.danger ? 'btn-solid-danger' : 'btn-save-keys'}
          >
            {request.confirmLabel || 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}
