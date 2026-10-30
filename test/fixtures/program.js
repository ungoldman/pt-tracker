import { Dumbbell, Hand, Star, Sunrise, Target } from 'lucide-react'

// A stand-in program for component tests, so they don't break whenever the
// real one in src/data.js is revised. It carries one of every data shape the
// app renders: a daily routine with a per-day count and a weekly goal, a
// strength session with a warm-up and warm-down, sessions without either,
// hold timers, a link, a goal, and a block missing every optional field.
export const exercises = {
  warmup: {
    displayName: 'Warm Up',
    accent: 'amber',
    icon: Sunrise,
    exercises: [
      { name: 'Arm Circles', sets: 2, reps: 10 },
      { name: 'Wall Slides', sets: 3, reps: 12 }
    ]
  },
  hand: {
    displayName: 'Hand',
    accent: 'indigo',
    icon: Hand,
    exercises: [
      { name: 'Tendon Glide', sets: 3, reps: 10, hold: '3s', perDay: 3 },
      { name: 'Overhead Reach with Dowel', sets: 2, hold: '30s' },
      { name: 'Wear Brace', ambient: true }
    ]
  },
  goals: {
    displayName: 'Goals',
    accent: 'blue',
    icon: Target,
    noEstimate: true,
    exercises: [
      { name: 'Daily Steps', target: 5000 },
      { name: 'Run', target: '2k+', perWeek: 3 }
    ]
  },
  mobility: {
    displayName: 'Mobility',
    accent: 'teal',
    icon: Star,
    exercises: [
      { name: 'Doorway Stretch', sets: 3, reps: '30s' },
      { name: 'Sleeper Stretch', sets: 1, reps: 2, hold: '10s' }
    ]
  },
  Push: {
    displayName: 'Push',
    accent: 'purple',
    icon: Dumbbell,
    exercises: [
      { name: 'Press with Dumbbell (5)', sets: 3, reps: 10, priority: true },
      { name: 'Fly with Dumbbell', sets: 2, reps: 10, priority: true },
      { name: 'Curl with Dumbbell', sets: 2, reps: 10 }
    ]
  },
  // No icon.
  Pull: {
    displayName: 'Pull',
    accent: 'indigo',
    exercises: [
      { name: 'Row with Resistance', sets: 3, reps: 10 },
      { name: 'Squats', sets: 3, reps: 10, link: 'https://example.com/squats' }
    ]
  },
  // No display name, icon, or known accent.
  odds: {
    accent: 'none',
    exercises: [{ name: 'Odd One', sets: 1, reps: 5 }]
  }
}

export const daily = ['hand', 'goals']

export const limits = { sessionsPerDay: 2, strengthPerDay: 1 }

export const sessions = [
  {
    id: 'push',
    name: 'Push day',
    warmup: 'warmup',
    blocks: ['Push'],
    perWeek: 2,
    strength: true,
    stretches: ['Doorway Stretch', 'Sleeper Stretch']
  },
  {
    id: 'pull',
    name: 'Pull day',
    blocks: ['Pull'],
    perWeek: 1,
    strength: true,
    stretches: ['Sleeper Stretch']
  },
  { id: 'odds', name: 'Odds and ends', blocks: ['odds'], perWeek: 1 },
  { id: 'mobility', name: 'Mobility', blocks: ['mobility'], perWeek: 2 }
]
