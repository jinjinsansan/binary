import { useMemo } from 'react'
import { useStore } from '@/state/store'

export default function CrowdMeter() {
  const { upCount, downCount } = useStore(s => s.crowd)
  const total = upCount + downCount
  const upPct = total ? (upCount / total) * 100 : 50
  const downPct = 100 - upPct
  const label = useMemo(() => `${upCount} UP / ${downCount} DOWN`, [upCount, downCount])

  return (
    <div className="card-glossy p-3">
      <div className="text-sm mb-2 text-white/80">Crowd</div>
      <div className="flex items-center gap-3">
        <div className="text-xs w-12 text-blue-300 text-right">{Math.round(upPct)}%</div>
        <div className="flex-1 h-4 bg-white/10 rounded overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: `${upPct}%` }} />
          <div className="h-full bg-red-500 -mt-4" style={{ width: `${downPct}%` }} />
        </div>
        <div className="text-xs w-12 text-red-300">{Math.round(downPct)}%</div>
      </div>
      <div className="mt-2 text-center text-xs text-white/60">{label}</div>
    </div>
  )
}

