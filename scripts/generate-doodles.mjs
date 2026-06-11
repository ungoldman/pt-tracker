// Generates public/doodles.svg — the exercise doodle wallpaper tile
// (WhatsApp chat-background style). Density, size tiers, jitter, and seed are
// parameters here; run `node scripts/generate-doodles.mjs` after tweaking.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---- doodle library (each drawn in a ~40px box centered on 0,0) ----
const SHAPES = [
  ['dumbbell', '<path d="M-14 -7 v14 M-9 -10 v20 M9 -10 v20 M14 -7 v14 M-9 0 h18"/>'],
  [
    'mug',
    '<rect x="-10" y="-4" width="15" height="13" rx="3"/><path d="M5 -2 a4.5 4.5 0 0 1 0 9"/><path d="M-6 -9 q2 -3 0 -6 M1 -9 q2 -3 0 -6"/>',
  ],
  [
    'bowl',
    '<path d="M-12 -2 h24"/><path d="M-12 -2 a12 11 0 0 0 24 0"/><path d="M5 -14 l7 7"/><circle cx="3.5" cy="-15.5" r="2.5"/><path d="M17 -8 q3 4 0 8"/>',
  ],
  [
    'heart',
    '<path d="M0 9 C -11 2 -10 -8 -4 -8 C -1 -8 0 -5 0 -5 C 0 -5 1 -8 4 -8 C 10 -8 11 2 0 9 Z"/><path d="M-8 -1 h4 l2 -4 l3 7 l2 -3 h4"/>',
  ],
  [
    'stopwatch',
    '<circle cx="0" cy="2" r="11"/><path d="M0 2 v-6 M0 -13 v4 M-4 -13 h8 M9 -9 l3 -3"/>',
  ],
  [
    'shoe',
    '<path d="M-15 5 q-1 -9 6 -9 q5 0 8 5 q3 4 8 4 h7 q2 5 -3 5 h-24 q-2 0 -2 -5"/><path d="M-5 -2 l3 3 M-1 -4 l3 3"/>',
  ],
  [
    'band',
    '<circle cx="-14" cy="-7" r="3.5"/><circle cx="14" cy="7" r="3.5"/><path d="M-11 -5 C -4 1 4 -1 11 5"/>',
  ],
  ['sparkle', '<path d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z"/>'],
  [
    'moon',
    '<path d="M3 -11 a11 11 0 1 0 7 17 a9 9 0 0 1 -7 -17"/><path d="M11 -4 v6 M8 -1 h6"/>',
  ],
  [
    'roller',
    '<ellipse cx="-10" cy="0" rx="4" ry="8"/><path d="M-10 -8 h20 a4 8 0 0 1 0 16 h-20"/>',
  ],
  [
    'bottle',
    '<rect x="-5" y="-7" width="10" height="19" rx="3"/><path d="M-3 -7 v-4 h6 v4 M-5 1 h10"/>',
  ],
  [
    'bicep',
    '<path d="M-11 11 q-1 -13 7 -15 l1 -5 q0 -2 2 -2 l4 1 q2 1 1 3 l-1 5 q8 3 7 13"/><circle cx="3" cy="-9" r="2.2"/>',
  ],
  [
    'sun',
    '<circle r="6"/><path d="M0 -13 v4 M0 9 v4 M-13 0 h4 M9 0 h4 M-9 -9 l2.5 2.5 M6.5 6.5 l2.5 2.5 M-9 9 l2.5 -2.5 M6.5 -6.5 l2.5 -2.5"/>',
  ],
  ['stressball', '<circle r="8"/><path d="M-12 -3 q-2 3 0 6 M12 -3 q2 3 0 6"/>'],
  [
    'footprints',
    '<ellipse cx="-6" cy="-2" rx="3.5" ry="6"/><circle cx="-6" cy="-10.5" r="1.7"/><ellipse cx="6" cy="7" rx="3.5" ry="6"/><circle cx="6" cy="-1.5" r="1.7"/>',
  ],
  ['dowel', '<path d="M-13 13 L13 -13 M-11 6 l5 5 M6 -11 l5 5"/>'],
  ['mat', '<circle r="7"/><path d="M0 0 q4 0 4 -4"/><path d="M-13 10 h26"/>'],
  ['spiral', '<path d="M1 1 q5 -1 4 -6 q-1 -7 -9 -6 q-10 1 -9 11 q1 12 14 11"/>'],
  [
    'confetti',
    '<path d="M-8 -8 l3 3 M7 -10 l2 4 M-10 5 l4 2 M8 8 l-3 -3"/><circle cx="0" cy="-2" r="1.7"/><circle cx="10" cy="0" r="1.7"/><circle cx="-6" cy="-13" r="1.7"/>',
  ],
  ['towel', '<path d="M-10 -12 h14 q4 0 4 4 v16 M-10 -12 v20 q0 4 4 4 h13"/>'],
  ['kettlebell', '<circle cy="4" r="9.5"/><path d="M-5.5 -3 a 7 7 0 0 1 11 0"/>'],
  ['zzz', '<path d="M-9 -9 h8 l-8 8 h8"/><path d="M3 -2 h6 l-6 6 h6"/>'],
  [
    'trophy',
    '<path d="M-7 -11 h14 v6 a7 7 0 0 1 -14 0 z"/><path d="M-7 -9 q-5 0 -4 5 q1 4 4 3 M7 -9 q5 0 4 5 q-1 4 -4 3"/><path d="M0 2 v5 M-5 11 h10 M-3 7.5 h6"/>',
  ],
  [
    'hourglass',
    '<path d="M-6 -10 h12 M-6 10 h12 M-5 -10 q0 7 5 10 q-5 3 -5 10 M5 -10 q0 7 -5 10 q5 3 5 10"/>',
  ],
  ['target', '<circle r="10"/><circle r="5.5"/><circle r="1.4"/>'],
  ['lightning', '<path d="M2 -11 l-9 12 h6 l-3 10 l10 -13 h-6 z"/>'],
  [
    'banana',
    '<path d="M-10 -4 q0 12 13 12 q5 0 7 -3 q-4 1 -8 0 q-10 -2 -9 -9 z"/><path d="M-10 -4 l-1.5 -3.5"/>',
  ],
  ['check', '<circle r="9"/><path d="M-4 0 l3 3 l6 -7"/>'],
  [
    'jumprope',
    '<path d="M-12 -6 q-5 14 9 16 q14 2 16 -12"/><path d="M-12 -6 l-2 -6 M13 -2 l3 -6"/>',
  ],
  [
    'breath',
    '<path d="M-10 -6 q4 -3 8 0 t8 0 M-10 0 q4 -3 8 0 t8 0 M-10 6 q4 -3 8 0 t8 0"/>',
  ],
  // text chips, like the "42"/"BFF"/"24" bits in the reference wallpapers
  [
    'reps',
    '<text y="4" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff" stroke="none" font-family="-apple-system, Helvetica, sans-serif">3x15</text>',
  ],
  [
    'fivek',
    '<rect x="-11" y="-8" width="22" height="16" rx="4"/><text y="3.5" text-anchor="middle" font-size="9" font-weight="700" fill="#ffffff" stroke="none" font-family="-apple-system, Helvetica, sans-serif">5K</text>',
  ],
  [
    'mwf',
    '<text y="3.5" text-anchor="middle" font-size="9" font-weight="700" fill="#ffffff" stroke="none" font-family="-apple-system, Helvetica, sans-serif">M/W/F</text>',
  ],
  [
    'smiley',
    '<circle r="9"/><path d="M-3.5 -3 v1.5 M3.5 -3 v1.5"/><path d="M-4 2.5 q4 4 8 0"/><path d="M11 -8 q3 4 0 6 q-3 -2 0 -6"/>',
  ],
  [
    'bubble',
    '<rect x="-11" y="-9" width="22" height="14" rx="4"/><path d="M-4 5 l-3 5 l7 -5"/><text y="1.5" text-anchor="middle" font-size="8" font-weight="700" fill="#ffffff" stroke="none" font-family="-apple-system, Helvetica, sans-serif">HI</text>',
  ],
];

