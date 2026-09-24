import { Dumbbell, Hand, Infinity as InfinityIcon, Moon, Star, Sunrise, Target } from 'lucide-react'

// Each block carries its own layout identity: `lane` (fixed day-view column),
// `icon`, and `accent` (color token, resolved by lib/blockStyle). Scheduling: a
// per-exercise `days` wins, else the block's `days`, else daily. Loaded work
// (Strength/Resistance) runs Mon/Wed/Fri for ~48h shoulder recovery between
// sessions.
const MWF = ['Monday', 'Wednesday', 'Friday']
const TTS = ['Tuesday', 'Thursday', 'Saturday']
const STT = ['Sunday', 'Tuesday', 'Thursday']

const exerciseList = [
  {
    name: 'Sidelying ER with Dumbbell (3)',
    type: 'priority',
    sets: 3,
    reps: 10
  },
  {
    name: 'Sidelying Abduction with Dumbbell (3)',
    type: 'priority',
    sets: 3,
    reps: 10
  },
  {
    name: 'Supine Flexion with Dumbbell (3)',
    type: 'priority',
    sets: 3,
    reps: 10
  },

  {
    name: 'Shoulder IR Stretch',
    type: 'stretch',
    sets: 3,
    reps: '30s'
  },
  {
    name: 'Cross Body IR Stretch with Towel',
    type: 'stretch',
    sets: 3,
    reps: '30s'
  },

  {
    name: 'Standing Flexion with Dumbbell (3)',
    type: 'priority',
    sets: 2,
    reps: 10
  },
  {
    name: 'Standing Extension with Dumbbell (3)',
    type: 'priority',
    sets: 2,
    reps: 10
  },

  { name: 'Corner Pec Minor Stretch', type: 'stretch', sets: 3, hold: '30s' },
  { name: 'Sleeper Stretch (+ reverse)', type: 'stretch', sets: 1, reps: 8, hold: '10s' },

  {
    name: 'Seated Bicep Curls with Rotation (5) with Dumbbell',
    type: 'strength',
    sets: 3,
    reps: 10
  },
  {
    name: 'Standing Bent Over Triceps Extension (5) with Dumbbell',
    type: 'strength',
    sets: 3,
    reps: 8
  },

  {
    name: 'Supine Serratus Punches (5) with Dumbbell',
    type: 'strength',
    sets: 2,
    reps: 10
  },

  {
    name: 'Shoulder Extension with Resistance',
    type: 'resistance',
    sets: 3,
    reps: 10
  },

  {
    name: 'Wall Slides (flex/scap/abd)',
    type: 'warmup',
    sets: 2,
    reps: 10
  },
  {
    name: 'Wall Ball Circles (flex/scap/abd)',
    type: 'warmup',
    sets: 3,
    reps: 12
  },

  {
    name: 'Shoulder Flexion with Resistance',
    type: 'resistance',
    sets: 2,
    reps: 10
  },
  {
    name: 'Seated Horizontal Abduction with Dumbbell',
    type: 'strength',
    sets: 2,
    reps: 10
  },

  {
    name: 'Supine Bench Press (5) with Dumbbell',
    type: 'strength',
    sets: 3,
    reps: 10
  },

  {
    name: 'Shoulder ER (step) with Resistance',
    type: 'resistance',
    sets: 3,
    reps: 12
  },
  { name: 'Standing Bent Over Row with Dumbbell', type: 'strength', sets: 2, reps: 8 },

  {
    name: 'Serratus Activation with Foam Roll',
    type: 'stretch',
    sets: 2,
    hold: '30s'
  },

  {
    name: 'Seated Abduction, Elbow Bent with Dumbbell',
    type: 'strength',
    sets: 3,
    reps: 10
  },

  {
    name: 'Shoulder IR (rotate) with Resistance',
    type: 'resistance',
    sets: 3,
    reps: 15
  },

  {
    name: 'Standing Kettlebell Suitcase Carry with Dumbbell (15)',
    type: 'priority',
    sets: 3,
    reps: '20ft'
  },

  {
    name: 'Sidelying Horizontal Abduction with Dumbbell (3)',
    type: 'priority',
    sets: 3,
    reps: 10
  },

  {
    name: 'Supine Horizontal Abduction with Dumbbell (3)',
    type: 'priority',
    sets: 3,
    reps: 10
  },

  {
    name: 'Supine Skullcrushers with Dumbbell (3)',
    type: 'priority',
    sets: 3,
    reps: 12
  },

  {
    name: 'Standing Weight Lassos (side + overhead) with Dumbbell (3)',
    type: 'priority',
    sets: 3,
    reps: 10
  },

  {
    name: 'Standing Abduction, Thumbs Up with Dumbbell (3)',
    type: 'priority',
    sets: 3,
    reps: 12
  },

  {
    name: "Standing 90 90 Farmer's Carry with Dumbbell (15)",
    type: 'priority',
    sets: 3,
    reps: '20ft'
  },

  {
    name: 'Supine Prone Shoulder Extension (facedown)',
    type: 'wind-down',
    sets: 3,
    reps: 12
  },

  { name: 'Standing Wall Push Up', type: 'strength', sets: 3, reps: 10 },
  // No chin-up bar at home. Improvised, e.g. playground equipment.
  { name: 'Seated Chin Up', type: 'strength', sets: 2, reps: 8 },

  // HAND (home program, daily)
  { name: 'Volar Hand Self Massage', type: 'hand', sets: 3, reps: 10 },
  { name: 'Seated Finger DIP Flexion AROM with Blocking', type: 'hand', sets: 3, reps: 10 },
  { name: 'Finger PIP Flexion Extension with Blocking', type: 'hand', sets: 3, reps: 10 },
  {
    name: 'Seated Wrist Flexor Hook Fist Tendon Gliding',
    type: 'hand',
    sets: 3,
    reps: 10,
    hold: '3s'
  },
  { name: 'Putty Squeezes', type: 'hand', sets: 1, hold: '60s' },
  { name: 'Finger Pinch and Pull with Putty', type: 'hand', sets: 3, reps: 10 },
  { name: 'Quick Finger Spreading with Rubber Band', type: 'hand', sets: 3, reps: 10 },
  { name: 'Heat Therapy', type: 'hand', target: '5 min · 1-2x/day' },
  { name: 'Finger Wrap', type: 'hand', target: 'for typing, yard work' },

  // PERSONAL GOALS
  { name: 'Daily Steps', type: 'personal', target: 5000 },
  { name: 'Sit Ups', type: 'personal', sets: 2, reps: 30 },

  // 10K TRAINING
  {
    name: 'Run',
    type: '10k',
    target: '2k+',
    days: STT
  },
  {
    name: 'Squats',
    type: '10k',
    sets: 3,
    reps: 10,
    link: 'https://www.youtube.com/watch?v=DlS-GAF8Edg'
  },
  {
    name: 'Reverse Lunges (each leg)',
    type: '10k',
    sets: 3,
    reps: 10,
    link: 'https://www.youtube.com/watch?v=ALl174GTuoY'
  },
  {
    name: 'Calf Raises',
    type: '10k',
    sets: 3,
    reps: 15,
    link: 'https://www.youtube.com/watch?v=ndQc4mz4mBU'
  },
  {
    name: 'Glute bridge',
    type: '10k',
    sets: 3,
    reps: 10,
    link: 'https://www.youtube.com/watch?v=tdmSB0q21ic'
  },
  {
    name: 'Dead Bugs (each side)',
    type: '10k',
    sets: 3,
    reps: 10,
    link: 'https://www.youtube.com/watch?v=bxn9FBrt4-A'
  }
]

