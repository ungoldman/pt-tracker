import { Dumbbell, Infinity as InfinityIcon, Star, Wand2 } from 'lucide-react'

/** Strip the equipment suffix; the equipment is shown as an icon badge instead. */
export function formatExerciseName(name) {
  return name
    .replace(/ with Dumbbell/gi, '')
    .replace(/ with Dowel/gi, '')
    .replace(/ with Resistance/gi, '')
    .trim()
}

/** Icon-only equipment badge inferred from the exercise name, or null. */
export function getExerciseIcon(exerciseName, darkMode) {
  const n = exerciseName.toLowerCase()
  if (n.includes('dumbbell')) {
    return (
      <span className="flex-shrink-0 flex items-center" title="Dumbbell">
        <Dumbbell size={14} className={darkMode ? 'text-red-400' : 'text-red-500'} />
      </span>
    )
  }
  if (n.includes('dowel')) {
    return (
      <span className="flex-shrink-0 flex items-center" title="Dowel">
        <Wand2 size={14} className={darkMode ? 'text-purple-400' : 'text-purple-500'} />
      </span>
    )
  }
  if (n.includes('resistance')) {
    return (
      <span className="flex-shrink-0 flex items-center" title="Resistance Band">
        <InfinityIcon size={14} className={darkMode ? 'text-green-400' : 'text-green-500'} />
      </span>
    )
  }
  return null
}

/** Star marker for priority-block exercises, or null. */
export function getPriorityIcon(show, darkMode) {
  if (!show) return null
  return <Star size={14} className={darkMode ? 'text-yellow-400' : 'text-yellow-500'} />
}
