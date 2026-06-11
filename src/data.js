// Blocks are organized by day-phase + energy, not clock time, to match when
// things realistically get done. Scheduling:
//   - Omit `days` (on the exercise or its block) → done DAILY.
//   - Loaded strength/resistance loads the shoulder and needs ~48h recovery, so
//     it runs Mon/Wed/Fri and rests the days between. PT guidance: don't push if
//     pain is up the next session; once 3x15 at a weight is comfortable, try +1lb.
//   - A per-exercise `days` wins; otherwise the block's `days` applies.
//
// Design intent:
//   - Wake-Up rides the reliable morning tea ritual and now carries ALL priority
//     work (the 3 priority dumbbells M/W/F + the 2 priority stretches daily),
//     ordered after a quick warm-up so the must-do work happens first.
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
      // Priority work, front-loaded so it gets done
      { name: 'Supine Flexion with Dumbbell (2.5)', sets: 3, reps: 15, priority: 'high', days: MWF },
      { name: 'Sidelying ER with Dumbbell (2.5)', sets: 3, reps: 10, priority: 'high', days: MWF },
      { name: 'Sidelying Abduction with Dumbbell (2.5)', sets: 3, reps: 15, priority: 'high', days: MWF },
      { name: 'Shoulder IR Stretch', sets: 3, reps: '30s', priority: 'high' },
      { name: 'Cross Body Stretch with Towel', sets: 3, reps: '30s', priority: 'high' },
      // Remaining mobility
      { name: 'Stress Ball Squeezes', sets: 3, reps: 15 },
      { name: 'Wall Ball Circles', sets: 3, reps: 15 },
      { name: 'Abduction with Dowel', sets: 3, reps: 8 },
      { name: 'Flexion Extension with Dowel', sets: 2, reps: 10 },
      { name: 'External Rotation with Dowel', sets: 3, reps: 10 },
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
      { name: 'Prone Shoulder Extension (facedown)', sets: 3, reps: 12 },
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
    ],
  },
  'Personal Goals (non-PT)': {
    exercises: [
      { name: 'Daily Steps Goal', target: 5000 },
      { name: 'Light Jog (every other day)', target: '0.5 miles' },
      { name: 'Sit ups', sets: 3, reps: 15 },
    ],
  },
};

