class VoiceDisguiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferSize = 65536
    this.buffer = new Float32Array(this.bufferSize)
    this.writeIndex = 0
    this.readA = 0
    this.readB = 0
    this.phase = 0
    this.grainSize = 1024
    this.delaySamples = 3072
    this.pitch = 0.62
    this.ready = false
    this.seedSamples = 0

    this.port.onmessage = (event) => {
      const data = event.data || {}
      if (typeof data.pitch === 'number') {
        this.pitch = Math.max(0.45, Math.min(0.95, data.pitch))
      }
      if (typeof data.grainSize === 'number') {
        this.grainSize = Math.max(256, Math.min(2048, Math.floor(data.grainSize)))
      }
    }
  }

  readInterpolated(position) {
    let index = position
    while (index < 0) index += this.bufferSize
    while (index >= this.bufferSize) index -= this.bufferSize
    const i0 = Math.floor(index)
    const i1 = (i0 + 1) % this.bufferSize
    const frac = index - i0
    return this.buffer[i0] * (1 - frac) + this.buffer[i1] * frac
  }

  process(inputs, outputs) {
    const input = inputs[0]
    const output = outputs[0]
    if (!output || output.length === 0) return true

    const inputCh = input && input.length > 0 ? input[0] : null
    const outCh = output[0]

    for (let i = 0; i < outCh.length; i++) {
      const x = inputCh ? inputCh[i] : 0
      this.buffer[this.writeIndex] = x
      this.writeIndex = (this.writeIndex + 1) % this.bufferSize

      if (!this.ready) {
        this.seedSamples += 1
        outCh[i] = x * 0.25
        if (this.seedSamples > this.delaySamples + this.grainSize) {
          this.ready = true
          this.readA = this.writeIndex - this.delaySamples
          if (this.readA < 0) this.readA += this.bufferSize
          this.readB = (this.readA + this.grainSize / 2) % this.bufferSize
          this.phase = 0
        }
        continue
      }

      const a = this.readInterpolated(this.readA)
      const b = this.readInterpolated(this.readB)

      const winB = 0.5 - 0.5 * Math.cos(2 * Math.PI * this.phase)
      const winA = 1 - winB
      let y = a * winA + b * winB

      // Small saturation keeps the disguised voice stable.
      y = Math.tanh(2.6 * y)
      outCh[i] = y

      this.readA += this.pitch
      this.readB += this.pitch
      if (this.readA >= this.bufferSize) this.readA -= this.bufferSize
      if (this.readB >= this.bufferSize) this.readB -= this.bufferSize

      this.phase += 1 / this.grainSize
      if (this.phase >= 1) {
        this.phase -= 1
        this.readA = this.readB
        this.readB = this.readA + this.grainSize / 2
        if (this.readB >= this.bufferSize) this.readB -= this.bufferSize
      }
    }

    return true
  }
}

registerProcessor('voice-disguise-processor', VoiceDisguiseProcessor)
