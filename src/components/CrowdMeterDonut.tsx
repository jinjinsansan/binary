import { useMemo } from 'react'
import { useStore } from '@/state/store'

export default function CrowdMeterDonut() {
  const { upCount, downCount } = useStore(s => s.crowd)
  const total = upCount + downCount
  const upRatio = total ? upCount / total : 0.5
  const size = 140
  const stroke = 16
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const upLen = c * upRatio
  const downLen = c - upLen

  const label = useMemo(() => `${upCount} UP / ${downCount} DOWN`, [upCount, downCount])

  return (
    <div className="card-glossy p-3 flex flex-col items-center">
      <div className="text-sm mb-2 text-white/80">Crowd</div>
      <svg width={size} height={size} className="block">
        <g transform={`translate(${size/2}, ${size/2}) rotate(-90)`}>
          <circle r={r} cx={0} cy={0} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <circle r={r} cx={0} cy={0} fill="none" stroke="#3b82f6" strokeWidth={stroke}
            strokeDasharray={`${upLen} ${c - upLen}`} strokeDashoffset={0} strokeLinecap="butt" />
          <circle r={r} cx={0} cy={0} fill="none" stroke="#ef4444" strokeWidth={stroke}
            strokeDasharray={`${downLen} ${c - downLen}`} strokeDashoffset={-upLen} strokeLinecap="butt" />
        </g>
      </svg>
      <div className="text-center -mt-10">
        <div className="text-xl font-semibold"><span className="text-blue-300">{Math.round(upRatio*100)}</span>% / <span className="text-red-300">{100-Math.round(upRatio*100)}</span>%</div>
        <div className="text-xs text-white/60">{label}</div>
      </div>
    </div>
  )
}