export const quotes = [
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  {
    text: 'Strength does not come from physical capacity. It comes from an indomitable will.',
    author: 'Mahatma Gandhi',
  },
  { text: 'The body achieves what the mind believes.', author: 'Napoleon Hill' },
  { text: "Take care of your body. It's the only place you have to live.", author: 'Jim Rohn' },
  {
    text: 'Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.',
    author: 'John F. Kennedy',
  },
  { text: 'The hard days are what make you stronger.', author: 'Aly Raisman' },
  {
    text: 'Motivation is what gets you started. Habit is what keeps you going.',
    author: 'Jim Ryun',
  },
  {
    text: 'Do not pray for an easy life, pray for the strength to endure a difficult one.',
    author: 'Bruce Lee',
  },
  { text: 'The greatest wealth is health.', author: 'Virgil' },
  {
    text: 'He who has health, has hope; and he who has hope, has everything.',
    author: 'Thomas Carlyle',
  },
  { text: 'The first wealth is health.', author: 'Ralph Waldo Emerson' },
  {
    text: 'To keep the body in good health is a duty, otherwise we shall not be able to keep our mind strong and clear.',
    author: 'Buddha',
  },
  { text: 'A healthy outside starts from the inside.', author: 'Robert Urich' },
  {
    text: 'Health is a state of complete harmony of the body, mind and spirit.',
    author: 'B.K.S. Iyengar',
  },
  {
    text: "Movement is a medicine for creating change in a person's physical, emotional, and mental states.",
    author: 'Carol Welch',
  },
  {
    text: 'The pain you feel today will be the strength you feel tomorrow.',
    author: 'Arnold Schwarzenegger',
  },
  {
    text: "If you don't make time for exercise, you'll probably have to make time for illness.",
    author: 'Robin Sharma',
  },
  {
    text: 'True enjoyment comes from activity of the mind and exercise of the body; the two are ever united.',
    author: 'Wilhelm von Humboldt',
  },
  { text: 'Reading is to the mind what exercise is to the body.', author: 'Joseph Addison' },
  { text: 'Exercise should be regarded as tribute to the heart.', author: 'Gene Tunney' },
  {
    text: 'Those who think they have no time for bodily exercise will sooner or later have to find time for illness.',
    author: 'Edward Stanley',
  },
  { text: 'A bear, however hard he tries, grows tubby without exercise.', author: 'A.A. Milne' },
  {
    text: 'We do not stop exercising because we grow old - we grow old because we stop exercising.',
    author: 'Kenneth Cooper',
  },
  {
    text: 'Lack of activity destroys the good condition of every human being, while movement and methodical physical exercise save it and preserve it.',
    author: 'Plato',
  },
  {
    text: 'The reason I exercise is for the quality of life I enjoy.',
    author: 'Kenneth H. Cooper',
  },
  {
    text: 'What fits your busy schedule better, exercising one hour a day or being dead 24 hours a day?',
    author: 'Randy Glasbergen',
  },
  {
    text: 'Our bodies are our gardens - our wills are our gardeners.',
    author: 'William Shakespeare',
  },
  {
    text: 'Endurance is not just the ability to bear a hard thing, but to turn it into glory.',
    author: 'William Barclay',
  },
  { text: 'Champions keep playing until they get it right.', author: 'Billie Jean King' },
  {
    text: 'The only person you are destined to become is the person you decide to be.',
    author: 'Ralph Waldo Emerson',
  },
  {
    text: 'Success is the sum of small efforts repeated day in and day out.',
    author: 'Robert Collier',
  },
  {
    text: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
    author: 'Muhammad Ali',
  },
  {
    text: "The difference between the impossible and the possible lies in a person's determination.",
    author: 'Tommy Lasorda',
  },
  { text: 'Good things come to those who sweat.', author: 'Unknown' },
  {
    text: 'Perseverance is not a long race; it is many short races one after the other.',
    author: 'Walter Elliot',
  },
  { text: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin' },
  {
    text: 'Continuous effort - not strength or intelligence - is the key to unlocking our potential.',
    author: 'Winston Churchill',
  },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
  {
    text: 'It is health that is real wealth and not pieces of gold and silver.',
    author: 'Mahatma Gandhi',
  },
  { text: 'The human body is the best picture of the human soul.', author: 'Ludwig Wittgenstein' },
  {
    text: 'Movement is life. Life is a process. Improve the quality of the process and you improve the quality of life itself.',
    author: 'Moshe Feldenkrais',
  },
  {
    text: 'When it comes to health and well-being, regular exercise is about as close to a magic potion as you can get.',
    author: 'Thich Nhat Hanh',
  },
  {
    text: 'A vigorous five-mile walk will do more good for an unhappy but otherwise healthy adult than all the medicine and psychology in the world.',
    author: 'Paul Dudley White',
  },
  {
    text: 'Yoga is the journey of the self, through the self, to the self.',
    author: 'The Bhagavad Gita',
  },
  {
    text: 'The mind and body are not separate. What affects one, affects the other.',
    author: 'Unknown',
  },
  {
    text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit. Then get back to work.",
    author: 'Ralph Marston',
  },
  {
    text: 'Healing is a matter of time, but it is sometimes also a matter of opportunity.',
    author: 'Hippocrates',
  },
  { text: 'The part can never be well unless the whole is well.', author: 'Plato' },
  {
    text: "Time and health are two precious assets that we don't recognize and appreciate until they have been depleted.",
    author: 'Denis Waitley',
  },
];
