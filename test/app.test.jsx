import { fireEvent, renderHook, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTracker } from '../src/context/TrackerContext'
import { itemKey } from '../src/lib/plan'
import { exercises } from './fixtures/program'
import {
  button,
  click,
  mountApp,
  row,
  savedHistory,
  seedHistory,
  startSession,
  tick
} from './helpers'

// The pinned Tuesday at noon, and the days around it. At noon two hand passes
// are due, so tests that want a session up next log those first.
const TODAY = '2026-10-06'
const MONDAY = '2026-10-05'
const LAST_WEEK = '2026-09-29'

const key = (category, name) =>
  itemKey(
    category,
    exercises[category].exercises.find((ex) => ex.name === name)
  )
const GLIDE = key('hand', 'Tendon Glide')
const REACH = key('hand', 'Overhead Reach with Dowel')
const STEPS = key('goals', 'Daily Steps')
const ARMS = key('warmup', 'Arm Circles')

// A finished entry with everything checked off.
const finished = (size = 'full', total = 2) => ({
  size,
  total,
  done: Object.fromEntries(Array.from({ length: total }, (_, n) => [`k${n}`, true])),
  finished: true
})
const passesDone = (n) => ({ daily: { [GLIDE]: n } })

const upNext = () => screen.getByRole('region', { name: 'Up next' })
const card = () => document.querySelector('article[aria-hidden="false"]').getAttribute('aria-label')
const progress = () => screen.getByRole('heading', { level: 2, name: /, \d+ of \d+$/ }).textContent
const tab = (name) =>
  click(within(screen.getByRole('navigation', { name: 'Screens' })).getByRole('button', { name }))
const tapDone = () => click(button('Mark done'))

