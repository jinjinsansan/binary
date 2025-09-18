import { useMemo } from 'react'
import { useStore, Cell } from '@/state/store'

const ROWS = 6
const COLS = 30

export default function Roads() {
  const roads = useStore(s => s.roads)
  const grid = useMemo(() => buildGrid(roads), [roads])

  return (
    <div className="card-glossy p-2 overflow-x-auto scrollbar-thin">
      <div className="min-w-max">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? COLS}, 18px)`, gridTemplateRows: `repeat(${ROWS}, 18px)` }}>
          {grid.flat().map((cell, idx) => (
            <div key={idx} className="w-[18px] h-[18px] flex items-center justify-center">
              {cell && (
                <div className={`w-4 h-4 rounded-full ${cell.color === 'up' ? 'bg-blue-500' : 'bg-red-500'} relative`}>
                  {cell.ties > 0 && <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-green-400" />}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function buildGrid(roads: Cell[][]) {
  const cols = roads.length
  const viewCols = Math.max(COLS, cols)
  const grid: (Cell | null)[][] = Array.from({ length: ROWS }, () => Array(viewCols).fill(null))

  const sliceStart = Math.max(0, cols - COLS)
  const display = roads.slice(sliceStart)

  display.forEach((col, ci) => {
    for (let r = 0; r < ROWS; r++) {
      const cell = col[r]
      if (cell) grid[r][ci] = cell
    }
  })

  // rotate to row-major array of columns for CSS grid
  const rotated: (Cell | null)[][] = Array.from({ length: ROWS }, (_, r) => grid[r])
  // We need columns across the top dimension -> convert to column-major view by transposing when rendering via grid
  return rotated
}

