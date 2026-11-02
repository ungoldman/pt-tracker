import { Dumbbell, Infinity as InfinityIcon, Star, Wand2 } from 'lucide-react'

/** Strip the equipment suffix; the equipment is shown as an icon badge instead. */
export function formatExerciseName(name) {
  return name
    .replace(/ with Dumbbell/gi, '')
    .replace(/ with Dowel/gi, '')
    .replace(/ with Resistance/gi, '')
    .trim()
}

/**
 * What an exercise asks for, split so a card can set the count large: "3 × 10"
 * with "3s hold each", "2 × 30s" with "hold each", "5000".
 */
export function doseParts({ sets, reps, hold, target }) {
  if (target) return { main: String(target), sub: null }
  const count = reps ?? hold
  const main = sets ? `${sets} × ${count}` : reps ? `${reps} reps` : count
  return { main, sub: hold ? (reps ? `${hold} hold each` : 'hold each') : null }
}

/** The dose on one line, or an empty string for an item with none. */
export function formatDose(ex) {
  if (!ex.sets && !ex.reps && !ex.hold && !ex.target) return ''
  const { main, sub } = doseParts(ex)
  return sub ? `${main}, ${sub}` : main
}

const EQUIPMENT = [
  {
    word: 'dumbbell',
    label: 'Dumbbell',
    Icon: Dumbbell,
    dark: 'text-red-400',
    light: 'text-red-500'
  },
  { word: 'dowel', label: 'Dowel', Icon: Wand2, dark: 'text-purple-400', light: 'text-purple-500' },
  {
    word: 'resistance',
    label: 'Resistance band',
    Icon: InfinityIcon,
    dark: 'text-green-400',
    light: 'text-green-500'
  }
]

/** The equipment named in an exercise, read from its name, or undefined. */
export const equipmentOf = (exerciseName) =>
  EQUIPMENT.find(({ word }) => exerciseName.toLowerCase().includes(word))

/** Icon-only equipment badge inferred from the exercise name, or null. */
export function getExerciseIcon(exerciseName, darkMode) {
  const found = equipmentOf(exerciseName)
  if (!found) return null
  const { label, Icon, dark, light } = found
  return (
    <span className="shrink-0 flex items-center" title={label}>
      <Icon size={14} className={darkMode ? dark : light} />
    </span>
  )
}

/** Star marker for exercises flagged `priority`, or null. */
export function getPriorityIcon(show, darkMode) {
  if (!show) return null
  return <Star size={14} className={darkMode ? 'text-yellow-400' : 'text-yellow-500'} />
}
