import { describe, expect, it, vi } from 'vitest'
import { exerciseId } from '../src/lib/stats'

// The real program. Its content changes often, so this checks its shape and
// the invariants storage depends on, never specific exercises.
const { exercises, daily, sessions } = await vi.importActual('../src/data')
const ACCENTS = ['amber', 'yellow', 'purple', 'indigo', 'teal', 'red', 'blue']
const names = new Set(Object.values(exercises).flatMap((b) => b.exercises.map((ex) => ex.name)))

describe('the program in data.js', () => {
  const blocks = Object.entries(exercises)

  it('has blocks', () => {
    expect(blocks.length).toBeGreaterThan(0)
  })

  it.each(blocks)('%s is a well-formed block', (_key, block) => {
    expect(block.displayName).toBeTypeOf('string')
    expect(ACCENTS).toContain(block.accent)
    expect(block.icon).toBeDefined()
    expect(block.exercises.length).toBeGreaterThan(0)
    for (const ex of block.exercises) expect(ex.name).toBeTypeOf('string')
  })

  // Completion and notes are keyed by block plus a hash of the exercise name,
  // so two exercises in a block must never hash alike.
  it.each(blocks)('%s has no two exercises sharing a storage id', (_key, block) => {
    const ids = block.exercises.map(exerciseId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('names real blocks in the daily routine', () => {
    for (const key of daily) expect(exercises[key]).toBeDefined()
  })

  it.each(sessions.map((s) => [s.id, s]))('%s is a well-formed session', (_id, session) => {
    expect(session.name).toBeTypeOf('string')
    expect(session.perWeek).toBeGreaterThan(0)
    if (session.warmup) expect(exercises[session.warmup]).toBeDefined()
    for (const key of session.blocks) expect(exercises[key]).toBeDefined()
    for (const name of session.stretches ?? []) expect(names.has(name)).toBe(true)
  })

  it('gives every session its own id', () => {
    expect(new Set(sessions.map((s) => s.id)).size).toBe(sessions.length)
  })

  // Every block is done somewhere, daily or in a session, or it is dead weight.
  it('covers every block', () => {
    const used = new Set([
      ...daily,
      ...sessions.flatMap((s) => [s.warmup, ...s.blocks]),
      ...Object.entries(exercises)
        .filter(([, b]) =>
          b.exercises.some((ex) => sessions.some((s) => s.stretches?.includes(ex.name)))
        )
        .map(([key]) => key)
    ])
    for (const key of Object.keys(exercises)) expect(used.has(key)).toBe(true)
  })
})