describe('today', () => {
  it.each([false, true])('puts a due hand pass up next (dark: %s)', (dark) => {
    mountApp({ dark })
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Tuesday')
    expect(within(upNext()).getByRole('heading').textContent).toBe('Hand session 1')
    expect(upNext().textContent).toContain('1 exercises, about 5 min')
    click(button('Start session'))
    expect(screen.getByRole('region', { name: 'Hand session 1' })).not.toBeNull()
    expect(card()).toBe('Tendon Glide')
    expect(screen.getByText('3 times a day')).not.toBeNull()
    tapDone()
    expect(savedHistory()[TODAY].daily[GLIDE]).toBe(1)
    tick(600)
    expect(screen.getByRole('article', { name: 'Summary' }).textContent).toContain(
      'Session 1 of 3 today.'
    )
    click(button('Back to today'))
    expect(within(upNext()).getByRole('heading').textContent).toBe('Hand session 2')
  })

  it('offers the top session once the passes are on time', () => {
    seedHistory({ [TODAY]: passesDone(2) })
    mountApp()
    expect(within(upNext()).getByRole('heading').textContent).toBe('Push day')
    expect(upNext().textContent).toContain('7 exercises, about 15 min')
    click(button('Start'))
    expect(screen.getByRole('region', { name: 'Push day' })).not.toBeNull()
    expect(savedHistory()[TODAY].sessions.push.size).toBe('full')
  })

  it('offers a short version and two others', () => {
    seedHistory({ [TODAY]: passesDone(2) })
    mountApp()
    click(button('Short version'))
    expect(savedHistory()[TODAY].sessions.push.size).toBe('short')
    click(button('Close'))
    click(button('or Odds and ends'))
    expect(screen.getByRole('region', { name: 'Odds and ends' })).not.toBeNull()
  })

  it('resumes an open session where it left off', () => {
    seedHistory({
      [TODAY]: {
        sessions: {
          push: { size: 'full', total: 7, done: { [ARMS]: true }, finished: false },
          odds: finished('full', 1)
        }
      }
    })
    mountApp()
    expect(within(upNext()).getByRole('heading').textContent).toBe('Push day')
    expect(upNext().textContent).toContain('1 of 7 done')
    // The list underneath leaves out what is already up next.
    expect(screen.getByRole('region', { name: 'Today so far' }).textContent).toBe(
      'Today so farOdds and endsAll doneOpen'
    )
    click(button('Resume'))
    expect(card()).toBe('Wall Slides')
    expect(progress()).toBe('Push day, 1 of 7')
  })

  it('moves to the rest of the hand work once the day has its sessions', () => {
    seedHistory({
      [TODAY]: { ...passesDone(2), sessions: { odds: finished('full', 1), mobility: finished() } }
    })
    mountApp()
    expect(within(upNext()).getByRole('heading').textContent).toBe('Hand session 3')
  })

  it('then the once-a-day work, then rest', () => {
    seedHistory({
      [TODAY]: { ...passesDone(3), sessions: { odds: finished('full', 1), mobility: finished() } }
    })
    mountApp()
    expect(within(upNext()).getByRole('heading').textContent).toBe('Putty and band work')
    expect(upNext().textContent).toContain('1 exercises, once a day')
    click(button('Start'))
    tapDone()
    expect(savedHistory()[TODAY].daily[REACH]).toBe(true)
    tick(600)
    expect(screen.getByText('The once-a-day hand work.')).not.toBeNull()
    click(button('Back to today'))
    expect(within(upNext()).getByRole('heading').textContent).toBe('Nothing else due today')
    expect(within(upNext()).queryByRole('button')).toBeNull()
  })

  it('checks off the daily goals and links to the hand work', () => {
    seedHistory({ [MONDAY]: { daily: { [key('goals', 'Run')]: true } } })
    mountApp()
    const also = screen.getByRole('region', { name: 'Also today' })
    expect(within(also).getByText('0 of 3')).not.toBeNull()
    expect(row('Run').textContent).toBe('Run2k+, 1 of 3 this week')
    click(row('Daily Steps'))
    expect(savedHistory()[TODAY].daily[STEPS]).toBe(true)
    fireEvent.keyDown(row('Daily Steps'), { key: 'Enter' })
    expect(savedHistory()[TODAY].daily[STEPS]).toBe(false)
    click(button(/^Hand sessions/))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Hand')
  })

  it('ignores the click that ends a text selection, and other keys', () => {
    mountApp()
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: false })
    click(row('Daily Steps'))
    expect(savedHistory()[TODAY]).toBeUndefined()
    vi.spyOn(window, 'getSelection').mockReturnValue(null)
    fireEvent.keyDown(row('Daily Steps'), { key: 'a' })
    expect(savedHistory()[TODAY]).toBeUndefined()
    fireEvent.keyDown(row('Daily Steps'), { key: ' ' })
    expect(savedHistory()[TODAY].daily[STEPS]).toBe(true)
  })

  it('greens the pass count once all are in', () => {
    seedHistory({ [TODAY]: passesDone(3) })
    mountApp()
    expect(
      within(screen.getByRole('region', { name: 'Also today' })).getByText('3 of 3').className
    ).toContain('green')
  })

  it('shows the full choice outright on a wide screen', () => {
    mountApp({ width: 1400 })
    expect(screen.queryByRole('button', { name: 'Pick something else' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Pick a session' })).not.toBeNull()
  })

  it('keeps the full choice one tap away', () => {
    mountApp()
    click(button('Pick something else'))
    click(button('All sessions (1 more)'))
    startSession('Mobility')
    expect(screen.getByRole('region', { name: 'Mobility' })).not.toBeNull()
    click(button('Close'))
    click(button('Pick something else'))
    click(button('Hide the other sessions'))
    expect(screen.queryByRole('region', { name: 'Pick a session' })).toBeNull()
  })

  it('celebrates a check, then settles', () => {
    mountApp()
    click(row('Daily Steps'))
    expect(document.querySelector('.ring-green-400\\/70')).not.toBeNull()
    expect(document.querySelectorAll('[style*="confetti"]')).toHaveLength(30)
    tick(1000)
    expect(document.querySelector('.ring-green-400\\/70')).toBeNull()
    tick(1000)
    expect(document.querySelectorAll('[style*="confetti"]')).toHaveLength(0)
  })
})

describe('the player', () => {
  const openPush = () => {
    seedHistory({ [TODAY]: passesDone(2) })
    mountApp()
    click(button('Start'))
  }

  it.each([false, true])('checks a card off and moves on (dark: %s)', (dark) => {
    seedHistory({ [TODAY]: passesDone(2) })
    mountApp({ dark })
    click(button('Start'))
    expect(card()).toBe('Arm Circles')
    expect(
      within(document.querySelector('article[aria-hidden="false"]')).getByText('Warm-up')
    ).not.toBeNull()
    tapDone()
    expect(progress()).toBe('Push day, 1 of 7')
    expect(card()).toBe('Arm Circles')
    tick(600)
    expect(card()).toBe('Wall Slides')
  })

  it('undoes a check without moving on', () => {
    openPush()
    tapDone()
    tick(400)
    tapDone()
    tick(600)
    expect(card()).toBe('Arm Circles')
    expect(progress()).toBe('Push day, 0 of 7')
  })

  it('reads a double tap as one check', () => {
    openPush()
    tapDone()
    tick(100)
    tapDone()
    expect(progress()).toBe('Push day, 1 of 7')
    tick(600)
    expect(card()).toBe('Wall Slides')
  })

  it('steps with the arrows and follows a swipe', () => {
    openPush()
    expect(button('Previous exercise').disabled).toBe(true)
    click(button('Next exercise'))
    expect(card()).toBe('Wall Slides')
    click(button('Previous exercise'))
    expect(card()).toBe('Arm Circles')

    const track = document.querySelector('article').parentElement
    const scrollTo = (left, width = 300) => {
      Object.defineProperty(track, 'clientWidth', { value: width, configurable: true })
      Object.defineProperty(track, 'scrollLeft', { value: left, configurable: true })
      fireEvent.scroll(track)
    }
    scrollTo(0, 0)
    tick(120)
    expect(card()).toBe('Arm Circles')
    scrollTo(610)
    expect(card()).toBe('Arm Circles')
    tick(120)
    expect(card()).toBe('Press (5)')
    expect(
      within(document.querySelector('article[aria-hidden="false"]')).getByText('Push')
    ).not.toBeNull()
    scrollTo(600)
    tick(120)
    expect(card()).toBe('Press (5)')
  })

  it('stays on the card an arrow moved to while the scroll animates', () => {
    openPush()
    const track = document.querySelector('article').parentElement
    Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true })
    click(button('Next exercise'))
    // Part way through the smooth scroll, nearer the old card.
    Object.defineProperty(track, 'scrollLeft', { value: 120, configurable: true })
    fireEvent.scroll(track)
    Object.defineProperty(track, 'scrollLeft', { value: 300, configurable: true })
    fireEvent.scroll(track)
    tick(120)
    expect(card()).toBe('Wall Slides')
  })

  it('drops a pending scroll read when switching to the list', () => {
    openPush()
    fireEvent.scroll(document.querySelector('article').parentElement)
    click(button('List'))
    tick(120)
    expect(screen.getByRole('button', { name: 'Cards' })).not.toBeNull()
  })

  it('scrolls without animation when motion is reduced', () => {
    seedHistory({ [TODAY]: passesDone(2) })
    mountApp({ reduced: true })
    click(button('Start'))
    expect(Element.prototype.scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'auto' })
  })

  it('ends on a summary that can stop early', () => {
    openPush()
    tapDone()
    for (let n = 0; n < 7; n += 1) click(button('Next exercise'))
    expect(card()).toBe('Summary')
    expect(screen.getByRole('heading', { name: '1 of 7 done' })).not.toBeNull()
    expect(screen.getByText(/^Counts 0.1 toward Push day, now 0.1 of 2/)).not.toBeNull()
    expect(screen.getByText('Shoulder weights rest the next day.')).not.toBeNull()
    click(button('Stop here'))
    expect(savedHistory()[TODAY].sessions.push.finished).toBe(true)
    expect(screen.getByRole('region', { name: 'Today so far' }).textContent).toContain(
      'Stopped at 1 of 7'
    )
  })

  it('ends on a full summary when everything is done', () => {
    seedHistory({ [TODAY]: passesDone(2) })
    mountApp()
    click(button('or Odds and ends'))
    tapDone()
    tick(600)
    expect(screen.getByRole('heading', { name: 'Odds and ends done' })).not.toBeNull()
    expect(screen.queryByText(/rest the next day/)).toBeNull()
    click(button('Back to today'))
    expect(savedHistory()[TODAY].sessions.odds.finished).toBe(true)
  })

  it('takes back a session closed with nothing checked, and keeps one part done', () => {
    openPush()
    click(button('Close'))
    expect(savedHistory()[TODAY].sessions).toEqual({})
    click(button('Start'))
    tapDone()
    click(button('Close'))
    expect(savedHistory()[TODAY].sessions.push.finished).toBe(false)
    expect(within(upNext()).getByRole('button').textContent).toBe('Resume')
  })

  it.each([false, true])('switches to a list and back (dark: %s)', (dark) => {
    seedHistory({ [TODAY]: passesDone(2) })
    mountApp({ dark })
    click(button('Start'))
    click(button('List'))
    const groups = [...document.querySelectorAll('[data-group]')].map((g) =>
      g.getAttribute('data-group')
    )
    expect(groups).toEqual(['push-warmup', 'push-Push', 'push-mobility'])
    expect(screen.getByText('Warm-down')).not.toBeNull()
    click(row('Wall Slides'))
    click(button('Cards'))
    expect(card()).toBe('Arm Circles')
    click(button('List'))
    click(button('Done for now'))
    expect(savedHistory()[TODAY].sessions.push).toMatchObject({ finished: true })
  })

  it.each([false, true])('keeps a note on the card (dark: %s)', (dark) => {
    seedHistory({ [TODAY]: passesDone(2) })
    mountApp({ dark })
    click(button('Start'))
    click(button('Add note'))
    expect(button('Add note').getAttribute('aria-expanded')).toBe('true')
    fireEvent.change(screen.getByPlaceholderText('A note for this exercise'), {
      target: { value: 'easy' }
    })
    expect(JSON.parse(localStorage.getItem('ptTrackerExerciseNotes'))).toEqual({ [ARMS]: 'easy' })
    expect(button('Note')).not.toBeNull()
    click(button('Next exercise'))
    expect(screen.queryByPlaceholderText('A note for this exercise')).toBeNull()
  })

  it('links to a video where there is one', () => {
    seedHistory({ [TODAY]: passesDone(2) })
    mountApp()
    click(button('or Pull day'))
    click(button('Next exercise'))
    expect(screen.getByRole('link', { name: 'Video' }).getAttribute('href')).toBe(
      'https://example.com/squats'
    )
  })

  it('takes a pass back one step when unchecked', () => {
    seedHistory({ [TODAY]: passesDone(1) })
    mountApp()
    click(button('Start session'))
    tapDone()
    expect(savedHistory()[TODAY].daily[GLIDE]).toBe(2)
    tick(400)
    tapDone()
    expect(savedHistory()[TODAY].daily[GLIDE]).toBe(1)
  })

  it('hides the tabs while open', () => {
    openPush()
    expect(screen.queryByRole('navigation', { name: 'Screens' })).toBeNull()
  })

  it('lists the run beside the card to jump around', () => {
    openPush()
    const steps = within(screen.getByRole('navigation', { name: 'Exercises' }))
    expect(steps.getByRole('button', { name: 'Arm Circles' }).getAttribute('aria-current')).toBe(
      'step'
    )
    tapDone()
    click(steps.getByRole('button', { name: 'Curl' }))
    expect(card()).toBe('Curl')
    expect(steps.getByRole('button', { name: 'Arm Circles' }).querySelector('svg')).not.toBeNull()
  })

  it('shows a saved note on its card', () => {
    localStorage.setItem('ptTrackerExerciseNotes', JSON.stringify({ [ARMS]: 'elbows in' }))
    openPush()
    expect(screen.getByText('elbows in').tagName).toBe('P')
    click(button('Note'))
    expect(screen.getByText('elbows in').tagName).toBe('TEXTAREA')
  })

  it('says what comes next, and what the card needs', () => {
    openPush()
    expect(screen.getByText('Next: Wall Slides')).not.toBeNull()
    for (let n = 0; n < 2; n += 1) click(button('Next exercise'))
    expect(document.querySelector('article[aria-hidden="false"]').textContent).toContain(
      'Push, dumbbell'
    )
  })

  it('marks the card done with Space, unless a control has focus', () => {
    openPush()
    fireEvent.keyDown(button('Close'), { key: ' ' })
    expect(savedHistory()[TODAY].sessions.push.done).toEqual({})
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(savedHistory()[TODAY].sessions.push.done).toEqual({ [ARMS]: true })
    tick(1000)
    expect(card()).toBe('Wall Slides')
  })

  it('does nothing on Space at the summary', () => {
    openPush()
    for (let n = 0; n < 7; n += 1) click(button('Next exercise'))
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(card()).toBe('Summary')
  })

  it('claims nothing at the summary of an empty run, and goes back to the first open card', () => {
    openPush()
    for (let n = 0; n < 7; n += 1) click(button('Next exercise'))
    expect(screen.getByRole('heading', { name: 'Nothing checked off yet' })).not.toBeNull()
    expect(screen.queryByText(/^Counts /)).toBeNull()
    click(button('Keep going'))
    expect(card()).toBe('Arm Circles')
  })

  it('steps with the arrow keys, except while typing a note', () => {
    openPush()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(card()).toBe('Wall Slides')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(card()).toBe('Arm Circles')
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(card()).toBe('Arm Circles')
    click(button('Add note'))
    fireEvent.keyDown(screen.getByPlaceholderText('A note for this exercise'), {
      key: 'ArrowRight'
    })
    expect(card()).toBe('Arm Circles')
  })
})

