import {
  Dumbbell,
  Footprints,
  Hand,
  Infinity as InfinityIcon,
  PersonStanding,
  Star,
  Sunrise,
  Target
} from 'lucide-react'

// Blocks keyed by name, in display order. Each carries an `icon` and an
// `accent` (color token, resolved by lib/blockStyle). What runs when is not
// here but in `daily` and `sessions` below, which name blocks by key.
//
// Completion and notes are keyed by block name plus a hash of the exercise
// name (see lib/stats), so renaming either one drops its saved state.

export const exercises = {
  warmup: {
    displayName: 'Warm Up',
    accent: 'amber',
    icon: Sunrise,
    exercises: [
      { name: 'Wall Slides (flex/scap/abd)', sets: 2, reps: 10 },
      { name: 'Wall Ball Circles (flex/scap/abd)', sets: 3, reps: 12 }
    ]
  },
  hand: {
    displayName: 'Hand',
    accent: 'indigo',
    icon: Hand,
    // Hand PT home program as revised 10-16, plus the 10-29 splint, foam roll,
    // and heat. `perDay` is displayed but tracked as one check. The putty and
    // band work is prescribed 3-7x a week and kept daily here. Heat is
    // prescribed only when sore but tracked daily.
    exercises: [
      { name: 'Volar Hand Self Massage', sets: 3, reps: 10, perDay: 3 },
      { name: 'Hand AROM PIP Side Blocking', reps: 10, hold: '2s', perDay: 3 },
      // Prescribed as a 10-20s hold. The upper end keeps the hold timer.
      { name: 'Seated Finger PIP Flexion PROM', reps: 3, hold: '20s', perDay: 3 },
      {
        name: 'Seated Wrist Flexor Hook Fist Tendon Gliding',
        sets: 3,
        reps: 10,
        hold: '3s',
        perDay: 3
      },
      { name: 'Seated Single Digit Intrinsic Stretch', reps: 3, hold: '20s', perDay: 3 },
      { name: 'Putty Squeezes', sets: 3, reps: 10 },
      { name: 'Finger Pinch and Pull with Putty', sets: 3, reps: 10 },
      { name: 'Quick Finger Spreading with Rubber Band', sets: 3, reps: 10 },
      { name: 'Seated Finger MP Flexion with Putty', sets: 3, reps: 10 },
      { name: 'Finger Adduction with Putty', sets: 3, reps: 10 },
      { name: 'Hand Foam Roll' },
      { name: 'Splint While Typing', ambient: true },
      { name: 'Heat When Sore', ambient: true }
    ]
  },
  stretch: {
    displayName: 'Stretch',
    accent: 'teal',
    icon: Star,
    exercises: [
      { name: 'Shoulder IR Stretch', sets: 3, reps: '30s' },
      { name: 'Cross Body IR Stretch with Towel', sets: 3, reps: '30s' },
      { name: 'Corner Pec Minor Stretch', sets: 3, hold: '30s' },
      { name: 'Sleeper Stretch (+ reverse)', sets: 1, reps: 8, hold: '10s' },
      { name: 'Serratus Activation with Foam Roll', sets: 2, hold: '30s' },
      { name: 'Snow Angels on Foam Roll', sets: 3, reps: 12 }
    ]
  },
  cardio: {
    displayName: 'Cardio',
    accent: 'red',
    icon: Footprints,
    exercises: [
      { name: 'Daily Steps', target: 5000 },
      { name: 'Run', target: '2k+', perWeek: 3 }
    ]
  },
  legs: {
    displayName: 'Legs',
    accent: 'yellow',
    icon: PersonStanding,
    exercises: [
      { name: 'Squats', sets: 3, reps: 10, link: 'https://www.youtube.com/watch?v=DlS-GAF8Edg' },
      {
        name: 'Reverse Lunges (each leg)',
        sets: 3,
        reps: 10,
        link: 'https://www.youtube.com/watch?v=ALl174GTuoY'
      },
      {
        name: 'Calf Raises',
        sets: 3,
        reps: 15,
        link: 'https://www.youtube.com/watch?v=ndQc4mz4mBU'
      },
      {
        name: 'Glute bridge',
        sets: 3,
        reps: 10,
        link: 'https://www.youtube.com/watch?v=tdmSB0q21ic'
      }
    ]
  },
  core: {
    displayName: 'Core',
    accent: 'blue',
    icon: Target,
    exercises: [
      { name: 'Sit Ups', sets: 2, reps: 30 },
      {
        name: 'Dead Bugs (each side)',
        sets: 3,
        reps: 10,
        link: 'https://www.youtube.com/watch?v=bxn9FBrt4-A'
      }
    ]
  },
  Sidelying: {
    displayName: 'Sidelying',
    accent: 'purple',
    icon: Dumbbell,
    exercises: [
      { name: 'ER with Dumbbell (3)', sets: 3, reps: 10, priority: true },
      { name: 'Abduction with Dumbbell (3)', sets: 3, reps: 10, priority: true },
      { name: 'Horizontal Abduction with Dumbbell (3)', sets: 3, reps: 10, priority: true }
    ]
  },
  Supine: {
    displayName: 'Supine',
    accent: 'purple',
    icon: Dumbbell,
    exercises: [
      { name: 'Flexion with Dumbbell (3)', sets: 3, reps: 10, priority: true },
      { name: 'Serratus Punches (5) with Dumbbell', sets: 2, reps: 10 },
      { name: 'Bench Press (5) with Dumbbell', sets: 3, reps: 10 },
      { name: 'Horizontal Abduction with Dumbbell (3)', sets: 3, reps: 10, priority: true },
      { name: 'Skullcrushers with Dumbbell (3)', sets: 3, reps: 12, priority: true },
      { name: 'Prone Shoulder Extension (facedown)', sets: 3, reps: 12 }
    ]
  },
  Standing: {
    displayName: 'Standing',
    accent: 'purple',
    icon: Dumbbell,
    exercises: [
      { name: 'Flexion with Dumbbell (3)', sets: 2, reps: 10, priority: true },
      { name: 'Extension with Dumbbell (3)', sets: 2, reps: 10, priority: true },
      { name: 'Bent Over Triceps Extension (5) with Dumbbell', sets: 3, reps: 8 },
      { name: 'Bent Over Row with Dumbbell', sets: 2, reps: 8 },
      {
        name: 'Kettlebell Suitcase Carry with Dumbbell (15)',
        sets: 3,
        reps: '20ft',
        priority: true
      },
      {
        name: 'Weight Lassos (side + overhead) with Dumbbell (3)',
        sets: 3,
        reps: 10,
        priority: true
      },
      { name: 'Abduction, Thumbs Up with Dumbbell (3)', sets: 3, reps: 12, priority: true },
      { name: "90 90 Farmer's Carry with Dumbbell (15)", sets: 3, reps: '20ft', priority: true },
      { name: 'Kneeling Push Up', sets: 3, reps: 8 }
    ]
  },
  Seated: {
    displayName: 'Seated',
    accent: 'purple',
    icon: Dumbbell,
    exercises: [
      { name: 'Bicep Curls with Rotation (5) with Dumbbell', sets: 3, reps: 10 },
      { name: 'Horizontal Abduction with Dumbbell', sets: 2, reps: 10 },
      { name: 'Abduction, Elbow Bent with Dumbbell', sets: 3, reps: 10 },
      // No chin-up bar at home. Improvised, e.g. playground equipment.
      { name: 'Chin Up', sets: 2, reps: 8 }
    ]
  },
  Resistance: {
    displayName: 'Resistance',
    accent: 'purple',
    icon: InfinityIcon,
    exercises: [
      { name: 'Shoulder Extension with Resistance', sets: 3, reps: 10 },
      { name: 'Shoulder Flexion with Resistance', sets: 2, reps: 10 },
      { name: 'Shoulder ER (step) with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder IR (rotate) with Resistance', sets: 3, reps: 15 },
      { name: 'Supine PNF D2 Flexion with Resistance (left arm)', sets: 3, reps: 10 }
    ]
  }
}

