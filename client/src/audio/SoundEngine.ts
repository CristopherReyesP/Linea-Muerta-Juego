// All sounds generated with Web Audio API - no external files needed

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// ── Background ambient drone ──────────────────────────────────

let ambientNodes: { gain: GainNode; oscs: OscillatorNode[] } | null = null

export function startAmbient() {
  if (ambientNodes) return
  const ctx = getCtx()

  const masterGain = ctx.createGain()
  masterGain.gain.value = 0
  masterGain.connect(ctx.destination)

  const oscs: OscillatorNode[] = []

  // Deep bass drone
  const bass = ctx.createOscillator()
  bass.type = 'sine'
  bass.frequency.value = 55
  const bassGain = ctx.createGain()
  bassGain.gain.value = 0.12
  bass.connect(bassGain).connect(masterGain)
  bass.start()
  oscs.push(bass)

  // Low mid tension
  const mid = ctx.createOscillator()
  mid.type = 'sine'
  mid.frequency.value = 82.4
  const midGain = ctx.createGain()
  midGain.gain.value = 0.06
  mid.connect(midGain).connect(masterGain)
  mid.start()
  oscs.push(mid)

  // Dissonant high harmonic
  const high = ctx.createOscillator()
  high.type = 'sine'
  high.frequency.value = 116.5 // slightly off from harmonic = tension
  const highGain = ctx.createGain()
  highGain.gain.value = 0.03
  high.connect(highGain).connect(masterGain)
  high.start()
  oscs.push(high)

  // Slow LFO on bass for pulsing effect
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.15 // very slow pulse
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.04
  lfo.connect(lfoGain).connect(bassGain.gain)
  lfo.start()
  oscs.push(lfo)

  // Filtered noise layer for atmosphere
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
  const noiseData = noiseBuffer.getChannelData(0)
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.5
  }
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer
  noise.loop = true
  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'lowpass'
  noiseFilter.frequency.value = 200
  noiseFilter.Q.value = 1
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.04
  noise.connect(noiseFilter).connect(noiseGain).connect(masterGain)
  noise.start()

  // Slow filter sweep on noise
  const sweepLfo = ctx.createOscillator()
  sweepLfo.type = 'sine'
  sweepLfo.frequency.value = 0.05
  const sweepGain = ctx.createGain()
  sweepGain.gain.value = 100
  sweepLfo.connect(sweepGain).connect(noiseFilter.frequency)
  sweepLfo.start()
  oscs.push(sweepLfo)

  // Fade in
  masterGain.gain.setTargetAtTime(1, ctx.currentTime, 2)

  ambientNodes = { gain: masterGain, oscs }
}

export function stopAmbient() {
  if (!ambientNodes || !audioCtx) return
  const ctx = audioCtx
  ambientNodes.gain.gain.setTargetAtTime(0, ctx.currentTime, 1)
  const nodes = ambientNodes
  ambientNodes = null
  setTimeout(() => {
    nodes.oscs.forEach(o => { try { o.stop() } catch {} })
    nodes.gain.disconnect()
  }, 3000)
}

// ── Phone ring sound ──────────────────────────────────────────

let ringInterval: ReturnType<typeof setInterval> | null = null
let ringGain: GainNode | null = null

export function startRing() {
  if (ringInterval) return
  const ctx = getCtx()

  ringGain = ctx.createGain()
  ringGain.gain.value = 0.2
  ringGain.connect(ctx.destination)

  const playBurst = () => {
    if (!ringGain) return
    const now = ctx.currentTime

    // Two-tone ring (classic phone)
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.value = 440

    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = 480

    const burstGain = ctx.createGain()
    burstGain.gain.value = 0

    osc1.connect(burstGain)
    osc2.connect(burstGain)
    burstGain.connect(ringGain)

    // Ring pattern: on 0.5s, off 0.2s, on 0.5s, off ~1.8s
    burstGain.gain.setValueAtTime(0.5, now)
    burstGain.gain.setValueAtTime(0, now + 0.5)
    burstGain.gain.setValueAtTime(0.5, now + 0.7)
    burstGain.gain.setValueAtTime(0, now + 1.2)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 1.3)
    osc2.stop(now + 1.3)
  }

  playBurst()
  ringInterval = setInterval(playBurst, 3000)
}

export function stopRing() {
  if (ringInterval) {
    clearInterval(ringInterval)
    ringInterval = null
  }
  if (ringGain) {
    ringGain.gain.setTargetAtTime(0, getCtx().currentTime, 0.1)
    const g = ringGain
    ringGain = null
    setTimeout(() => g.disconnect(), 500)
  }
}

// ── One-shot SFX ──────────────────────────────────────────────

export function playCallAccepted() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 600
  const gain = ctx.createGain()
  gain.gain.value = 0.15
  osc.connect(gain).connect(ctx.destination)
  const now = ctx.currentTime
  osc.frequency.setValueAtTime(600, now)
  osc.frequency.linearRampToValueAtTime(900, now + 0.1)
  gain.gain.setValueAtTime(0.15, now)
  gain.gain.setTargetAtTime(0, now + 0.15, 0.05)
  osc.start(now)
  osc.stop(now + 0.4)
}

export function playCallEnded() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 500
  const gain = ctx.createGain()
  gain.gain.value = 0.12
  osc.connect(gain).connect(ctx.destination)
  const now = ctx.currentTime
  osc.frequency.setValueAtTime(500, now)
  osc.frequency.linearRampToValueAtTime(300, now + 0.3)
  gain.gain.setValueAtTime(0.12, now)
  gain.gain.setTargetAtTime(0, now + 0.25, 0.08)
  osc.start(now)
  osc.stop(now + 0.5)
}

export function playPhaseChange() {
  const ctx = getCtx()
  const now = ctx.currentTime

  // Two quick beeps
  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 880
    const gain = ctx.createGain()
    gain.gain.value = 0.08
    osc.connect(gain).connect(ctx.destination)
    const t = now + i * 0.15
    gain.gain.setValueAtTime(0.08, t)
    gain.gain.setTargetAtTime(0, t + 0.08, 0.02)
    osc.start(t)
    osc.stop(t + 0.15)
  }
}

export function playBalanceUp() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  const gain = ctx.createGain()
  gain.gain.value = 0.1
  osc.connect(gain).connect(ctx.destination)
  const now = ctx.currentTime
  osc.frequency.setValueAtTime(400, now)
  osc.frequency.linearRampToValueAtTime(800, now + 0.2)
  gain.gain.setTargetAtTime(0, now + 0.15, 0.05)
  osc.start(now)
  osc.stop(now + 0.4)
}

export function playBalanceDown() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  const gain = ctx.createGain()
  gain.gain.value = 0.08
  osc.connect(gain).connect(ctx.destination)
  const now = ctx.currentTime
  osc.frequency.setValueAtTime(500, now)
  osc.frequency.linearRampToValueAtTime(150, now + 0.4)
  gain.gain.setTargetAtTime(0, now + 0.3, 0.08)
  osc.start(now)
  osc.stop(now + 0.6)
}

export function playShadowTransition() {
  const ctx = getCtx()
  const now = ctx.currentTime

  // Glitchy descending noise burst
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1)
  }
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1000
  filter.Q.value = 5
  const gain = ctx.createGain()
  gain.gain.value = 0.15
  noise.connect(filter).connect(gain).connect(ctx.destination)

  filter.frequency.setValueAtTime(2000, now)
  filter.frequency.linearRampToValueAtTime(100, now + 0.8)
  gain.gain.setTargetAtTime(0, now + 0.5, 0.15)

  noise.start(now)
  noise.stop(now + 1)
}
