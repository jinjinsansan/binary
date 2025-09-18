import { create } from 'zustand'

export type Side = 'up' | 'down'
export type Phase = 'intermission' | 'betting' | 'lock' | 'pricing' | 'settle'

const ROUND_SECONDS = Number(import.meta.env.VITE_ROUND_SECONDS ?? 12)
const INTERMISSION_SECONDS = Number(import.meta.env.VITE_INTERMISSION_SECONDS ?? 3)
const PAYOUT = Number(import.meta.env.VITE_PAYOUT ?? 1.95)
const BOT_BIAS_ENV = Number(import.meta.env.VITE_BOT_BIAS ?? 0.2) // -1..+1

export type RoundState = {
  roundId: number
  phase: Phase
  secondsRemaining: number
  startPrice: number
  price: number
  closePrice: number | null
  result: Side | 'tie' | null
  series: number[] // for chart
}

export type Bets = {
  up: number
  down: number
}

export type Crowd = {
  upCount: number
  downCount: number
}

export type Cell = { color: Side, ties: number }

export type Store = {
  round: RoundState
  bets: Bets
  balance: number
  crowd: Crowd
  roads: Cell[][] // columns of rows
  selectedChip: number
  settings: Settings
  // actions
  tick: () => void
  placeBet: (side: Side) => void
  setChip: (v: number) => void
  resetForNextRound: (startPrice: number) => void
  settle: () => void
  addCrowdBot: (side: Side) => void
  appendPrice: (p: number) => void
  startBetting: () => void
  finalizePricing: () => void
  setSetting: (partial: Partial<Settings>) => void
  getBotSide: (prev: Side | 'tie' | null) => Side
}

const persistedBalance = Number(localStorage.getItem('balance_usdt') ?? 1000)
const persistedRoads: Cell[][] = (() => {
  try { return JSON.parse(localStorage.getItem('roads_big') || '[]') } catch { return [] }
})()
type Settings = { vol: number; botBias: number; volume: number; sounds: boolean }
const persistedSettings: Settings = (() => {
  try { return JSON.parse(localStorage.getItem('settings_v1') || 'null') || null } catch { return null as any }
})() || { vol: 0.2, botBias: isNaN(BOT_BIAS_ENV) ? 0.2 : BOT_BIAS_ENV, volume: 0.6, sounds: true }

function initialRound(): RoundState {
  const p = 65000 + Math.floor(Math.random() * 1000)
  return {
    roundId: Date.now(),
    phase: 'intermission',
    secondsRemaining: INTERMISSION_SECONDS,
    startPrice: p,
    price: p,
    closePrice: null,
    result: null,
    series: [p]
  }
}