// Done every day, outside the session choice. An exercise with `perWeek`
// shows up daily but counts toward a weekly number instead.
export const daily = ['hand', 'cardio']

// A day past `sessionsPerDay` sessions stops offering more unless asked, and
// one with `strengthPerDay` strength sessions rests the shoulder for the rest
// of it. Enough for a day, short of the whole week in one go.
export const limits = { sessionsPerDay: 2, strengthPerDay: 2 }

// One session is one sitting. Each day offers a few, ranked by what the week
// still owes (see lib/plan). `perWeek` is the weekly target. `strength` marks
// dumbbell work, which is not offered the day after another strength session.
// `warmup` is a block done first and left out of a short session. `stretches`
// names exercises from any block, done as a warm-down.
export const sessions = [
  {
    id: 'sidelying',
    name: 'Sidelying and seated shoulder',
    warmup: 'warmup',
    blocks: ['Sidelying', 'Seated'],
    perWeek: 2,
    strength: true,
    stretches: ['Sleeper Stretch (+ reverse)', 'Cross Body IR Stretch with Towel']
  },
  {
    id: 'lying',
    name: 'Lying shoulder',
    warmup: 'warmup',
    blocks: ['Supine'],
    perWeek: 2,
    strength: true,
    stretches: ['Corner Pec Minor Stretch', 'Serratus Activation with Foam Roll']
  },
  {
    id: 'standing',
    name: 'Standing shoulder',
    warmup: 'warmup',
    blocks: ['Standing'],
    perWeek: 2,
    strength: true,
    stretches: ['Shoulder IR Stretch', 'Snow Angels on Foam Roll']
  },
  {
    id: 'legs',
    name: 'Legs and core',
    blocks: ['legs', 'core'],
    perWeek: 2,
    stretches: ['Sleeper Stretch (+ reverse)', 'Shoulder IR Stretch']
  },
  {
    id: 'bands',
    name: 'Bands',
    blocks: ['Resistance'],
    perWeek: 2,
    stretches: [
      'Cross Body IR Stretch with Towel',
      'Corner Pec Minor Stretch',
      'Serratus Activation with Foam Roll',
      'Snow Angels on Foam Roll'
    ]
  }
]