describe('the full list of sessions', () => {
  const pick = () => click(button('Pick something else'))
  const offered = () =>
    within(screen.getByRole('region', { name: 'Pick a session' }))
      .getAllByRole('listitem')
      .map((li) => li.firstChild.firstChild.textContent)

  it.each([false, true])('offers the top three, the rest a tap away (dark: %s)', (dark) => {
    mountApp({ dark })
    pick()
    expect(screen.getByRole('heading', { name: 'Pick today’s session' })).not.toBeNull()
    expect(offered()).toEqual(['Push day', 'Pull day', 'Odds and ends'])
    expect(screen.getAllByText('not done yet, 0 of 2 this week')).toHaveLength(1)
    expect(button(/^Start Push day, full/).className).toContain('bg-blue-600')
    expect(button(/^Start Pull day, full/).className).not.toContain('bg-blue-600')
    click(button('All sessions (1 more)'))
    expect(offered()).toContain('Mobility')
    click(button('Fewer sessions'))
    expect(offered()).not.toContain('Mobility')
  })

  it('holds strength back the day after, and says how long since', () => {
    seedHistory({
      [LAST_WEEK]: { sessions: { odds: finished() } },
      [MONDAY]: { sessions: { push: finished(), mobility: finished() } }
    })
    mountApp()
    pick()
    expect(offered()).toEqual(['Odds and ends', 'Mobility'])
    expect(screen.getByText('7 days ago, 0 of 1 this week')).not.toBeNull()
    expect(screen.getByText('yesterday, 1 of 2 this week')).not.toBeNull()
    expect(
      screen.getByText('Shoulder weights the day before, so this leans lighter.')
    ).not.toBeNull()
    click(button('All sessions (2 more)'))
    expect(screen.queryByText(/leans lighter/)).toBeNull()
    expect(screen.getByText('rest the shoulder, 1 of 2 this week')).not.toBeNull()
  })

  it('rests the shoulder once today has its strength work', () => {
    seedHistory({ [TODAY]: { ...passesDone(2), sessions: { push: finished() } } })
    mountApp()
    pick()
    expect(screen.getByRole('heading', { name: 'Room for another?' })).not.toBeNull()
    expect(screen.getByText('That’s enough shoulder weights for one day.')).not.toBeNull()
  })
})

