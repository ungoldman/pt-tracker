import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chime, ensureAudio, knock, silence } from '../src/lib/audio'
import { fakeAudio } from './helpers'

let log
let FakeAudioContext

beforeEach(() => {
  ;({ log, FakeAudioContext } = fakeAudio())
  vi.stubGlobal('AudioContext', FakeAudioContext)
})

const recording = () => ({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })
const started = (kind) => log.filter((node) => node.kind === kind && node.start.mock.calls.length)

describe('ensureAudio', () => {
  it('loads both bowl recordings once and resumes the context every call', async () => {
    const fetch = vi.fn(() => Promise.resolve(recording()))
    vi.stubGlobal('fetch', fetch)
    const ref = { current: null }

    const audio = await ensureAudio(ref)
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      `${import.meta.env.BASE_URL}bowl10.m4a`,
      `${import.meta.env.BASE_URL}bowl30.m4a`
    ])
    expect(Object.keys(audio.buffers)).toEqual(['10', '30'])

    expect(await ensureAudio(ref)).toBe(audio)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(FakeAudioContext.instances).toHaveLength(1)
    expect(audio.ctx.resume).toHaveBeenCalledTimes(2)
  })

  it('carries on with no recordings when they fail to load', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
    const audio = await ensureAudio({ current: null })
    expect(audio.buffers).toEqual({})
  })

  it('tolerates a context that cannot resume', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
    const ref = { current: null }
    const pending = ensureAudio(ref)
    ref.current.ctx.resume = undefined
    await expect(pending).resolves.toBe(ref.current)
  })
})

describe('chime', () => {
  const withBuffers = (buffers) => ({ ctx: new FakeAudioContext(), buffers, playing: new Set() })

  it('does nothing before audio exists', () => {
    expect(() => chime(null, 10)).not.toThrow()
  })

  it('plays the recording for the interval, or the nearest one it has', () => {
    const ten = { id: 10 }
    const thirty = { id: 30 }
    for (const [buffers, secs, expected] of [
      [{ 10: ten, 30: thirty }, 30, thirty],
      [{ 10: ten, 30: thirty }, 20, ten],
      [{ 30: thirty }, 20, thirty]
    ]) {
      log.length = 0
      chime(withBuffers(buffers), secs)
      expect(started('buffer').map((node) => node.buffer)).toEqual([expected])
    }
  })

  it('forgets a recording once it has rung out', () => {
    const audio = withBuffers({ 10: {} })
    chime(audio, 10)
    expect(audio.playing.size).toBe(1)
    log[0].onended()
    expect(audio.playing.size).toBe(0)
  })

  it('synthesizes a bowl when there is no recording', () => {
    const audio = withBuffers({})
    chime(audio, 10)
    expect(started('oscillator')).toHaveLength(10)
    expect(audio.playing.size).toBe(1)
  })

  it('still tracks a strike when there is no context to play it on', () => {
    const audio = { ctx: undefined, buffers: {}, playing: new Set() }
    chime(audio, 10)
    expect(() => silence({ ...audio, ctx: { currentTime: 0 } })).not.toThrow()
  })
})

describe('knock', () => {
  it('does nothing before audio exists', () => {
    expect(() => knock(null)).not.toThrow()
  })

  it('taps three times, each with partials and a noise transient', () => {
    const audio = { ctx: new FakeAudioContext(), playing: new Set() }
    knock(audio)
    expect(started('oscillator')).toHaveLength(9)
    expect(started('buffer')).toHaveLength(3)
    expect(audio.playing.size).toBe(1)
  })

  it('still tracks a tap when there is no context to play it on', () => {
    const audio = { ctx: undefined, playing: new Set() }
    knock(audio)
    expect(() => silence({ ...audio, ctx: { currentTime: 0 } })).not.toThrow()
  })
})

describe('silence', () => {
  it('does nothing before audio exists', () => {
    expect(() => silence(null)).not.toThrow()
  })

  it('fades and stops everything still ringing, even sources that already ended', () => {
    const audio = { ctx: new FakeAudioContext(), buffers: { 10: {} }, playing: new Set() }
    chime(audio, 10)
    chime({ ...audio, buffers: {} }, 10)
    knock(audio)
    const entries = [...audio.playing]
    expect(entries).toHaveLength(3)

    silence(audio)
    expect(audio.playing.size).toBe(0)
    for (const node of log) expect(node.stop).toHaveBeenCalled()

    // A second stop throws on every source. The cues swallow it.
    for (const { stop } of entries) expect(() => stop(1)).not.toThrow()
  })
})
