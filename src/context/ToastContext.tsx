import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastContextValue = { show: (message: string) => void }
const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback((message: string) => {
    clearTimeout(timer.current)
    setToast(message)
    timer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  return <ToastContext.Provider value={{ show }}>
    {children}
    {toast && <div className="toast-pop bg-dark text-white px-4 py-2 fw-semibold small" role="status">{toast}</div>}
  </ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
