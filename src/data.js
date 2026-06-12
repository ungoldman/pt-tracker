// Blocks are organized by day-phase + energy, not clock time, to match when
// things realistically get done. Scheduling:
//   - Omit `days` (on the exercise or its block) → done DAILY.
//   - Loaded strength/resistance loads the shoulder and needs ~48h recovery, so
//     it runs Mon/Wed/Fri and rests the days between. PT guidance: don't push if
//     pain is up the next session; once 3x15 at a weight is comfortable, try +1lb.
//   - A per-exercise `days` wins; otherwise the block's `days` applies.
//
// Design intent:
//   - Wake-Up rides the reliable morning tea ritual: quick warm-up + mobility.
//   - Priority is its own block right after Wake-Up (the 3 priority dumbbells
//     M/W/F + the 2 priority stretches daily), so the must-do work is visually
//     separate and hard to lose in the mobility list.
//   - Strength is the M/W/F ~5pm workout: the non-priority loaded bulk only.
//   - Isometrics get their own planned end-of-workday block (~5pm clock-out),
//     harder to skip than the floaty evening. They alternate with Strength
//     (Tue/Thu/Sat/Sun) so strength days don't carry a double load; isometrics
//     are low-damage so daily would be safe, but 4x/week clears the 2-3x/week
//     effective dose and evens out the week.
//   - Wind-Down is the bedtime stretches.
//   - Personal Goals are NOT PT-prescribed (steps, jog, sit-ups) — Nate's own.
const MWF = ['Monday', 'Wednesday', 'Friday'];
const NON_STRENGTH_DAYS = ['Sunday', 'Tuesday', 'Thursday', 'Saturday'];

export const exercises = {
  'Wake-Up': {
    exercises: [
      // Quick warm-up first
      { name: 'Pendulums (all)', sets: 3, reps: 15 },
      { name: 'Wall Slides (flex/scap/abd)', sets: 2, reps: 10 },
      // Remaining mobility
      { name: 'Stress Ball Squeezes', sets: 3, reps: 15 },
      { name: 'Wall Ball Circles', sets: 3, reps: 15 },
      { name: 'Abduction with Dowel', sets: 3, reps: 8 },
      { name: 'Flexion Extension with Dowel', sets: 2, reps: 10 },
      { name: 'External Rotation with Dowel', sets: 3, reps: 10 },
    ],
  },
  Priority: {
    exercises: [
      {
        name: 'Supine Flexion with Dumbbell (2.5)',
        sets: 3,
        reps: 15,
        priority: 'high',
        days: MWF,
      },
      { name: 'Sidelying ER with Dumbbell (2.5)', sets: 3, reps: 10, priority: 'high', days: MWF },
      {
        name: 'Sidelying Abduction with Dumbbell (2.5)',
        sets: 3,
        reps: 15,
        priority: 'high',
        days: MWF,
      },
      { name: 'Shoulder IR Stretch', sets: 3, reps: '30s', priority: 'high' },
      { name: 'Cross Body Stretch with Towel', sets: 3, reps: '30s', priority: 'high' },
    ],
  },
  'Strength (M/W/F)': {
    days: MWF,
    exercises: [
      { name: 'Flexion (forward) with Dumbbell (2.5)', sets: 2, reps: 15 },
      { name: 'Extension (backward) with Dumbbell (2.5)', sets: 2, reps: 15 },
      { name: 'Wrist Sup/Pro with Dumbbell', sets: 3, reps: 12 },
      { name: 'Bicep Curls with Dumbbell', sets: 3, reps: 10 },
      { name: 'Hammer Curls with Dumbbell', sets: 3, reps: 10 },
      { name: 'Bent Over Triceps Extension with Dumbbell', sets: 3, reps: 8 },
      { name: 'Supine Serratus Punches with Dumbbell', sets: 2, reps: 10 },
      { name: 'Supine Horizontal Abd/Add with Dumbbell', sets: 3, reps: 8 },
      { name: 'Seated Horizontal Abduction with Dumbbell', sets: 2, reps: 10 },
      { name: 'Bench Press with Dumbbell', sets: 3, reps: 10 },
      { name: 'Incline Bench Press with Dumbbell', sets: 3, reps: 10 },
      { name: 'Bent Over Row with Dumbbell', sets: 3, reps: 10 },
      {
        name: 'Seated Single Arm Shoulder Abduction with Elbow Bent with Dumbbell',
        sets: 3,
        reps: 10,
      },
      { name: 'Shoulder Row with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder Extension with Resistance', sets: 3, reps: 10 },
      { name: 'Shoulder Flexion with Resistance', sets: 2, reps: 10 },
      { name: 'Tricep Extensions with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder IR (rotate) with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder ER (step) with Resistance', sets: 3, reps: 12 },
    ],
  },
  'Isometrics (End of Day)': {
    days: NON_STRENGTH_DAYS,
    exercises: [
      { name: 'Isometric Shoulder Flexion', sets: 10, hold: '10s' },
      { name: 'Isometric Shoulder Extension', sets: 10, hold: '10s' },
      { name: 'Isometric Internal Rotation', sets: 10, hold: '10s' },
      { name: 'Isometric External Rotation', sets: 10, hold: '10s' },
      { name: 'Isometric Shoulder Abduction', sets: 10, hold: '10s' },
      { name: 'Isometric Shoulder Adduction', sets: 10, hold: '10s' },
    ],
  },
  'Wind-Down': {
    exercises: [
      { name: 'Corner Pec Minor Stretch', sets: 3, hold: '30s' },
      { name: 'Serratus Activation with Foam Roll', sets: 2, hold: '30s' },
      // More stretch than strength, so daily here rather than M/W/F loading
      { name: 'Prone Shoulder Extension (facedown)', sets: 3, reps: 12 },
    ],
  },
  'Personal Goals (non-PT)': {
    // Dominated by untimed all-day steps + jogging, so a session estimate
    // would be misleading.
    noEstimate: true,
    exercises: [
      { name: 'Daily Steps Goal', target: 5000 },
      // Tue/Thu/Sat: 3x/week with 48h spacing per return-to-running guidance
      // (~10mo layoff: tissue adapts slower than heart/lungs; conversational
      // pace, add duration before intensity, +10%/week max once comfortable).
      {
        name: 'Light Jog',
        target: '0.5 miles',
        days: ['Tuesday', 'Thursday', 'Saturday'],
      },
      { name: 'Sit ups', sets: 3, reps: 15 },
    ],
  },
};
