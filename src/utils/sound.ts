let audioCtx: AudioContext | null = null
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return audioCtx!
}

export type SoundOpts = { volume?: number }

function beep(freq: number, ms: number, { volume = 0.5 }: SoundOpts = {}) {
  try {
    const c = ctx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.frequency.value = freq
    o.type = 'sine'
    g.gain.value = volume
    o.connect(g).connect(c.destination)
    const now = c.currentTime
    o.start(now)
    g.gain.setValueAtTime(volume, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + ms/1000)
    o.stop(now + ms/1000 + 0.02)
  } catch {}
}

export function playBet(volume = 0.5) { beep(880, 90, { volume }) }
export function playLock(volume = 0.5) { beep(440, 200, { volume }) }
export function playWin(volume = 0.5) { beep(1200, 300, { volume }) }
export function playLose(volume = 0.5) { beep(220, 250, { volume }) }
export function playTie(volume = 0.5) { beep(660, 180, { volume }) }

