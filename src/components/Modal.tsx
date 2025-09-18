import { ReactNode, useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative card-glossy w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">{title}</div>
          <button className="px-2 py-1 bg-white/10 rounded" onClick={onClose}>×</button>
        </div>
        <div className="text-sm text-white/80">
          {children}
        </div>
      </div>
    </div>
  )
}

