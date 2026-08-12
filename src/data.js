import {
  Dumbbell,
  Infinity as InfinityIcon,
  Moon,
  Star,
  Sunrise,
  Target,
} from "lucide-react";

// Each block carries its own layout identity: `lane` (fixed day-view column),
// `icon`, and `accent` (color token, resolved by lib/blockStyle). Scheduling: a
// per-exercise `days` wins, else the block's `days`, else daily. Loaded work
// (Strength/Resistance) runs Mon/Wed/Fri for ~48h shoulder recovery between
// sessions.
const MWF = ["Monday", "Wednesday", "Friday"];

const e = [
  {
    name: "Sidelying ER with Dumbbell (3)",
    type: "priority",
    sets: 3,
    reps: 10,
    priority: "high",
    days: MWF,
  },
  {
    name: "Sidelying Abduction with Dumbbell (3)",
    type: "priority",
    sets: 3,
    reps: 10,
    priority: "high",
    days: MWF,
  },
  {
    name: "Supine Flexion with Dumbbell (3)",
    type: "priority",
    sets: 3,
    reps: 10,
    priority: "high",
    days: MWF,
  },

  {
    name: "Cross Body IR Stretch with Towel",
    type: "warmup",
    sets: 3,
    reps: "30s",
  },
  {
    name: "Shoulder IR Stretch",
    type: "warmup",
    sets: 3,
    reps: "30s",
  },

  {
    name: "Standing Flexion with Dumbbell (3)",
    type: "priority",
    sets: 2,
    reps: 10,
    days: MWF,
  },
  {
    name: "Extension (backward) with Dumbbell (3)",
    type: "priority",
    sets: 2,
    reps: 10,
    days: MWF,
  },

  { name: "Corner Pec Minor Stretch", type: "wind-down", sets: 3, hold: "30s" },

  { name: "Bicep Curls with Dumbbell", type: "strength", sets: 3, reps: 10 },
  {
    name: "Bent Over Triceps Extension with Dumbbell",
    type: "strength",
    sets: 3,
    reps: 8,
  },

  {
    name: "Supine Serratus Punches with Dumbbell",
    type: "strength",
    sets: 2,
    reps: 10,
  },

  {
    name: "Shoulder Extension with Resistance",
    type: "resistance",
    sets: 3,
    reps: 10,
  },

  { name: "Wall Slides (flex/scap/abd)", type: "warmup", sets: 2, reps: 10 },
  {
    name: "Wall Ball Circles (flex/scap/abd)",
    type: "warmup",
    sets: 3,
    reps: 15,
  },

  {
    name: "Shoulder Flexion with Resistance",
    type: "resistance",
    sets: 2,
    reps: 10,
  },
  {
    name: "Seated Horizontal Abduction with Dumbbell",
    type: "strength",
    sets: 2,
    reps: 10,
  },

  { name: "Bench Press with Dumbbell", type: "strength", sets: 3, reps: 10 },

  {
    name: "Shoulder ER (step) with Resistance",
    type: "resistance",
    sets: 3,
    reps: 12,
  },
  { name: "Bent Over Row with Dumbbell", type: "strength", sets: 3, reps: 10 },

  {
    name: "Serratus Activation with Foam Roll",
    type: "wind-down",
    sets: 2,
    hold: "30s",
  },

  {
    name: "Seated Abduction, Elbow Bent with Dumbbell",
    type: "strength",
    sets: 3,
    reps: 10,
  },

  {
    name: "Prone Shoulder Extension (facedown)",
    type: "wind-down",
    sets: 3,
    reps: 12,
  },

  {
    name: "Shoulder IR (rotate) with Resistance",
    type: "resistance",
    sets: 3,
    reps: 12,
  },

  {
    name: "Kettlebell Suitcase Carry with Dumbbell (15)",
    type: "priority",
    sets: 3,
    reps: "20ft",
    days: MWF,
  },

  {
    name: "Sidelying Horizontal Abduction with Dumbbell (3)",
    type: "priority",
    sets: 3,
    reps: 10,
    days: MWF,
  },

  {
    name: "Supine Horizontal Abduction with Dumbbell (3)",
    type: "priority",
    sets: 3,
    reps: 10,
    days: MWF,
  },

  {
    name: "Supine Skullcrushers with Dumbbell (3)",
    type: "priority",
    sets: 3,
    reps: 12,
    days: MWF,
  },

  {
    name: "Weight Lassos with Dumbbell (3)",
    type: "priority",
    sets: 3,
    reps: 10,
    days: MWF,
  },

  {
    name: "Abduction, Thumbs Up with Dumbbell (3)",
    type: "priority",
    sets: 3,
    reps: 12,
    days: MWF,
  },

  {
    name: "90 90 Farmer's Carry with Dumbbell (15)",
    type: "priority",
    sets: 3,
    reps: "20ft",
    days: MWF,
  },

  // personal goals are not PT-prescribed. Untimed steps/jog dominate, so skip the time estimate.
  { name: "Daily Steps Goal", type: "personal", target: 5000 },
  {
    name: "Light Jog",
    type: "personal",
    target: "1 mile",
  },
  { name: "Sit ups", type: "personal", sets: 2, reps: 30 },
];

const blocks = {
  warmup: {
    displayName: "Warm Up",
    lane: 0,
    icon: Sunrise,
    accent: "amber",
  },
  priority: {
    displayName: "Priority",
    lane: 0,
    icon: Star,
    accent: "yellow",
  },
  strength: {
    displayName: "Strength",
    lane: 1,
    icon: Dumbbell,
    accent: "purple",
    days: MWF,
    lane: 1,
  },
  resistance: {
    displayName: "Resistance",
    lane: 2,
    icon: InfinityIcon,
    accent: "purple",
    days: MWF,
    lane: 2,
  },
  "wind-down": {
    displayName: "Wind Down",
    lane: 2,
    icon: Moon,
    accent: "indigo",
  },
  personal: {
    displayName: "Personal Goals",
    lane: 1,
    icon: Target,
    accent: "teal",
    noEstimate: true,
  },
};

export const exercises = Object.keys(blocks).reduce((acc, block) => {
  const blockExercises = e.filter((exercise) => exercise.type === block);
  if (blockExercises.length > 0) {
    acc[block] = { ...blocks[block], exercises: blockExercises };
  }
  return acc;
}, {});