const FILLERS = [
  '<circle r="2" fill="#ffffff" stroke="none"/>',
  '<circle r="3.5"/>',
  '<path d="M0 -5 v10 M-5 0 h10"/>',
  '<path d="M0 -4 L1.5 0 L0 4 L-1.5 0 Z"/>',
  '<path d="M-7 0 q2 -4 4 0 t4 0 t4 0"/>',
  '<path d="M-3 -3 l6 6 M3 -3 l-6 6"/>',
  '<path d="M0 2.5 C -3.5 0 -3 -3 -1 -3 C 0 -3 0 -2 0 -2 C 0 -2 0 -3 1 -3 C 3 -3 3.5 0 0 2.5 Z"/>',
  '<circle r="1.4" fill="#ffffff" stroke="none"/><circle cx="6" cy="3" r="1.4" fill="#ffffff" stroke="none"/>',
];

// ---- parameters ----
const COLS = 10;
const ROWS = 14;
const CELL = 48;
const W = COLS * CELL;
const H = ROWS * CELL;
const SEED = 42;
const JITTER = 7;
const ROT = 18;
// scale tiers: a few heroes, mostly mid, some small. Item radius is ~22*scale,
// so the mid tier nearly fills its cell — WhatsApp-level item:gap ratio.
const TIERS = [
  [1.0, 0.2],
  [0.82, 0.5],
  [0.58, 0.3],
];
const FILLER_PROB = 0.8;
const OPACITY = 1;
// Max extent an item can reach beyond its center (hero radius + jitter).
const EDGE = 22 * TIERS[0][0] + JITTER;