const blocks = {
  warmup: {
    displayName: 'Warm Up',
    lane: 0,
    icon: Sunrise,
    accent: 'amber'
  },
  priority: {
    displayName: 'Priority',
    lane: 0,
    icon: Star,
    accent: 'yellow'
  },
  strength: {
    displayName: 'Strength',
    lane: 1,
    icon: Dumbbell,
    accent: 'purple',
    days: MWF
  },
  resistance: {
    displayName: 'Resistance',
    lane: 2,
    icon: InfinityIcon,
    accent: 'purple',
    days: MWF
  },
  'wind-down': {
    displayName: 'Wind Down',
    lane: 2,
    icon: Moon,
    accent: 'indigo'
  },
  personal: {
    displayName: 'Personal Goals',
    lane: 1,
    icon: Target,
    accent: 'teal',
    noEstimate: true
  }
}

export const categories = {
  warmup: {
    displayName: 'Warm Up',
    lane: 0,
    icon: Sunrise,
    accent: 'amber'
  },
  hand: {
    displayName: 'Hand',
    lane: 0,
    icon: Hand,
    accent: 'indigo'
  },
  stretch: {
    displayName: 'Stretch',
    lane: 1,
    icon: Star,
    accent: 'teal'
  },
  personal: {
    displayName: 'Personal Goals',
    lane: 2,
    icon: Target,
    accent: 'blue',
    noEstimate: true
  },
  '10k': {
    displayName: '10k Training',
    lane: 2,
    icon: Target,
    accent: 'red',
    noEstimate: true,
    days: MWF
  },

  Sidelying: {
    displayName: 'Sidelying',
    lane: 0,
    icon: Dumbbell,
    accent: 'purple',
    days: MWF
  },
  Supine: {
    displayName: 'Supine',
    lane: 0,
    icon: Dumbbell,
    accent: 'purple',
    days: MWF
  },
  Standing: {
    displayName: 'Standing',
    lane: 1,
    icon: Dumbbell,
    accent: 'purple',
    days: MWF
  },
  Seated: {
    displayName: 'Seated',
    lane: 2,
    icon: Dumbbell,
    accent: 'purple',
    days: MWF
  },
  Resistance: {
    displayName: 'Resistance',
    lane: 0,
    icon: InfinityIcon,
    accent: 'purple',
    days: TTS
  }
}

// Types that pick their own block. Everything else is sorted into position
// blocks by name, so a typed exercise named "Seated ..." would otherwise land
// in two blocks.
const TYPED = new Set(['warmup', 'stretch', 'personal', '10k', 'hand'])

export const exercises = Object.keys(categories).reduce((acc, cat) => {
  if (TYPED.has(cat)) {
    const blockExercises = exerciseList.filter((exercise) => exercise.type === cat)
    if (blockExercises.length > 0) {
      acc[cat] = { ...categories[cat], exercises: blockExercises }
    }
    return acc
  }

  const blockExercises = exerciseList.filter(
    (exercise) => !TYPED.has(exercise.type) && exercise.name.includes(cat)
  )
  if (blockExercises.length > 0) {
    acc[cat] = {
      ...categories[cat],
      exercises: blockExercises.map((ex) => ({
        ...ex,
        name: ex.name.includes('Stretch') ? ex.name : ex.name.replace(`${cat} `, '')
      }))
    }
  }
  return acc
}, {})

export const exercisesOld = Object.keys(blocks).reduce((acc, block) => {
  const blockExercises = exerciseList.filter((exercise) => exercise.type === block)
  if (blockExercises.length > 0) {
    acc[block] = { ...blocks[block], exercises: blockExercises }
  }
  return acc
}, {})