describe('reopening', () => {
  it('opens a finished session on its summary', () => {
    seedHistory({
      [TODAY]: {
        sessions: {
          odds: { size: 'full', total: 1, done: { [key('odds', 'Odd One')]: true }, finished: true }
        }
      }
    })
    mountApp()
    click(button('Open Odds and ends'))
    expect(card()).toBe('Summary')
    expect(screen.getByRole('heading', { name: 'Odds and ends done' })).not.toBeNull()
  })

  it('says when every session is already in', () => {
    seedHistory({
      [TODAY]: {
        ...passesDone(2),
        sessions: { push: finished(), pull: finished(), odds: finished(), mobility: finished() }
      }
    })
    mountApp()
    click(button('Pick something else'))
    expect(screen.getByRole('heading', { name: 'Every session is in' })).not.toBeNull()
  })

  it('shows a short session left open on an earlier day', () => {
    seedHistory({
      [MONDAY]: { sessions: { push: { size: 'short', total: 3, done: {}, finished: false } } }
    })
    mountApp()
    tab('Week')
    expect(
      screen.getByRole('button', { name: /^Monday:/ }).querySelector('[title]').className
    ).toMatch(/border-purple-500$/)
    click(screen.getByRole('button', { name: /^Monday:/ }))
    expect(screen.getByRole('region', { name: 'Monday’s sessions' }).textContent).toBe(
      'Push day (short)0 of 3Resume'
    )
  })
})

