import { useMemo } from 'react'
import { useStore } from '@/state/store'
import { playBet } from '@/utils/sound'

export default function BettingStrip() {
  const { phase } = useStore(s => s.round)
  const { upCount, downCount } = useStore(s => s.crowd)
  const { up, down } = useStore(s => s.bets)
  const placeBet = useStore(s => s.placeBet)
  const chip = useStore(s => s.selectedChip)
  const setChip = useStore(s => s.setChip)
  const settings = useStore(s => s.settings)

  const total = upCount + downCount
  const upPct = total ? Math.round((upCount / total) * 100) : 0
  const downPct = total ? 100 - upPct : 0
  const canBet = phase === 'betting'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-stretch justify-center gap-2">
        <Panel color="blue" title="UP" pct={upPct} amount={up} disabled={!canBet}
          onClick={() => { if (!canBet) return; placeBet('up'); if (settings.sounds) playBet(settings.volume) }} />
        <Panel color="green" title="TIE" pct={0} amount={0} disabled={true} onClick={() => {}} />
        <Panel color="red" title="DOWN" pct={downPct} amount={down} disabled={!canBet}
          onClick={() => { if (!canBet) return; placeBet('down'); if (settings.sounds) playBet(settings.volume) }} />
      </div>
      <div className="flex items-center gap-2 justify-center">
        {[1,5,10,50,100].map(v => (
          <button key={v} onClick={() => setChip(v)}
            className={`chip ${chip===v?'active':''}`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

function Panel({ color, title, pct, amount, onClick, disabled }: { color: 'blue'|'red'|'green', title: string, pct: number, amount: number, onClick: () => void, disabled: boolean }) {
  const base = color === 'blue' ? 'from-blue-700 to-blue-500' : color === 'red' ? 'from-red-700 to-red-500' : 'from-emerald-700 to-emerald-500'
  return (
    <button disabled={disabled} onClick={onClick}
      className={`relative rounded-lg px-5 py-3 min-w-[180px] text-left shadow-glossy border border-white/20 bg-gradient-to-b ${base} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      <div className="text-xs text-white/80">{pct}%</div>
      <div className="text-2xl font-extrabold tracking-wider">{title}</div>
      <div className="text-xs text-white/80">My Bet: {amount.toFixed(2)} USDT</div>
    </button>
  )
}
