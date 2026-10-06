import { Dumbbell, Star, Sunrise, Target } from 'lucide-react'

// A stand-in program for component tests, so they don't break whenever the
// real one in src/data.js is revised. It carries one of every data shape the
// app renders: daily and gated blocks, strength, a mixed block, a hold timer,
// a link, a goal, per-day counts, and blocks missing optional fields.
const MWF = ['Monday', 'Wednesday', 'Friday']
const TTS = ['Tuesday', 'Thursday', 'Saturday']

export const exercises = {
  warmup: {
    displayName: 'Warm Up',
    lane: 0,
    accent: 'amber',
    icon: Sunrise,
    exercises: [
      { name: 'Arm Circles', sets: 2, reps: 10 },
      { name: 'Wall Slides', sets: 3, reps: 12 }
    ]
  },
  mobility: {
    displayName: 'Mobility',
    lane: 1,
    accent: 'teal',
    icon: Star,
    exercises: [
      { name: 'Doorway Stretch', sets: 3, reps: '30s' },
      { name: 'Sleeper Stretch', sets: 1, reps: 2, hold: '10s' },
      { name: 'Tendon Glide', sets: 3, reps: 10, hold: '3s', perDay: 3 },
      { name: 'Overhead Reach with Dowel', sets: 2, hold: '30s' }
    ]
  },
  goals: {
    displayName: 'Goals',
    lane: 2,
    accent: 'blue',
    icon: Target,
    noEstimate: true,
    exercises: [
      { name: 'Daily Steps', target: 5000 },
      { name: 'Sit Ups', sets: 2, reps: 30, priority: true }
    ]
  },
  cardio: {
    displayName: 'Cardio',
    lane: 2,
    accent: 'red',
    icon: Target,
    noEstimate: true,
    days: MWF,
    exercises: [
      { name: 'Squats', sets: 3, reps: 10, link: 'https://example.com/squats' },
      { name: 'Run', target: '2k+', days: ['Sunday', 'Tuesday', 'Thursday'] }
    ]
  },
  Push: {
    displayName: 'Push',
    strength: true,
    lane: 0,
    accent: 'purple',
    icon: Dumbbell,
    days: MWF,
    minutes: 10,
    exercises: [
      { name: 'Press with Dumbbell (5)', sets: 3, reps: 10, priority: true },
      { name: 'Fly with Dumbbell', sets: 2, reps: 10 }
    ]
  },
  Pull: {
    displayName: 'Pull',
    strength: true,
    lane: 1,
    accent: 'purple',
    icon: Dumbbell,
    days: MWF,
    exercises: [{ name: 'Row with Resistance', sets: 3, reps: 10 }]
  },
  Bands: {
    displayName: 'Bands',
    lane: 5,
    accent: 'indigo',
    days: TTS,
    exercises: [{ name: 'Pull Apart with Resistance', sets: 3, reps: 10 }]
  },
  // No display name, lane, icon, or known accent.
  odds: {
    accent: 'none',
    days: ['Saturday'],
    exercises: [{ name: 'Odd One', sets: 1, reps: 5 }]
  }
}
