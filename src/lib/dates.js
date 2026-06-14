import { DAYS } from './schedule';

/** Today's weekday name (the labels used as keys throughout the app). */
export const getTodayLabel = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

/** The date of `day` within the current Sun–Sat week, relative to today. */
export function getDateForDay(day) {
  const today = new Date();
  const diff = DAYS.indexOf(day) - DAYS.indexOf(getTodayLabel());
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result;
}

export const formatDateLabel = (date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
