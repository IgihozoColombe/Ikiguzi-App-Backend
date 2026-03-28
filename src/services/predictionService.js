function pseudoRandom(seed) {
  let t = seed + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function basePriceByCropName(name) {
  const n = String(name || '').toLowerCase()
  if (n.includes('coffee')) return 2300
  if (n.includes('beans')) return 850
  if (n.includes('rice')) return 780
  if (n.includes('maize') || n.includes('corn')) return 520
  return 600
}

function predictPrice({ cropName, cropId, windowDays = 14 }) {
  const base = basePriceByCropName(cropName)
  const seed = Number(String(cropId || '').slice(-6), 16) ^ windowDays
  const noise = pseudoRandom(seed) * 0.14 - 0.07 // -7%..+7%

  const predictedPriceRwfPerKg = Math.round(base * (1 + noise))
  const confidence = Math.max(0.55, Math.min(0.9, 0.85 - Math.abs(noise)))

  return { predictedPriceRwfPerKg, confidence }
}

module.exports = { predictPrice }