// ---- deterministic prng ----
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const between = (a, b) => a + rnd() * (b - a);
const pickTier = () => {
  let r = rnd();
  for (const [scale, p] of TIERS) {
    if ((r -= p) <= 0) return scale;
  }
  return TIERS[TIERS.length - 1][0];
};

// Shuffled queue so every shape appears before any repeats.
function* shapeQueue() {
  for (;;) {
    const bag = [...SHAPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    yield* bag;
  }
}
const queue = shapeQueue();

let body = '';

// Emit an element at (x, y) on the torus: wrap the position into the tile,
// then duplicate near edges (shifted by ±W/±H) so the pattern tiles
// seamlessly with no thin/empty bands at repeat boundaries.
function emit(x, y, inner) {
  x = ((x % W) + W) % W;
  y = ((y % H) + H) % H;
  const xs = [x];
  const ys = [y];
  if (x < EDGE) xs.push(x + W);
  if (x > W - EDGE) xs.push(x - W);
  if (y < EDGE) ys.push(y + H);
  if (y > H - EDGE) ys.push(y - H);
  for (const cx of xs) {
    for (const cy of ys) {
      body += `    <g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})${inner.transform}">${inner.svg}</g>\n`;
    }
  }
}

// Main doodles: jittered grid, alternate rows offset half a cell, no clamping
// (the torus wrap keeps edge rows as dense as interior ones).
for (let row = 0; row < ROWS; row++) {
  const offset = row % 2 === 1 ? CELL / 2 : 0;
  for (let col = 0; col < COLS; col++) {
    const scale = pickTier();
    const x = offset + col * CELL + CELL / 2 + between(-JITTER, JITTER);
    const y = row * CELL + CELL / 2 + between(-JITTER, JITTER);
    const rot = between(-ROT, ROT);
    const [name, svg] = queue.next().value;
    emit(x, y, {
      transform: ` rotate(${rot.toFixed(1)}) scale(${scale})`,
      svg: `<!-- ${name} -->${svg}`,
    });
  }
}

// Micro fillers at every grid corner (the gaps between four neighbors).
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    if (rnd() > FILLER_PROB) continue;
    const x = col * CELL + between(-4, 4);
    const y = row * CELL + between(-4, 4);
    const rot = between(-ROT, ROT);
    const f = FILLERS[Math.floor(rnd() * FILLERS.length)];
    emit(x, y, { transform: ` rotate(${rot.toFixed(1)})`, svg: f });
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <!-- Generated by scripts/generate-doodles.mjs — edit that, not this.
       Strokes are solid white: light mode uses the tile directly
       (white-on-gray, ref image 1); dark mode uses it as a CSS mask over a
       color gradient (ref image 2). Opacity lives in src/index.css. -->
  <g fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="${OPACITY}">
${body}  </g>
</svg>
`;

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'doodles.svg');
writeFileSync(out, svg);
console.log(`wrote ${out}: ${W}x${H}, ${(svg.length / 1024).toFixed(1)}KB`);
