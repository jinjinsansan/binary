import { useStore } from '@/state/store'

type Props = { onOpenLobby?: () => void; onOpenTables?: () => void }

export default function BalanceBar({ onOpenLobby, onOpenTables }: Props) {
  const balance = useStore(s => s.balance)
  return (
    <div className="card-glossy px-4 py-2 flex items-center justify-between text-sm">
      <div>Balance: <span className="font-semibold text-yellow-300">{balance.toFixed(2)} USDT</span></div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 rounded bg-white/10 border border-white/20" onClick={onOpenTables}>+Table</button>
        <button className="px-3 py-1 rounded bg-white/10 border border-white/20" onClick={onOpenLobby}>Lobby</button>
      </div>
    </div>
  )
}