describe('the hand tab', () => {
  it.each([false, true])('runs the passes in order (dark: %s)', (dark) => {
    seedHistory({ [TODAY]: passesDone(1) })
    mountApp({ dark })
    tab('Hand')
    const passes = within(screen.getByRole('list', { name: 'Hand sessions' })).getAllByRole(
      'listitem'
    )
    expect(passes.map((li) => li.textContent)).toEqual([
      'Session 1morning, 1 exercises, about 5 min',
      'Session 2midday, 1 exercises, about 5 minStart',
      'Session 3evening, 1 exercises, about 5 min'
    ])
    click(button('Start'))
    expect(screen.getByRole('region', { name: 'Hand session 2' })).not.toBeNull()
  })

  it('opens the once-a-day work and marks what is worn', () => {
    mountApp()
    tab('Hand')
    const once = () => screen.getByRole('region', { name: 'Once a day' })
    expect(once().textContent).toBe('Putty and band workonce a day, 0 of 1 doneStart')
    click(within(once()).getByRole('button'))
    tapDone()
    click(button('Close'))
    expect(once().textContent).toContain('1 of 1 doneOpen')
    expect(screen.getByText('Through the day')).not.toBeNull()
    click(row('Wear Brace'))
    expect(savedHistory()[TODAY].daily[key('hand', 'Wear Brace')]).toBe(true)
  })
})

