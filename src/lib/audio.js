// WebAudio cues for the hold timer: recorded singing-bowl strikes (with a
// synthesized fallback) and a synthesized temple-block rest cue.

/**
 * Load the bowl recordings into WebAudio buffers on first user gesture.
 * Both are real Tibetan singing bowl strikes from Wikimedia Commons
 * (CC BY-SA 4.0), trimmed/faded to decay fully inside their rep window:
 *   /bowl10.m4a — 4.5" bowl (brighter, ~9.7s) for the 10s interval
 *   /bowl30.m4a — 11" bowl (deeper, ~16.4s) for the 30s interval
 * Sources: https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac
 *          https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_11inch.flac
 */
export async function ensureAudio(ref) {
  if (!ref.current) {
    const ctx = new AudioContext()
    ref.current = { ctx, buffers: {}, playing: new Set() }
    await Promise.all(
      [10, 30].map(async (secs) => {
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}bowl${secs}.m4a`)
          const data = await res.arrayBuffer()
          ref.current.buffers[secs] = await ctx.decodeAudioData(data)
        } catch {
          // Recording unavailable; chime() falls back to the synthesized bowl.
        }
      })
    )
  }
  ref.current.ctx.resume?.()
  return ref.current
}

/**
 * Play the recorded bowl strike for the given interval, or the synthesized
 * one if loading failed. Every strike is tracked in audio.playing so
 * silence() can fade it out.
 */
export function chime(audio, secs) {
  if (!audio) return
  const { ctx, buffers } = audio
  const buffer = buffers[secs] || buffers[10] || buffers[30]
  let entry
  if (buffer) {
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = 1.0
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start()
    entry = {
      stop: (t) => {
        try {
          src.stop(t)
        } catch {
          // already ended
        }
      },
      gain
    }
    src.onended = () => audio.playing.delete(entry)
  } else {
    entry = bowl(ctx)
  }
  audio.playing.add(entry)
}

/** Fade out and stop any still-ringing strikes (Stop shouldn't leave a 16s tail). */
export function silence(audio) {
  if (!audio) return
  const { ctx } = audio
  audio.playing.forEach(({ stop, gain }) => {
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08)
    stop(ctx.currentTime + 0.3)
  })
  audio.playing.clear()
}

/**
 * Synthesized singing-bowl fallback: inharmonic partials decaying at
 * different rates, each paired with a slightly detuned twin for the
 * slow beating shimmer of the real thing.
 */
function bowl(ctx) {
  if (!ctx) return { stop: () => {}, gain: { gain: { setTargetAtTime: () => {} } } }
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = 0.7
  master.connect(ctx.destination)
  const oscillators = []

  const f0 = 196 // ~G3: warm, low, gong-like
  const partials = [
    { ratio: 1, gain: 1.0, decay: 5 },
    { ratio: 2.005, gain: 0.55, decay: 4 },
    { ratio: 3.42, gain: 0.3, decay: 2.8 },
    { ratio: 5.43, gain: 0.18, decay: 1.8 },
    { ratio: 8.21, gain: 0.08, decay: 1.1 }
  ]

  partials.forEach(({ ratio, gain, decay }) => {
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(gain * 0.5, now + 0.025) // soft mallet attack
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay)
    g.connect(master)
    ;[1, 1.003].forEach((detune) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f0 * ratio * detune
      osc.connect(g)
      osc.start(now)
      osc.stop(now + decay + 0.1)
      oscillators.push(osc)
    })
  })

  return {
    stop: (t) =>
      oscillators.forEach((o) => {
        try {
          o.stop(t)
        } catch {
          // already ended
        }
      }),
    gain: master
  }
}

/**
 * Play the rest cue: three quick low temple-block taps that mark the end of a
 * hold and the start of the rest, distinct from the deep bowl that resumes the
 * next hold. Tracked in audio.playing so silence() can stop it.
 */
export function knock(audio) {
  if (!audio) return
  const entry = templeTriple(audio.ctx)
  audio.playing.add(entry)
}

/**
 * Synthesized temple block (muyu) struck three times in quick succession.
 * Each hit is a few low inharmonic wooden partials with a short ring plus a
 * band-limited noise transient for the contact "tok". Pitch/spacing/ring were
 * dialed in on the composer soundboard (E3 dropped a sixth, 0.1s apart).
 */
function templeTriple(ctx) {
  if (!ctx) return { stop: () => {}, gain: { gain: { setTargetAtTime: () => {} } } }
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = 0.85
  master.connect(ctx.destination)
  const nodes = []

  const f0 = 98.9 // low wooden thunk
  const gap = 0.1 // spacing between taps
  const ring = 0.6 // decay scale: short, no lingering tail
  const attack = 0.004
  const partials = [
    { ratio: 1, gain: 1.0, decay: 0.55 },
    { ratio: 2.76, gain: 0.45, decay: 0.32 },
    { ratio: 5.2, gain: 0.18, decay: 0.16 }
  ]

  for (let hit = 0; hit < 3; hit += 1) {
    const t0 = now + hit * gap
    partials.forEach(({ ratio, gain, decay }) => {
      const d = decay * ring
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(gain, t0 + attack)
      g.gain.setTargetAtTime(0, t0 + attack, d / 4)
      g.connect(master)
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f0 * ratio
      osc.connect(g)
      osc.start(t0)
      osc.stop(t0 + attack + d + 0.3)
      nodes.push(osc)
    })

    // Contact transient: a very short band-passed noise burst for the tap.
    const noiseLen = 0.025
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noiseLen), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1100
    bp.Q.value = 1.5
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.35, t0)
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + noiseLen)
    noise.connect(bp)
    bp.connect(ng)
    ng.connect(master)
    noise.start(t0)
    noise.stop(t0 + noiseLen + 0.05)
    nodes.push(noise)
  }

  return {
    stop: (t) =>
      nodes.forEach((n) => {
        try {
          n.stop(t)
        } catch {
          // already ended or scheduled past the stop time
        }
      }),
    gain: master
  }
}
