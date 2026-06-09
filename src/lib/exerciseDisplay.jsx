import { Dumbbell, Wand2, Infinity, Star } from 'lucide-react';

/** Strip the equipment suffix; the equipment is shown as an icon badge instead. */
export function formatExerciseName(name) {
  return name
    .replace(/ with Dumbbell/gi, '')
    .replace(/ with Dowel/gi, '')
    .replace(/ with Resistance/gi, '')
    .trim();
}

/** Equipment badge inferred from the exercise name, or null. */
export function getExerciseIcon(exerciseName, darkMode) {
  const n = exerciseName.toLowerCase();
  if (n.includes('dumbbell')) {
    return (
      <div className="flex items-center gap-1" title="Dumbbell">
        <Dumbbell size={14} className={darkMode ? 'text-red-400' : 'text-red-500'} />
        <span className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-500'}`}>DB</span>
      </div>
    );
  }
  if (n.includes('dowel')) {
    return (
      <div className="flex items-center gap-1" title="Dowel">
        <Wand2 size={14} className={darkMode ? 'text-purple-400' : 'text-purple-500'} />
        <span className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-500'}`}>DW</span>
      </div>
    );
  }
  if (n.includes('resistance')) {
    return (
      <div className="flex items-center gap-1" title="Resistance Band">
        <Infinity size={14} className={darkMode ? 'text-green-400' : 'text-green-500'} />
        <span className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-500'}`}>RB</span>
      </div>
    );
  }
  return null;
}

/** Star marker for priority exercises, or null. */
export function getPriorityIcon(priority, darkMode) {
  if (!priority) return null;
  return <Star size={14} className={darkMode ? 'text-yellow-400' : 'text-yellow-500'} />;
}
