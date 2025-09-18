import { useEffect, useMemo, useRef, useState } from 'react'
import PriceChartCanvas from '@/components/PriceChartCanvas'
import BetPanel from '@/components/BetPanel'
import CrowdMeterDonut from '@/components/CrowdMeterDonut'
import Roads from '@/components/Roads'
import BalanceBar from '@/components/BalanceBar'
import Modal from '@/components/Modal'
import SettingsPanel from '@/components/SettingsPanel'
import { useStore } from '@/state/store'
import { nextRandomWalk } from '@/utils/randomWalk'
import { playLock, playLose, playTie, playWin } from '@/utils/sound'
import TableFelt from '@/components/TableFelt'
import BettingStrip from '@/components/BettingStrip'

export default function App() {
  const round = useStore(s => s.round)
  const bets = useStore(s => s.bets)
  const tick = useStore(s => s.tick)
  const appendPrice = useStore(s => s.appendPrice)
  const addCrowdBot = useStore(s => s.addCrowdBot)
  const resetForNextRound = useStore(s => s.resetForNextRound)
  const roads = useStore(s => s.roads)
  const balance = useStore(s => s.balance)
  const settings = useStore(s => s.settings)
  const getBotSide = useStore(s => s.getBotSide)

  const [toast, setToast] = useState<string | null>(null)
  const animationRef = useRef<number | null>(null)
  const botTimerRef = useRef<number | null>(null)
  const [openLobby, setOpenLobby] = useState(false)
  const [openTables, setOpenTables] = useState(false)
  const [openSettings, setOpenSettings] = useState(false)

  // Round clock
  useEffect(() => {
    const id = setInterval(() => tick(), 1000)
    return () => clearInterval(id)
  }, [tick])

  // Price animation (always running for dealer area)
  useEffect(() => {
    const run = (ts: number) => {
      const fpsInterval = 1000 / 12
      let prev = (run as any)._prev || ts
      if (ts - prev >= fpsInterval) {
        (run as any)._prev = ts
        const last = round.series[round.series.length - 1] ?? round.price
        const next = nextRandomWalk(last, settings.vol)
        appendPrice(next)
        // no-op
      }
      animationRef.current = requestAnimationFrame(run)
    }
    animationRef.current = requestAnimationFrame(run)
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [round.phase, round.series, appendPrice, settings.vol])

  // Crowd bot arrivals with Poisson process + final spike
  useEffect(() => {
    const clearBot = () => { if (botTimerRef.current) window.clearTimeout(botTimerRef.current) }
    clearBot()
    if (round.phase !== 'betting') return

    const scheduleNext = () => {
      const isSpike = round.secondsRemaining <= 3
      const lambda = isSpike ? 3.5 : 1.2 // arrivals per second
      const waitMs = expSample(lambda) * 1000
      botTimerRef.current = window.setTimeout(() => {
        // pick side with bias
        const prevCol = roads[roads.length - 1]
        let prev: any = null
        if (prevCol) {
          const c = prevCol.find(Boolean)
          prev = c?.color ?? null
        }
        const side = getBotSide(prev)
        addCrowdBot(side)
        // schedule more aggressively near end
        scheduleNext()
      }, Math.max(30, waitMs)) as any
    }
    scheduleNext()
    return clearBot
  }, [round.phase, round.secondsRemaining, roads, addCrowdBot, getBotSide])

  // Toast on settle
  useEffect(() => {
    if (round.phase !== 'settle' || round.result == null) return
    const { up, down } = bets
    let msg = ''
    if (round.result === 'tie') msg = 'TIE - Refund'
    else {
      const win = round.result === 'up' ? up : down
      const lose = round.result === 'up' ? down : up
      const delta = win * (Number(import.meta.env.VITE_PAYOUT ?? 1.95)) - lose
      msg = delta >= 0 ? `WIN +${delta.toFixed(2)} USDT` : `LOSE ${delta.toFixed(2)} USDT`
    }
    setToast(msg)
    if (settings.sounds) {
      if (round.result === 'tie') playTie(settings.volume)
      else {
        const win = round.result === 'up' ? bets.up : bets.down
        const lose = round.result === 'up' ? bets.down : bets.up
        const delta = win * (Number(import.meta.env.VITE_PAYOUT ?? 1.95)) - lose
        if (delta >= 0) playWin(settings.volume)
        else playLose(settings.volume)
      }
    }
    const t = setTimeout(() => setToast(null), 2200)
    // prepare next round start price based on last price after intermission
    const startNextAt = setTimeout(() => {
      resetForNextRound(round.price)
    }, 1000)
    return () => { clearTimeout(t); clearTimeout(startNextAt) }
  }, [round.phase])

  const countdown = useMemo(() => round.secondsRemaining, [round.secondsRemaining])

  useEffect(() => {
    if (round.phase === 'lock' && settings.sounds) playLock(settings.volume)
  }, [round.phase, settings.sounds, settings.volume])

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-3">
      {/* Z1 Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold tracking-wide">BTC/USD バカラ風テーブル</div>
          <div className="text-xs text-white/60">Game #{round.roundId}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 bg-white/10 rounded border border-white/20" onClick={() => setOpenSettings(true)}>⚙︎</button>
          <div className="w-16 h-16 rounded-full bg-gradient-to-b from-casino-red to-casino-redDark shadow-glossy border border-white/20 flex items-center justify-center">
            <div className="text-lg font-bold">{countdown}</div>
          </div>
        </div>
      </div>

      {/* Z2 Dealer Area - Chart */}
      <PriceChartCanvas />

      {/* Z3 Felt Table + Controls */}
      <div className="relative">
        <TableFelt />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <BettingStrip />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <BetPanel />
        <CrowdMeterDonut />
      </div>

      {/* Z4 Roads */}
      <Roads />

      {/* Z5 Footer */}
      <BalanceBar onOpenLobby={() => setOpenLobby(true)} onOpenTables={() => setOpenTables(true)} />

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 bottom-20 bg-black/70 border border-white/20 rounded-lg px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}

      {round.phase === 'lock' && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative card-glossy px-6 py-4 text-2xl font-bold tracking-wider animate-pulse">LOCK</div>
        </div>
      )}

      {/* Lobby Modal (ダミー) */}
      <Modal open={openLobby} onClose={() => setOpenLobby(false)} title="ロビー（ダミー）">
        <p>複数テーブルのロビーUI準備中。</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>BTC/USD テーブル（現在）</li>
          <li>ETH/USD テーブル（準備中）</li>
          <li>XAU/USD テーブル（準備中）</li>
        </ul>
      </Modal>

      {/* +Table Modal (ダミー) */}
      <Modal open={openTables} onClose={() => setOpenTables(false)} title="+ テーブル（ダミー）">
        <p>新規テーブル作成のモック。ベット通貨はUSDTのみ。</p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {['BTC/USD','ETH/USD','EUR/USD','XAU/USD'].map(s => (
            <div key={s} className="card-glossy p-2 text-sm">{s}</div>
          ))}
        </div>
      </Modal>

      <SettingsPanel open={openSettings} onClose={() => setOpenSettings(false)} />
    </div>
  )
}

function expSample(lambda: number) {
  // exponential interarrival
  const u = Math.random()
  return -Math.log(1 - u) / Math.max(0.0001, lambda)
}
