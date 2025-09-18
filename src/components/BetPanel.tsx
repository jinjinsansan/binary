import { useEffect, useMemo } from 'react'
import { useStore, ROUND_SECONDS } from '@/state/store'
import { playBet } from '@/utils/sound'

const CHIPS = [1, 5, 10, 50, 100]

export default function BetPanel() {
  const { phase, secondsRemaining, result } = useStore(s => s.round)
  const { up, down } = useStore(s => s.bets)
  const chip = useStore(s => s.selectedChip)
  const balance = useStore(s => s.balance)
  const setChip = useStore(s => s.setChip)
  const settings = useStore(s => s.settings)
  const placeBet = useStore(s => s.placeBet)

  const total = up + down
  const available = balance - total
  const disabled = phase !== 'betting'

  const progress = useMemo(() => {
    if (phase !== 'betting') return 0
    return 1 - secondsRemaining / ROUND_SECONDS
  }, [phase, secondsRemaining])

  // キーバインド: ↑=UP, ↓=DOWN, 1/5/10=チップ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'betting') {
        if (e.key === 'ArrowUp') { e.preventDefault(); placeBet('up'); if (settings.sounds) playBet(settings.volume); return }
        if (e.key === 'ArrowDown') { e.preventDefault(); placeBet('down'); if (settings.sounds) playBet(settings.volume); return }
      }
      if (e.key === '1') { setChip(1); return }
      if (e.key === '5') { setChip(5); return }
      // 10 は '0' キーを代替とし、'!'(Shift+1) も 10 に割当
      if (e.key === '0' || e.key === '!') { setChip(10); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, placeBet, setChip])

  return (
    <div className="card-glossy p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/70">Betting {phase === 'betting' ? `${secondsRemaining}s` : ''}</div>
        <div className="text-sm">My Bet: <span className="font-bold">{total.toFixed(2)} USDT</span></div>
      </div>
      <div className="w-full h-1 bg-white/10 rounded">
        <div className="h-full bg-gradient-to-r from-blue-500 to-red-500 rounded" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="flex items-center gap-3">
        <button className={`btn btn-up btn-metallic flex-1 text-xl ${phase==='settle' && result==='up' ? 'glow-win-blue' : ''} ${phase==='settle' && result==='down' ? 'dim-lose' : ''}`}
          disabled={disabled || available <= 0} onClick={() => { placeBet('up'); if (settings.sounds) playBet(settings.volume) }}>UP</button>
        <button className={`btn btn-down btn-metallic flex-1 text-xl ${phase==='settle' && result==='down' ? 'glow-win-red' : ''} ${phase==='settle' && result==='up' ? 'dim-lose' : ''}`}
          disabled={disabled || available <= 0} onClick={() => { placeBet('down'); if (settings.sounds) playBet(settings.volume) }}>DOWN</button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {CHIPS.map((c) => (
          <button key={c} className={`chip ${chip === c ? 'active' : ''}`} onClick={() => setChip(c)}>{c}</button>
        ))}
        <div className="ml-auto text-sm text-white/70">Available: {available.toFixed(2)} USDT</div>
      </div>
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="text-blue-300">UP: <span className="font-semibold">{up.toFixed(2)}</span></div>
        <div className="text-red-300">DOWN: <span className="font-semibold">{down.toFixed(2)}</span></div>
      </div>
      <div className="text-[11px] text-white/50 text-center">↑/↓ = BET、1/5/10 = チップ（10は0でも可）</div>
    </div>
  )
}
