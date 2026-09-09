import { useCallback, useRef, useState } from 'react'
import type { ToastMessage, ToastType } from './Toast'

/** Lightweight toast queue, owned by whichever component calls the hook (App). */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current[id]
    if (timer) {
      clearTimeout(timer)
      delete timersRef.current[id]
    }
  }, [])

  const pushToast = useCallback(
    (type: ToastType, text: string, durationMs = 4500) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setToasts((prev) => [...prev, { id, type, text }])
      timersRef.current[id] = setTimeout(() => dismissToast(id), durationMs)
    },
    [dismissToast],
  )

  return { toasts, pushToast, dismissToast }
}