describe('the week tab', () => {
  const strip = (name) => screen.getByRole('button', { name: new RegExp(`^${name}:`) })

  it.each([false, true])('shows a day, and adds to it after the fact (dark: %s)', (dark) => {
    seedHistory({ [MONDAY]: { ...passesDone(2), sessions: { odds: finished('full', 1) } } })
    mountApp({ dark })
    tab('Week')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Week')
    expect(screen.getByText('No shoulder or leg work.')).not.toBeNull()
    click(strip('Monday'))
    expect(strip('Monday').getAttribute('aria-pressed')).toBe('true')
    const detail = screen.getByRole('region', { name: 'Monday in detail' })
    expect(within(detail).getByText('Hand sessions: 2 of 3')).not.toBeNull()
    expect(within(detail).queryByRole('heading', { name: /sessions/ })).toBeNull()

    click(button('Add shoulder or leg work to Monday'))
    click(button('Never mind'))
    click(button('Add shoulder or leg work to Monday'))
    startSession('Mobility')
    expect(progress()).toBe('Mobility, Monday, 0 of 2')
    tapDone()
    click(button('Close'))
    expect(savedHistory()[MONDAY].sessions.mobility.finished).toBe(false)
    expect(strip('Monday').getAttribute('aria-pressed')).toBe('true')
    click(button('Resume Mobility'))
    expect(progress()).toBe('Mobility, Monday, 1 of 2')
  })

  it('goes back to today, and forgets the day on leaving', () => {
    mountApp()
    tab('Week')
    click(strip('Monday'))
    click(strip('Tuesday'))
    expect(screen.getByRole('region', { name: 'Today in detail' })).not.toBeNull()
    click(strip('Monday'))
    tab('Today')
    tab('Week')
    expect(screen.getByRole('region', { name: 'Today in detail' })).not.toBeNull()
    expect(strip('Wednesday').disabled).toBe(true)
  })

  it('lists what the week has left, in whole sittings', () => {
    seedHistory({
      [LAST_WEEK]: { sessions: { pull: finished() } },
      [MONDAY]: {
        sessions: {
          push: { size: 'full', total: 4, done: { a: true }, finished: true },
          pull: finished(),
          odds: finished()
        }
      }
    })
    mountApp()
    tab('Week')
    expect(screen.getByRole('region', { name: 'Left this week' }).textContent).toBe(
      'Left this weekPush day2 moreMobility2 more'
    )
  })

  it('says so when the week is covered', () => {
    seedHistory({
      [MONDAY]: {
        sessions: { push: finished(), pull: finished(), odds: finished(), mobility: finished() }
      },
      [TODAY]: { sessions: { push: finished(), mobility: finished() } }
    })
    mountApp()
    tab('Week')
    expect(screen.getByText('The week’s sessions are covered.')).not.toBeNull()
    expect(screen.getByText('6 of 6').className).toContain('text-green-500')
  })
})

