import { useEffect, useRef } from 'react'
import { useStore } from '@/state/store'

type Props = {
  height?: number
}

export default function PriceChartCanvas({ height = 220 }: Props) {
  const { series, startPrice, closePrice } = useStore(s => ({ series: s.round.series, startPrice: s.round.startPrice, closePrice: s.round.closePrice }))
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    // draw background
    ctx.clearRect(0, 0, rect.width, rect.height)
    const pad = 12
    const w = rect.width - pad * 2
    const h = rect.height - pad * 2
    const min = Math.min(...series)
    const max = Math.max(...series)
    const range = Math.max(1, max - min)
    const mapY = (p: number) => pad + h - ((p - min) / range) * h
    const mapX = (i: number) => pad + (i / Math.max(1, series.length - 1)) * w

    // baseline at start price
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(pad, mapY(startPrice))
    ctx.lineTo(pad + w, mapY(startPrice))
    ctx.stroke()
    ctx.setLineDash([])

    // gradient line
    const grad = ctx.createLinearGradient(pad, pad, pad + w, pad + h)
    grad.addColorStop(0, '#7dd3fc')
    grad.addColorStop(1, '#93c5fd')
    ctx.strokeStyle = grad
    ctx.lineWidth = 2
    ctx.beginPath()
    series.forEach((p, i) => {
      const x = mapX(i)
      const y = mapY(p)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // close marker with subtle pulse + reflection
    const marker = closePrice ?? series[series.length - 1]
    if (marker != null) {
      const x = mapX(series.length - 1)
      const y = mapY(marker)
      const win = marker >= startPrice
      const color = win ? '#60a5fa' : '#ef4444'
      // main dot
      ctx.fillStyle = color
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
      // outer glow ring (pulse)
      const t = Date.now() % 1200
      const phase = (Math.sin((t / 1200) * Math.PI * 2) + 1) / 2
      const r = 6 + phase * 4
      const g = ctx.createRadialGradient(x, y, 2, x, y, r)
      g.addColorStop(0, win ? 'rgba(96,165,250,0.35)' : 'rgba(239,68,68,0.35)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    }

    // reflection overlay (cheap)
    ctx.save()
    const gradTop = ctx.createLinearGradient(0, 0, 0, pad + h * 0.4)
    gradTop.addColorStop(0, 'rgba(255,255,255,0.18)')
    gradTop.addColorStop(1, 'rgba(255,255,255,0.03)')
    ctx.fillStyle = gradTop
    ctx.fillRect(pad, pad, w, h * 0.35)
    ctx.restore()
  }, [series, startPrice, closePrice])

  return (
    <div className="card-glossy w-full relative" style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full rounded-xl" />
      <div className="absolute inset-0 rounded-xl chart-reflection" />
    </div>
  )
}
