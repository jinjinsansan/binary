export function nextRandomWalk(prev: number, vol = 0.15) {
  // vol is percent-ish per step
  const sigma = vol / 100; // convert to ~fraction
  const noise = randn_bm() * sigma;
  const next = Math.max(0.0001, prev * (1 + noise));
  return Number(next.toFixed(2));
}

export function randn_bm() {
  // Box–Muller
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