export const useStore = create<Store>((set, get) => ({
  round: initialRound(),
  bets: { up: 0, down: 0 },
  balance: isNaN(persistedBalance) ? 1000 : persistedBalance,
  crowd: { upCount: 0, downCount: 0 },
  roads: persistedRoads,
  selectedChip: 5,
  settings: persistedSettings,

  setChip: (v) => set({ selectedChip: v }),

  placeBet: (side) => {
    const { phase } = get().round
    if (phase !== 'betting') return
    const chip = get().selectedChip
    const bets = { ...get().bets }
    const pending = bets.up + bets.down
    const available = get().balance - pending
    if (chip > available) return
    bets[side] += chip
    set({ bets })
  },

  addCrowdBot: (side) => set((s) => {
    const key = side === 'up' ? 'upCount' : 'downCount'
    return { crowd: { ...s.crowd, [key]: s.crowd[key] + 1 } as Crowd }
  }),

  appendPrice: (p: number) => set((s) => ({ round: { ...s.round, price: p, series: [...s.round.series, p] } })),

  startBetting: () => set((s) => ({ round: { ...s.round, phase: 'betting', secondsRemaining: ROUND_SECONDS, startPrice: s.round.price, series: [s.round.price] }, bets: { up: 0, down: 0 }, crowd: { upCount: 0, downCount: 0 } })),

  finalizePricing: () => set((s) => {
    const close = s.round.price
    const start = s.round.startPrice
    let res: Side | 'tie' = 'tie'
    if (close > start) res = 'up'
    else if (close < start) res = 'down'
    const newRoads = pushResultToRoads([...s.roads.map(col => col.slice())], res)
    return { round: { ...s.round, closePrice: close, result: res }, roads: newRoads }
  }),

  tick: () => {
    const st = get().round
    let { phase, secondsRemaining } = st
    if (secondsRemaining > 0) {
      set({ round: { ...st, secondsRemaining: secondsRemaining - 1 } })
      return
    }
    // transition
    if (phase === 'intermission') {
      get().startBetting()
    } else if (phase === 'betting') {
      // lock 演出へ
      set({ round: { ...st, phase: 'lock', secondsRemaining: 1 } })
    } else if (phase === 'lock') {
      // pricing 演出
      set({ round: { ...st, phase: 'pricing', secondsRemaining: 1 } })
    } else if (phase === 'pricing') {
      // settle now
      get().finalizePricing()
      get().settle()
    } else if (phase === 'settle' || phase === 'lock') {
      // move to intermission
      set({ round: { ...st, phase: 'intermission', secondsRemaining: INTERMISSION_SECONDS } })
    }
  },

  settle: () => {
    const st = get().round
    const { up, down } = get().bets
    const change = computePnl(up, down, st.result, PAYOUT)
    const newBalance = Math.max(0, get().balance + change)
    set({ balance: newBalance, round: { ...st, phase: 'settle', secondsRemaining: 1 } })
    localStorage.setItem('balance_usdt', String(newBalance))
    // persist roads
    const roads = get().roads
    localStorage.setItem('roads_big', JSON.stringify(roads))
  },

  resetForNextRound: (startPrice: number) => {
    const next: RoundState = {
      roundId: Date.now(),
      phase: 'intermission',
      secondsRemaining: INTERMISSION_SECONDS,
      startPrice,
      price: startPrice,
      closePrice: null,
      result: null,
      series: [startPrice],
    }
    set({ round: next, bets: { up: 0, down: 0 }, crowd: { upCount: 0, downCount: 0 } })
  },

  setSetting: (partial) => set((s) => {
    const settings = { ...s.settings, ...partial }
    localStorage.setItem('settings_v1', JSON.stringify(settings))
    return { settings }
  }),

  getBotSide: (prev) => botSide(prev, get().settings.botBias),
}))

function computePnl(up: number, down: number, result: Side | 'tie' | null, payout: number) {
  if (!result || result === 'tie') return 0
  const win = result === 'up' ? up : down
  const lose = result === 'up' ? down : up
  return win * payout - lose
}

// Helpers for roads (Big Road)
export function pushResultToRoads(roads: Cell[][], result: Side | 'tie') {
  if (result === 'tie') {
    // add tie marker to last cell if exists
    if (roads.length > 0) {
      const lastCol = roads[roads.length - 1]
      for (let r = 0; r < lastCol.length; r++) {
        const cell = lastCol[r]
        if (cell) { cell.ties = (cell.ties || 0) + 1; break }
      }
    }
    return roads
  }

  // Big Road placement
  const ROWS = 6
  let colIdx = roads.length - 1
  let rowIdx = 0
  let sameAsPrev = false

  let prevColor: Side | null = null
  if (roads.length > 0) {
    const lastCol = roads[roads.length - 1]
    const topCell = lastCol.find(c => !!c)
    if (topCell) prevColor = topCell.color
  }

  if (prevColor === result) {
    sameAsPrev = true
  }

  function ensureCol(i: number) {
    while (roads.length <= i) roads.push(new Array(ROWS).fill(null as any))
  }

  if (!sameAsPrev) {
    // start new column
    colIdx = roads.length
    ensureCol(colIdx)
    rowIdx = 0
    roads[colIdx][rowIdx] = { color: result, ties: 0 }
    return roads
  }

  // place in same column going down; if blocked/bottom then move to next column same row
  colIdx = roads.length - 1
  const col = roads[colIdx]
  // find current stack height for this column, i.e., last filled row for this color
  let height = 0
  for (let i = 0; i < ROWS; i++) if (col[i]) height = i + 1

  if (height < ROWS && !col[height]) {
    col[height] = { color: result, ties: 0 }
  } else {
    // move right
    const targetRow = height - 1
    ensureCol(colIdx + 1)
    roads[colIdx + 1][targetRow] = { color: result, ties: 0 }
  }
  return roads
}

// Bot crowd decision helper
export function botSide(prev: Side | 'tie' | null, bias = 0.2): Side {
  let p = 0.5
  if (prev === 'up') p = 0.5 + 0.3 * clamp(bias, -1, 1)
  else if (prev === 'down') p = 0.5 - 0.3 * clamp(bias, -1, 1)
  return Math.random() < p ? 'up' : 'down'
}

function clamp(n: number, a: number, b: number) { return Math.min(b, Math.max(a, n)) }

export { ROUND_SECONDS, INTERMISSION_SECONDS, PAYOUT }
