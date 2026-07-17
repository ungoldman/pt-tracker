import { Dumbbell, Infinity as InfinityIcon, Moon, Star, Sunrise, Target } from 'lucide-react'

// Each block carries its own layout identity: `lane` (fixed day-view column),
// `icon`, and `accent` (color token, resolved by lib/blockStyle). Scheduling: a
// per-exercise `days` wins, else the block's `days`, else daily. Loaded work
// (Strength/Resistance) runs Mon/Wed/Fri for ~48h shoulder recovery between
// sessions.
const MWF = ['Monday', 'Wednesday', 'Friday']

export const exercises = {
  'Warm Up': {
    lane: 0,
    icon: Sunrise,
    accent: 'amber',
    exercises: [
      { name: 'Pendulums (all)', sets: 3, reps: 15 },
      { name: 'Wall Slides (flex/scap/abd)', sets: 2, reps: 10 },
      { name: 'Stress Ball Squeezes', sets: 3, reps: 15 },
      { name: 'Wall Ball Circles', sets: 3, reps: 15 },
      { name: 'Abduction with Dowel', sets: 3, reps: 8 },
      { name: 'Flexion Extension with Dowel', sets: 2, reps: 10 },
      { name: 'External Rotation with Dowel', sets: 3, reps: 10 }
    ]
  },
  // Block membership is the priority flag: the star keys off the category.
  Priority: {
    lane: 0,
    icon: Star,
    accent: 'yellow',
    exercises: [
      { name: 'Sidelying ER with Dumbbell (3)', sets: 3, reps: 10, days: MWF },
      { name: 'Sidelying Abduction with Dumbbell (3)', sets: 3, reps: 15, days: MWF },
      { name: 'Sidelying Horizontal Abduction with Dumbbell (3)', sets: 3, reps: 10, days: MWF },
      { name: 'Supine Flexion with Dumbbell (3)', sets: 3, reps: 15, days: MWF },
      { name: 'Supine Horizontal Abduction with Dumbbell (3)', sets: 3, reps: 10, days: MWF },
      { name: 'Supine Skullcrushers with Dumbbell (3)', sets: 3, reps: 12, days: MWF },
      { name: 'Standing Flexion with Dumbbell (3)', sets: 2, reps: 15, days: MWF },
      { name: 'Standing Extension with Dumbbell (3)', sets: 2, reps: 15, days: MWF },
      { name: 'Shoulder IR Stretch', sets: 3, reps: '30s' },
      { name: 'Cross Body Stretch with Towel', sets: 3, reps: '30s' }
    ]
  },
  Strength: {
    lane: 1,
    icon: Dumbbell,
    accent: 'purple',
    days: MWF,
    exercises: [
      { name: 'Weight Lassos with Dumbbell (3)', sets: 3, reps: 10 },
      { name: 'Bicep Curls with Dumbbell', sets: 3, reps: 10 },
      { name: 'Hammer Curls with Dumbbell', sets: 3, reps: 10 },
      { name: 'Abduction, Thumbs Up with Dumbbell (3)', sets: 3, reps: 12 },
      { name: 'Bent Over Triceps Extension with Dumbbell', sets: 3, reps: 8 },
      { name: 'Bent Over Row with Dumbbell', sets: 3, reps: 10 },
      { name: 'Seated Horizontal Abduction with Dumbbell', sets: 2, reps: 10 },
      { name: 'Seated Abduction, Elbow Bent with Dumbbell', sets: 3, reps: 10 },
      { name: 'Supine Serratus Punches with Dumbbell', sets: 2, reps: 10 },
      { name: 'Supine Horizontal Abd/Add with Dumbbell', sets: 3, reps: 8 },
      { name: 'Bench Press with Dumbbell', sets: 3, reps: 10 },
      { name: 'Incline Bench Press with Dumbbell', sets: 3, reps: 10 },
      { name: 'Kettlebell Suitcase Carry with Dumbbell (15)', sets: 3, reps: '10ft' }
    ]
  },
  Resistance: {
    lane: 2,
    icon: InfinityIcon,
    accent: 'purple',
    days: MWF,
    exercises: [
      { name: 'Shoulder Row with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder Extension with Resistance', sets: 3, reps: 10 },
      { name: 'Shoulder Flexion with Resistance', sets: 2, reps: 10 },
      { name: 'Tricep Extensions with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder IR (rotate) with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder ER (step) with Resistance', sets: 3, reps: 12 }
    ]
  },
  'Wind Down': {
    lane: 2,
    icon: Moon,
    accent: 'indigo',
    exercises: [
      { name: 'Corner Pec Minor Stretch', sets: 3, hold: '30s' },
      { name: 'Serratus Activation with Foam Roll', sets: 2, hold: '30s' },
      { name: 'Prone Shoulder Extension', sets: 3, reps: 12 }
    ]
  },
  // Not PT-prescribed. Untimed steps/jog dominate, so skip the time estimate.
  'Personal Goals': {
    lane: 1,
    icon: Target,
    accent: 'teal',
    noEstimate: true,
    exercises: [
      { name: 'Daily Steps Goal', target: 5000 },
      { name: 'Light Jog', target: '1 mile', days: ['Tuesday', 'Thursday', 'Saturday'] },
      { name: 'Sit ups', sets: 2, reps: 30 }
    ]
  }
}