describe('header', () => {
  it('counts the week to one decimal', () => {
    seedHistory({
      [MONDAY]: {
        sessions: { push: { size: 'full', total: 3, done: { a: true }, finished: true } }
      }
    })
    mountApp()
    expect(screen.getByText('0.3 of 6').className).not.toContain('green')
  })

  it('toggles the theme', () => {
    mountApp()
    click(button('Switch to dark mode'))
    expect(localStorage.getItem('ptTrackerDarkMode')).toBe('true')
    click(button('Switch to light mode'))
    expect(localStorage.getItem('ptTrackerDarkMode')).toBe('false')
  })

  it('marks the current tab', () => {
    mountApp()
    expect(
      within(screen.getByRole('navigation'))
        .getByRole('button', { name: 'Today' })
        .getAttribute('aria-current')
    ).toBe('page')
    tab('Hand')
    expect(
      within(screen.getByRole('navigation'))
        .getByRole('button', { name: 'Today' })
        .getAttribute('aria-current')
    ).toBeNull()
  })
})

describe('the tracker context', () => {
  it('refuses to be read outside the app', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useTracker())).toThrow(/within a TrackerContext provider/)
  })
})

describe('resetting', () => {
  const openMenu = () => click(button('Reset checkboxes'))

  it.each([false, true])('opens and closes the menu (dark: %s)', (dark) => {
    mountApp({ dark })
    openMenu()
    expect(screen.getByRole('menu')).not.toBeNull()
    openMenu()
    expect(screen.queryByRole('menu')).toBeNull()
    openMenu()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('resets today when confirmed', () => {
    seedHistory({ [MONDAY]: { sessions: { pull: finished() } } })
    mountApp()
    click(row('Daily Steps'))
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    openMenu()
    click(screen.getByRole('menuitem', { name: 'Reset today' }))
    expect(Object.keys(savedHistory())).toEqual([MONDAY, TODAY])
    window.confirm.mockReturnValue(true)
    openMenu()
    click(screen.getByRole('menuitem', { name: 'Reset today' }))
    expect(Object.keys(savedHistory())).toEqual([MONDAY])
  })

  it('resets the week when confirmed, keeping earlier weeks', () => {
    seedHistory({
      [LAST_WEEK]: { sessions: { pull: finished() } },
      [MONDAY]: { sessions: { mobility: finished() } }
    })
    mountApp()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    openMenu()
    click(screen.getByRole('menuitem', { name: 'Reset week' }))
    expect(Object.keys(savedHistory())).toEqual([LAST_WEEK, MONDAY])
    window.confirm.mockReturnValue(true)
    openMenu()
    click(screen.getByRole('menuitem', { name: 'Reset week' }))
    expect(Object.keys(savedHistory())).toEqual([LAST_WEEK])
  })
})

describe('storage', () => {
  it('drops history older than ten weeks', () => {
    seedHistory({ '2026-07-01': { daily: {} }, [MONDAY]: { daily: {} } })
    mountApp()
    expect(Object.keys(savedHistory())).toEqual([MONDAY])
  })

  it('folds weekday notes into one note per exercise', () => {
    localStorage.setItem(
      'ptTrackerNotes',
      JSON.stringify({ 'Monday-goals-abc': 'old', 'Tuesday-goals-abc': 'new', 'Friday-x-y': '' })
    )
    mountApp()
    expect(JSON.parse(localStorage.getItem('ptTrackerExerciseNotes'))).toEqual({
      'goals-abc': 'new'
    })
  })

  it('starts without notes when the old ones are unreadable', () => {
    localStorage.setItem('ptTrackerNotes', '{not json')
    mountApp()
    expect(JSON.parse(localStorage.getItem('ptTrackerExerciseNotes'))).toEqual({})
  })

  it('skips a logged session no longer in the program', () => {
    seedHistory({ [MONDAY]: { sessions: { gone: finished(), odds: finished() } } })
    mountApp()
    tab('Week')
    click(screen.getByRole('button', { name: /^Monday:/ }))
    expect(screen.getByRole('region', { name: 'Monday’s sessions' }).textContent).toBe(
      'Odds and endsAll doneOpen'
    )
  })
})
