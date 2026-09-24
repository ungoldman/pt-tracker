import { Dumbbell, Hand, Infinity as InfinityIcon, Star, Sunrise, Target } from 'lucide-react'

// Blocks keyed by name, in display order. Each carries its layout identity:
// `lane` (fixed day-view column), `icon`, and `accent` (color token, resolved
// by lib/blockStyle). Scheduling: a per-exercise `days` wins, else the block's
// `days`, else daily. The `strength` blocks run Mon/Wed/Fri for ~48h shoulder
// recovery between sessions, and Resistance runs on the days between.
//
// Completion and notes are keyed by block name plus a hash of the exercise
// name (see lib/stats), so renaming either one drops its saved state.
const MWF = ['Monday', 'Wednesday', 'Friday']
const TTS = ['Tuesday', 'Thursday', 'Saturday']
const STT = ['Sunday', 'Tuesday', 'Thursday']

export const exercises = {
  warmup: {
    displayName: 'Warm Up',
    lane: 0,
    accent: 'amber',
    icon: Sunrise,
    exercises: [
      { name: 'Wall Slides (flex/scap/abd)', sets: 2, reps: 10 },
      { name: 'Wall Ball Circles (flex/scap/abd)', sets: 3, reps: 12 }
    ]
  },
  hand: {
    displayName: 'Hand',
    lane: 0,
    accent: 'indigo',
    icon: Hand,
    // Home program from the hand PT intake, all once a day.
    exercises: [
      { name: 'Volar Hand Self Massage', sets: 3, reps: 10 },
      { name: 'Seated Finger DIP Flexion AROM with Blocking', sets: 3, reps: 10 },
      { name: 'Finger PIP Flexion Extension with Blocking', sets: 3, reps: 10 },
      { name: 'Seated Wrist Flexor Hook Fist Tendon Gliding', sets: 3, reps: 10, hold: '3s' },
      { name: 'Putty Squeezes', sets: 1, hold: '60s' },
      { name: 'Finger Pinch and Pull with Putty', sets: 3, reps: 10 },
      { name: 'Quick Finger Spreading with Rubber Band', sets: 3, reps: 10 },
      { name: 'Heat Therapy', target: '5 min · 1-2x/day' },
      { name: 'Finger Wrap', target: 'for typing, yard work' }
    ]
  },
  stretch: {
    displayName: 'Stretch',
    lane: 1,
    accent: 'teal',
    icon: Star,
    exercises: [
      { name: 'Shoulder IR Stretch', sets: 3, reps: '30s' },
      { name: 'Cross Body IR Stretch with Towel', sets: 3, reps: '30s' },
      { name: 'Corner Pec Minor Stretch', sets: 3, hold: '30s' },
      { name: 'Sleeper Stretch (+ reverse)', sets: 1, reps: 8, hold: '10s' },
      { name: 'Serratus Activation with Foam Roll', sets: 2, hold: '30s' }
    ]
  },
  personal: {
    displayName: 'Personal Goals',
    lane: 2,
    accent: 'blue',
    noEstimate: true,
    icon: Target,
    exercises: [
      { name: 'Daily Steps', target: 5000 },
      { name: 'Sit Ups', sets: 2, reps: 30 }
    ]
  },
  '10k': {
    displayName: '10k Training',
    lane: 2,
    accent: 'red',
    noEstimate: true,
    days: MWF,
    icon: Target,
    exercises: [
      { name: 'Run', target: '2k+', days: STT },
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
      },
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
    strength: true,
    lane: 0,
    accent: 'purple',
    days: MWF,
    icon: Dumbbell,
    exercises: [
      { name: 'ER with Dumbbell (3)', sets: 3, reps: 10, priority: true },
      { name: 'Abduction with Dumbbell (3)', sets: 3, reps: 10, priority: true },
      { name: 'Horizontal Abduction with Dumbbell (3)', sets: 3, reps: 10, priority: true }
    ]
  },
  Supine: {
    displayName: 'Supine',
    strength: true,
    lane: 0,
    accent: 'purple',
    days: MWF,
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
    strength: true,
    lane: 1,
    accent: 'purple',
    days: MWF,
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
      { name: 'Wall Push Up', sets: 3, reps: 10 }
    ]
  },
  Seated: {
    displayName: 'Seated',
    strength: true,
    lane: 2,
    accent: 'purple',
    days: MWF,
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
    lane: 0,
    accent: 'purple',
    days: TTS,
    icon: InfinityIcon,
    exercises: [
      { name: 'Shoulder Extension with Resistance', sets: 3, reps: 10 },
      { name: 'Shoulder Flexion with Resistance', sets: 2, reps: 10 },
      { name: 'Shoulder ER (step) with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder IR (rotate) with Resistance', sets: 3, reps: 15 }
    ]
  }
}
