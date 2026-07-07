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
//   - Priority is its own block right after Wake-Up (the M/W/F weighted work
//     + the daily stretches), so the must-do work is visually separate and
//     hard to lose in the mobility list. Membership in this block IS the
//     priority flag — the star icon keys off the category, not a prop.
//   - Strength is the M/W/F ~5pm workout (the non-priority loaded bulk), split
//     by body position into Supine/Sidelying (floor work) and Standing so each
//     half is independently collapsible and fits a laptop viewport.
//   - Wind-Down is the bedtime stretches.
//   - Personal Goals are NOT PT-prescribed (steps, jog, sit-ups) — Nate's own.
const MWF = ['Monday', 'Wednesday', 'Friday'];

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
  // Everything in this block is priority by definition (the star icon is
  // driven by block membership, not a per-exercise prop).
  Priority: {
    exercises: [
      // Old movements, but the added weight is new — done first.
      { name: 'Flexion (forward) with Dumbbell (3)', sets: 2, reps: 15, days: MWF },
      { name: 'Extension (backward) with Dumbbell (3)', sets: 2, reps: 15, days: MWF },
      { name: 'Supine Flexion with Dumbbell (3)', sets: 3, reps: 15, days: MWF },
      { name: 'Sidelying Abduction with Dumbbell (3)', sets: 3, reps: 15, days: MWF },
      { name: 'Sidelying ER with Dumbbell (3)', sets: 3, reps: 10, days: MWF },
      { name: 'Shoulder IR Stretch', sets: 3, reps: '30s' },
      { name: 'Cross Body Stretch with Towel', sets: 3, reps: '30s' },
    ],
  },
  // Split from a single Strength block by body position, so each half is
  // independently collapsible and fits a laptop viewport. Same M/W/F session.
  'Strength: Supine/Sidelying': {
    days: MWF,
    exercises: [
      { name: 'Bench Press with Dumbbell', sets: 3, reps: 10 },
      { name: 'Supine Serratus Punches with Dumbbell', sets: 2, reps: 10 },
      { name: 'Supine Horizontal Abd/Add with Dumbbell', sets: 3, reps: 8 },
      { name: 'Incline Bench Press with Dumbbell', sets: 3, reps: 10 },
      { name: 'Sidelying Shoulder Horizontal Abduction with Dumbbell (3)', sets: 3, reps: 10 },
      { name: 'Supine Shoulder Horizontal Abduction with Dumbbell (3)', sets: 3, reps: 10 },
      { name: 'Supine Elbow Flexion Extension with Dumbbell (3)', sets: 3, reps: 12 },
    ],
  },
  'Strength: Standing': {
    days: MWF,
    exercises: [
      { name: 'Wrist Sup/Pro with Dumbbell', sets: 3, reps: 12 },
      { name: 'Bicep Curls with Dumbbell', sets: 3, reps: 10 },
      { name: 'Hammer Curls with Dumbbell', sets: 3, reps: 10 },
      { name: 'Bent Over Triceps Extension with Dumbbell', sets: 3, reps: 8 },
      { name: 'Seated Horizontal Abduction with Dumbbell', sets: 2, reps: 10 },
      {
        name: 'Seated Single Arm Shoulder Abduction with Elbow Bent with Dumbbell',
        sets: 3,
        reps: 10,
      },
      { name: 'Bent Over Row with Dumbbell', sets: 3, reps: 10 },
      { name: 'Kettlebell Suitcase Carry (15)', sets: 3, reps: '10ft' },
      { name: 'Weight Lassos (overhead/side/front) with Dumbbell (3)', sets: 3, reps: 10 },
      { name: 'Shoulder Abduction - Thumbs Up with Dumbbell (3)', sets: 3, reps: 12 },
    ],
  },
  // Split out from Strength: same M/W/F session, band work instead of dumbbells,
  // so each half is independently collapsible and fits a laptop viewport.
  'Resistance': {
    days: MWF,
    exercises: [
      { name: 'Shoulder Row with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder Extension with Resistance', sets: 3, reps: 10 },
      { name: 'Shoulder Flexion with Resistance', sets: 2, reps: 10 },
      { name: 'Tricep Extensions with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder IR (rotate) with Resistance', sets: 3, reps: 12 },
      { name: 'Shoulder ER (step) with Resistance', sets: 3, reps: 12 },
    ],
  },
  'Wind-Down': {
    exercises: [
      { name: 'Corner Pec Minor Stretch', sets: 3, hold: '30s' },
      { name: 'Serratus Activation with Foam Roll', sets: 2, hold: '30s' },
      // More stretch than strength, so daily here rather than M/W/F loading
      { name: 'Prone Shoulder Extension', sets: 3, reps: 12 },
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
        target: '1 mile',
        days: ['Tuesday', 'Thursday', 'Saturday'],
      },
      { name: 'Sit ups', sets: 2, reps: 30 },
    ],
  },
};
