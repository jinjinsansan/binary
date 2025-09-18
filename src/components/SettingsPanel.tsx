import { useStore } from '@/state/store'
import Modal from './Modal'

type Props = { open: boolean; onClose: () => void }

export default function SettingsPanel({ open, onClose }: Props) {
  const settings = useStore(s => s.settings)
  const setSetting = useStore(s => s.setSetting)
  return (
    <Modal open={open} onClose={onClose} title="設定">
      <div className="space-y-4">
        <div>
          <label className="text-sm">ボラティリティ（%/tick）: <span className="font-semibold">{settings.vol.toFixed(2)}</span></label>
          <input className="w-full" type="range" min={0.05} max={0.6} step={0.01} value={settings.vol} onChange={e => setSetting({ vol: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-sm">BOT_BIAS（-1〜+1）: <span className="font-semibold">{settings.botBias.toFixed(2)}</span></label>
          <input className="w-full" type="range" min={-1} max={1} step={0.01} value={settings.botBias} onChange={e => setSetting({ botBias: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-sm">音量: <span className="font-semibold">{Math.round(settings.volume*100)}%</span></label>
          <input className="w-full" type="range" min={0} max={1} step={0.01} value={settings.volume} onChange={e => setSetting({ volume: Number(e.target.value) })} />
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.sounds} onChange={e => setSetting({ sounds: e.target.checked })} />
          効果音を有効化
        </label>
      </div>
    </Modal>
  )
}

