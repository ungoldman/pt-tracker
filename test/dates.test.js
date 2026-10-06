import { describe, expect, it } from 'vitest'
import { formatDateLabel, getDateForDay, getTodayLabel } from '../src/lib/dates'
import { freezeDate } from './helpers'

describe('dates', () => {
  it('names today and places each weekday in the current Sunday to Saturday week', () => {
    freezeDate()
    expect(getTodayLabel()).toBe('Tuesday')
    expect(getDateForDay('Tuesday').getDate()).toBe(6)
    expect(getDateForDay('Sunday').getDate()).toBe(4)
    expect(getDateForDay('Saturday').getDate()).toBe(10)
  })

  it('crosses a month boundary', () => {
    freezeDate(new Date('2026-10-01T12:00:00'))
    expect(getTodayLabel()).toBe('Thursday')
    expect(formatDateLabel(getDateForDay('Sunday'))).toBe('Sep 27')
  })
})
