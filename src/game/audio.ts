let ctx: AudioContext | null = null
let pad: OscillatorNode | null = null
let padGain: GainNode | null = null

function context() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function armAudio() {
  context()
}

export function blip(kind: 'ok' | 'bad' | 'ui' | 'xp', muted: boolean) {
  if (muted) return
  const audio = context()
  const tone = audio.createOscillator()
  const gain = audio.createGain()
  tone.type = kind === 'bad' ? 'sawtooth' : 'square'
  const freq = kind === 'ok' ? 640 : kind === 'bad' ? 120 : kind === 'xp' ? 880 : 390
  tone.frequency.value = freq
  gain.gain.setValueAtTime(0.035, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.12)
  tone.connect(gain).connect(audio.destination)
  tone.start()
  tone.stop(audio.currentTime + 0.13)
}

export function setAmbient(on: boolean, muted: boolean) {
  const audio = context()
  if (!pad) {
    pad = audio.createOscillator()
    padGain = audio.createGain()
    pad.type = 'sine'
    pad.frequency.value = 52
    padGain.gain.value = 0
    pad.connect(padGain).connect(audio.destination)
    pad.start()
  }
  padGain?.gain.setTargetAtTime(on && !muted ? 0.012 : 0, audio.currentTime, 0.08)
}
