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
  '<path d="M-6 -3 h9 M-3 3 h9"/>',
  '<path d="M-8 2 q4 -8 8 0 q2 4 8 -2"/>',
  '<circle cx="-4" cy="0" r="1.4" fill="#ffffff" stroke="none"/><circle cx="2" cy="-4" r="1.4" fill="#ffffff" stroke="none"/><circle cx="3" cy="4" r="1.4" fill="#ffffff" stroke="none"/>',
];

// ---- approximate ink radii (design px at scale 1) ----
// Used by the collision pass: high density, but nothing touches — like a
// notebook page filled with doodles.
const INK = {
  dumbbell: 15, mug: 14, bowl: 15, heart: 12, stopwatch: 14, shoe: 15,
  band: 14, sparkle: 9, moon: 12, roller: 14, bottle: 11, bicep: 13,
  sun: 13, stressball: 11, footprints: 12, dowel: 14, mat: 13, spiral: 11,
  confetti: 13, towel: 13, kettlebell: 12, zzz: 11, trophy: 13, hourglass: 11,
  target: 10, lightning: 10, banana: 11, check: 9, jumprope: 14, breath: 11,
  reps: 12, fivek: 11, mwf: 13, smiley: 12, bubble: 12,
};
const FILLER_R = [2, 3.5, 5, 4, 8, 4, 3.5, 6, 7, 9, 5];

// ---- parameters ----
const COLS = 10;
const ROWS = 14;
const CELL = 42;
const W = COLS * CELL;
const H = ROWS * CELL;
const SEED = 42;
const JITTER = 6;
const ROT = 18;
const GAP = 3; // guaranteed clearance between any two items' ink
const TIERS = [
  [1.38, 0.2],
  [1.15, 0.5],
  [0.82, 0.3],
];
const OPACITY = 1;
// Max extent an item can reach beyond its center (for seam duplication).
const EDGE = 16 * TIERS[0][0] + JITTER + GAP;

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
const placed = []; // { x, y, r } of every placed item's ink circle

// Torus distance so collision checks work across tile seams too.
function torusDist(x1, y1, x2, y2) {
  const dx = Math.min(Math.abs(x1 - x2), W - Math.abs(x1 - x2));
  const dy = Math.min(Math.abs(y1 - y2), H - Math.abs(y1 - y2));
  return Math.hypot(dx, dy);
}

// Largest ink radius that fits at (x, y) without touching anything placed.
function maxAllowedR(x, y) {
  let max = Infinity;
  for (const p of placed) {
    max = Math.min(max, torusDist(x, y, p.x, p.y) - p.r - GAP);
  }
  return max;
}

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

// Main doodles: jittered half-offset grid; the collision pass shrinks any
// item that would touch a neighbor (and skips it if it cannot fit legibly).
for (let row = 0; row < ROWS; row++) {
  const offset = row % 2 === 1 ? CELL / 2 : 0;
  for (let col = 0; col < COLS; col++) {
    const x = (((offset + col * CELL + CELL / 2 + between(-JITTER, JITTER)) % W) + W) % W;
    const y = (((row * CELL + CELL / 2 + between(-JITTER, JITTER)) % H) + H) % H;
    const [name, svg] = queue.next().value;
    const ink = INK[name] ?? 13;
    let scale = pickTier();
    const allowed = maxAllowedR(x, y);
    if (allowed < ink * 0.45) continue; // too cramped for a legible doodle
    scale = Math.min(scale, allowed / ink);
    const rot = between(-ROT, ROT);
    placed.push({ x, y, r: ink * scale });
    emit(x, y, {
      transform: ` rotate(${rot.toFixed(1)}) scale(${scale.toFixed(2)})`,
      svg: `<!-- ${name} -->${svg}`,
    });
  }
}

// Fillers in the remaining holes: grid corners and cell-edge midpoints, only
// where they genuinely fit with clearance.
const fillerSpots = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    fillerSpots.push([col * CELL, row * CELL]);
    fillerSpots.push([col * CELL + CELL / 2, row * CELL]);
    fillerSpots.push([col * CELL, row * CELL + CELL / 2]);
  }
}
for (const [fx, fy] of fillerSpots) {
  if (rnd() > 0.8) continue;
  const x = ((fx + between(-4, 4)) % W + W) % W;
  const y = ((fy + between(-4, 4)) % H + H) % H;
  const allowed = maxAllowedR(x, y);
  if (allowed < 2.5) continue;
  const rot = between(-ROT, ROT);
  // a hole big enough for a small doodle gets one; smaller holes get fillers
  const [name, svg] = queue.next().value;
  const ink = INK[name] ?? 13;
  if (allowed >= ink * 0.45) {
    const scale = Math.min(0.62, allowed / ink);
    placed.push({ x, y, r: ink * scale });
    emit(x, y, {
      transform: ` rotate(${rot.toFixed(1)}) scale(${scale.toFixed(2)})`,
      svg: `<!-- ${name} (nested) -->${svg}`,
    });
    continue;
  }
  const candidates = FILLERS.map((svg, i) => [FILLER_R[i], svg]).filter(([r]) => r <= allowed);
  if (candidates.length === 0) continue;
  const [r, f] = candidates[Math.floor(rnd() * candidates.length)];
  placed.push({ x, y, r });
  emit(x, y, { transform: ` rotate(${rot.toFixed(1)})`, svg: f });
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <!-- Generated by scripts/generate-doodles.mjs — edit that, not this.
       Strokes are solid white: light mode uses the tile directly
       (white-on-gray, ref image 1); dark mode uses it as a CSS mask over a
       color gradient (ref image 2). Opacity lives in src/index.css. -->
  <g fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="${OPACITY}">
${body}  </g>
</svg>
`;

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'doodles.svg');
writeFileSync(out, svg);
console.log(`wrote ${out}: ${W}x${H}, ${(svg.length / 1024).toFixed(1)}KB`);
