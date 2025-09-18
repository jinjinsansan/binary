import { useMemo } from 'react'
import { useStore } from '@/state/store'
import { playBet } from '@/utils/sound'

export default function TableFelt() {
  const { phase, result } = useStore(s => s.round)
  const { up, down } = useStore(s => s.bets)
  const placeBet = useStore(s => s.placeBet)
  const settings = useStore(s => s.settings)

  const canBet = phase === 'betting'

  const upClasses = useMemo(() => [
    'felt-zone felt-up',
    phase === 'settle' && result === 'up' ? 'felt-win' : '',
    phase === 'settle' && result === 'down' ? 'felt-lose' : '',
  ].join(' '), [phase, result])

  const downClasses = useMemo(() => [
    'felt-zone felt-down',
    phase === 'settle' && result === 'down' ? 'felt-win' : '',
    phase === 'settle' && result === 'up' ? 'felt-lose' : '',
  ].join(' '), [phase, result])

  return (
    <div className="relative w-full card-glossy overflow-hidden" style={{ height: 300 }}>
      {/* felt background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_55%),radial-gradient(circle_at_50%_130%,rgba(0,0,0,0.6),rgba(0,0,0,0)_45%)]" />
      <div className="absolute inset-0 border-2 border-yellow-500/40 rounded-xl pointer-events-none" />

      {/* labels */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-yellow-300 tracking-[0.25em] text-xl font-semibold select-none">BTC/USD</div>

      {/* zones */}
      <div className={upClasses}
        onClick={() => { if (!canBet) return; placeBet('up'); if (settings.sounds) playBet(settings.volume) }}>
        <div className="zone-label">UP</div>
        <div className="zone-amt">{up.toFixed(2)} USDT</div>
      </div>
      <div className={downClasses}
        onClick={() => { if (!canBet) return; placeBet('down'); if (settings.sounds) playBet(settings.volume) }}>
        <div className="zone-label">DOWN</div>
        <div className="zone-amt">{down.toFixed(2)} USDT</div>
      </div>

      {/* tie note */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-green-300/80 select-none">TIE=REFUND</div>

      {/* place bottom strip on felt */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-3">
        <div id="felt-strip-placeholder" />
      </div>
    </div>
  )
}
