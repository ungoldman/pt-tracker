import { useState, useEffect } from 'react';
import {
  Check,
  Dumbbell,
  Wand2,
  Infinity,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  Upload,
  Download,
  CalendarRange,
  BellRing,
  FileText,
  Timer,
  Link,
} from 'lucide-react';
import { exercises, quotes } from './data';

const Confetti = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: 2 + Math.random() * 92,
    delay: Math.random() * 0.2,
    rotation: Math.random() * 360,
    duration: 1.5 + Math.random() * 0.5,
    color: [
      'bg-yellow-400',
      'bg-green-400',
      'bg-blue-400',
      'bg-pink-400',
      'bg-purple-400',
      'bg-red-400',
      'bg-orange-400',
    ][Math.floor(Math.random() * 7)],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute w-3 h-3 ${piece.color} rounded-sm shadow-lg`}
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            animation: `confetti ${piece.duration}s ease-out forwards`,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const App = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Initialize dark mode synchronously to prevent flash
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ptTrackerDarkMode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem('ptTrackerCompleted');
    return saved ? JSON.parse(saved) : {};
  });

  const [quote, setQuote] = useState(null);
  const [bgGradient, setBgGradient] = useState('');
  const [confettiKey, setConfettiKey] = useState(null);
  const [justCompleted, setJustCompleted] = useState(new Set());
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('ptTrackerNotes');
    return saved ? JSON.parse(saved) : {};
  });
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('ptTrackerViewMode');
    return saved ? JSON.parse(saved) : 'week';
  });
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const [selectedDay, setSelectedDay] = useState(todayLabel);
  const [syncMessage, setSyncMessage] = useState('');
  const [expandedNotes, setExpandedNotes] = useState(new Set());

  useEffect(() => {
    localStorage.setItem('ptTrackerCompleted', JSON.stringify(completed));
  }, [completed]);

  useEffect(() => {
    localStorage.setItem('ptTrackerNotes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('ptTrackerDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('ptTrackerViewMode', JSON.stringify(viewMode));
  }, [viewMode]);

  useEffect(() => {
    // More interesting gradient backgrounds
    const lightGradients = [
      'from-blue-100 via-purple-100 to-pink-100',
      'from-green-100 via-emerald-100 to-teal-100',
      'from-orange-100 via-red-100 to-rose-100',
      'from-violet-100 via-fuchsia-100 to-pink-100',
      'from-cyan-100 via-sky-100 to-blue-100',
      'from-amber-100 via-yellow-100 to-lime-100',
      'from-indigo-100 via-blue-100 to-cyan-100',
      'from-rose-100 via-orange-100 to-amber-100',
    ];

    const darkGradients = [
      'from-slate-900 via-purple-900 to-slate-900',
      'from-gray-900 via-emerald-900 to-gray-900',
      'from-gray-900 via-blue-900 to-gray-900',
      'from-slate-900 via-cyan-900 to-slate-900',
      'from-gray-900 via-indigo-900 to-gray-900',
      'from-slate-900 via-teal-900 to-slate-900',
      'from-gray-900 via-violet-900 to-gray-900',
      'from-slate-900 via-rose-900 to-slate-900',
    ];

    const gradients = darkMode ? darkGradients : lightGradients;
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    setBgGradient(randomGradient);
  }, [darkMode]);

  useEffect(() => {
    // Select random quote on mount only
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  const showNextQuote = () => {
    if (!quotes || quotes.length === 0) return;
    setQuote((prev) => {
      const remaining = quotes.filter(
        (q) => !prev || q.text !== prev.text || q.author !== prev.author
      );
      const pool = remaining.length > 0 ? remaining : quotes;
      return pool[Math.floor(Math.random() * pool.length)];
    });
  };

  const toggleComplete = (day, category, exerciseIndex) => {
    const key = `${day}-${category}-${exerciseIndex}`;
    const isCurrentlyCompleted = completed[key];

    setCompleted((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    // Trigger confetti only when completing (not uncompleting)
    if (!isCurrentlyCompleted) {
      setConfettiKey(key);
      setJustCompleted((prev) => new Set(prev).add(key));

      // Remove the "just completed" state after animation
      setTimeout(() => {
        setJustCompleted((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }, 1000);
    }
  };

  const isCompleted = (day, category, exerciseIndex) => {
    const key = `${day}-${category}-${exerciseIndex}`;
    return completed[key] || false;
  };

  const wasJustCompleted = (day, category, exerciseIndex) => {
    const key = `${day}-${category}-${exerciseIndex}`;
    return justCompleted.has(key);
  };

  const getNote = (day, category, exerciseIndex) => {
    const key = `${day}-${category}-${exerciseIndex}`;
    return notes[key] || '';
  };

  const handleNoteChange = (day, category, exerciseIndex, value) => {
    const key = `${day}-${category}-${exerciseIndex}`;
    setNotes((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const openNotes = (key) => {
    setExpandedNotes((prev) => new Set(prev).add(key));
  };

  const closeNotes = (key) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const discardNote = (key) => {
    setNotes((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    closeNotes(key);
  };

  const resetWeek = () => {
    if (window.confirm('Are you sure you want to reset all checkboxes for the week?')) {
      setCompleted({});
      setJustCompleted(new Set());
      setNotes({});
    }
  };

  const getExercisesForDay = (day) => {
    const result = [];
    Object.entries(exercises).forEach(([category, data]) => {
      if (data.days.includes(day)) {
        result.push({
          category,
          exercises: data.exercises,
        });
      }
    });
    return result;
  };

  const getCompletionStats = () => {
    const today = todayLabel;
    const todayExercises = getExercisesForDay(today);
    const totalToday = todayExercises.reduce((acc, cat) => acc + cat.exercises.length, 0);
    const completedToday = Object.keys(completed).filter((key) => key.startsWith(today)).length;

    return { completedToday, totalToday };
  };

  const getDateForDay = (day) => {
    const today = new Date();
    const todayIdx = days.indexOf(todayLabel);
    const targetIdx = days.indexOf(day);
    const diff = targetIdx - todayIdx;
    const result = new Date(today);
    result.setDate(today.getDate() + diff);
    return result;
  };

  const formatDateLabel = (date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const renderDayLabel = (day, isSelectedDay = false) => {
    const emphasizeSelectedDate = isSelectedDay && viewMode === 'day';
    const dateColor = emphasizeSelectedDate
      ? darkMode
        ? 'text-blue-300'
        : 'text-white/80'
      : darkMode
        ? 'text-gray-400'
        : 'text-gray-500';

    return (
      <span className="flex items-baseline justify-between w-full gap-2">
        <span>{day}</span>
        <span className={`text-[11px] ${dateColor}`}>{formatDateLabel(getDateForDay(day))}</span>
      </span>
    );
  };

  const cycleViewMode = () => {
    setViewMode((prev) => {
      if (prev === 'week') return 'day';
      if (prev === 'day') return 'three';
      return 'week';
    });
  };

  const getThreeDayWindow = () => {
    const todayIdx = days.indexOf(todayLabel);
    const prevIdx = (todayIdx - 1 + days.length) % days.length;
    const nextIdx = (todayIdx + 1) % days.length;
    return [days[prevIdx], days[todayIdx], days[nextIdx]];
  };

  const exportData = async () => {
    const payload = {
      completed,
      notes,
      darkMode,
    };
    const encoded = JSON.stringify(payload);
    try {
      await navigator.clipboard.writeText(encoded);
      setSyncMessage('Progress copied to clipboard. Paste on another device to sync.');
    } catch {
      setSyncMessage('Copy failed. Manually copy this text: ' + encoded);
    }
    setTimeout(() => setSyncMessage(''), 4000);
  };

  const importData = () => {
    const input = window.prompt('Paste data to import (copied from Export):');
    if (!input) return;
    try {
      const parsed = JSON.parse(input);
      if (parsed.completed) setCompleted(parsed.completed);
      if (parsed.notes) setNotes(parsed.notes);
      if (typeof parsed.darkMode === 'boolean') setDarkMode(parsed.darkMode);
      setSyncMessage('Import successful!');
    } catch (err) {
      console.error(err);
      setSyncMessage('Import failed. Please check the data and try again.');
    }
    setTimeout(() => setSyncMessage(''), 4000);
  };

  const getExerciseIcon = (exerciseName) => {
    if (exerciseName.toLowerCase().includes('dumbbell')) {
      return (
        <div className="flex items-center gap-1" title="Dumbbell">
          <Dumbbell size={14} className={darkMode ? 'text-red-400' : 'text-red-500'} />
          <span className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-500'}`}>DB</span>
        </div>
      );
    }
    if (exerciseName.toLowerCase().includes('dowel')) {
      return (
        <div className="flex items-center gap-1" title="Dowel">
          <Wand2 size={14} className={darkMode ? 'text-purple-400' : 'text-purple-500'} />
          <span className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-500'}`}>DW</span>
        </div>
      );
    }
    if (exerciseName.toLowerCase().includes('resistance')) {
      return (
        <div className="flex items-center gap-1" title="Resistance Band">
          <Infinity size={14} className={darkMode ? 'text-green-400' : 'text-green-500'} />
          <span className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-500'}`}>RB</span>
        </div>
      );
    }
    return null;
  };

  const formatExerciseName = (name) => {
    return name
      .replace(/with Dumbbell/gi, '')
      .replace(/with Dowel/gi, '')
      .replace(/with Resistance/gi, '')
      .trim();
  };

  const stats = getCompletionStats();
  const threeDayWindow = getThreeDayWindow();

  const renderDayCard = (day, highlightToday = false) => {
    const isToday = highlightToday && day === todayLabel;
    const isSelectedDay = viewMode === 'day' && day === selectedDay;
    const dayExercises = getExercisesForDay(day);

    return (
      <div
        key={day}
        className={`rounded-xl shadow-sm border p-4 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } ${
          isToday
            ? darkMode
              ? 'border-blue-500/70 bg-blue-900'
              : 'border-blue-300 bg-blue-50'
            : ''
        }`}
      >
        {viewMode !== 'day' ? (
          <div
            className={`mb-4 -mx-4 px-4 pb-2 border-b flex items-baseline justify-between ${
              isToday
                ? darkMode
                  ? 'border-blue-500/70'
                  : 'border-blue-300'
                : darkMode
                  ? 'border-gray-700'
                  : 'border-gray-200'
            }`}
          >
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {renderDayLabel(day, isSelectedDay)}
            </h2>
          </div>
        ) : (
          ''
        )}

        <div className="space-y-4">
          {dayExercises.map(({ category, exercises: exList }) => (
            <div key={category}>
              <h3
                className={`font-semibold text-xs uppercase tracking-wide mb-2 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                {category}
              </h3>
              <div className="space-y-2">
                {exList.map((ex, exIndex) => {
                  const exerciseKey = `${day}-${category}-${exIndex}`;
                  const completed = isCompleted(day, category, exIndex);
                  const justCompleted = wasJustCompleted(day, category, exIndex);
                  const noteText = getNote(day, category, exIndex);
                  const isExpanded = expandedNotes.has(exerciseKey);
                  const hasNote = !!noteText;

                  return (
                    <div
                      key={exIndex}
                      className={`relative w-full rounded-lg border overflow-hidden ${
                        completed
                          ? darkMode
                            ? 'bg-green-900/30 border-green-700'
                            : 'bg-green-50 border-green-300'
                          : darkMode
                            ? 'bg-gray-900/50 border-gray-700'
                            : 'bg-gradient-to-r from-gray-50 to-white border-gray-100'
                      }`}
                    >
                      <button
                        onClick={() => toggleComplete(day, category, exIndex)}
                        className="w-full flex items-center gap-3 p-3 text-left transition-all duration-200"
                      >
                        {confettiKey === exerciseKey && (
                          <Confetti onComplete={() => setConfettiKey(null)} />
                        )}

                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            completed
                              ? 'bg-green-500 border-green-500 text-white scale-110'
                              : darkMode
                                ? 'bg-gray-800 border-gray-600 hover:border-blue-400'
                                : 'bg-white border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {completed && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getExerciseIcon(ex.name)}
                            <div
                              className={`font-medium text-sm leading-tight ${
                                completed
                                  ? darkMode
                                    ? 'text-green-300'
                                    : 'text-green-800'
                                  : darkMode
                                    ? 'text-gray-200'
                                    : 'text-gray-800'
                              }`}
                            >
                              {formatExerciseName(ex.name)}
                            </div>
                          </div>
                          <div
                            className={`text-xs mt-1 font-medium ${
                              completed
                                ? darkMode
                                  ? 'text-green-400'
                                  : 'text-green-600'
                                : darkMode
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                            }`}
                          >
                            {ex.sets ? `${ex.sets} x ` : ''}
                            {ex.reps}
                            {ex.hold}
                            {ex.target}
                          </div>
                          {viewMode === 'week' && noteText && (
                            <div
                              className={`mt-2 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full ${
                                darkMode
                                  ? 'bg-amber-900/40 text-amber-100 border border-amber-800'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Notes saved
                            </div>
                          )}
                        </div>
                      </button>
                      {(viewMode === 'day' || viewMode === 'three') && (
                        <>
                          {!isExpanded ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openNotes(exerciseKey);
                              }}
                              className={`absolute bottom-2 right-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all ${
                                darkMode
                                  ? 'text-gray-400 border-gray-700 bg-transparent hover:text-gray-200 hover:border-gray-500 hover:bg-gray-800'
                                  : 'text-gray-500 border-gray-200 bg-transparent hover:text-gray-800 hover:border-gray-300 hover:bg-blue-50'
                              }`}
                              title={hasNote ? '' : 'Add notes'}
                            >
                              {!hasNote && ' + note'}
                              {hasNote && (
                                <BellRing size={12} className="text-orange-400 fill-amber-300" />
                              )}
                            </button>
                          ) : (
                            <div
                              className={`border-t text-xs px-3 pb-3 pt-2 ${
                                darkMode
                                  ? 'border-gray-700 bg-gray-900/40'
                                  : 'border-gray-100 bg-white/60'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1.5 gap-3">
                                <div
                                  className={`flex items-center gap-2 font-semibold ${
                                    darkMode ? 'text-gray-200' : 'text-gray-700'
                                  }`}
                                >
                                  <FileText size={12} />
                                  Notes
                                </div>
                                <div className="flex justify-end gap-2">
                                  {hasNote && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        discardNote(exerciseKey);
                                      }}
                                      className={`text-[11px] rounded-md transition-colors hover:underline opacity-75 ${
                                        darkMode
                                          ? 'text-gray-400 hover:text-red-500'
                                          : 'text-gray-600 hover:text-red-500'
                                      }`}
                                      title="Discard note"
                                    >
                                      Discard
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      closeNotes(exerciseKey);
                                    }}
                                    className={`text-[11px] rounded-md transition-colors hover:underline opacity-75 ${
                                      darkMode
                                        ? 'text-gray-400 hover:text-blue-500'
                                        : 'text-gray-600 hover:text-blue-500'
                                    }`}
                                    title="Close notes"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                              <textarea
                                value={noteText}
                                onChange={(e) =>
                                  handleNoteChange(day, category, exIndex, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => {
                                  e.stopPropagation();
                                  openNotes(exerciseKey);
                                }}
                                className={`w-full text-sm rounded-md resize-none p-2 focus:outline-none focus:ring-2 ${
                                  darkMode
                                    ? 'bg-gray-800 text-gray-100 border border-gray-700 focus:ring-blue-500'
                                    : 'bg-white text-gray-800 border border-gray-200 focus:ring-blue-400'
                                }`}
                                rows={
                                  noteText ? Math.max(2, Math.ceil(noteText.split('\n').length)) : 2
                                }
                                placeholder="Add a quick note for this exercise"
                              />
                            </div>
                          )}
                        </>
                      )}
                      {justCompleted && (
                        <div className="absolute inset-0 pointer-events-none ring-2 ring-green-400/70 rounded-lg"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${bgGradient} overflow-y-auto`}>
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(150px) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>

      {/* Fixed Top Row with Fade */}
      <div
        className="sticky top-0 z-50 backdrop-blur-sm p-6"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
        }}
      >
        <div className="w-full">
          {/* Top Row: Title, Stats, Quote, and Controls */}
          <div className="flex items-baseline gap-4 flex-wrap">
            {/* Left: Title and Stats */}
            <div className="flex items-baseline gap-4 flex-shrink-0">
              {/* Title */}
              <h1
                className={`text-3xl font-bold flex-shrink-0 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}
              >
                <Timer size={28} className={`flex-shrink-0 translate-y-1`} />
                pt-tracker
              </h1>

              {/* Stats */}
              {stats.totalToday > 0 && (
                <div
                  className={`flex items-center gap-2 flex-shrink-0 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  <Sparkles
                    size={14}
                    className={stats.completedToday === stats.totalToday ? 'text-yellow-500' : ''}
                  />
                  <span className="text-sm whitespace-nowrap font-medium">
                    Today:{' '}
                    <span
                      className={`font-bold ${stats.completedToday === stats.totalToday ? 'text-green-500' : ''}`}
                    >
                      {stats.completedToday}/{stats.totalToday}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Left-align Quote with larger gap */}
            <div className="flex-1 min-w-0 ml-8">
              {quote && (
                <div className="flex items-center gap-2 min-w-0 group">
                  <div
                    className={`italic text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    "{quote.text}" — {quote.author}
                  </div>
                  <button
                    type="button"
                    onClick={showNextQuote}
                    className={`shrink-0 inline-flex items-center justify-center rounded-full border text-[10px] px-2 py-1 opacity-0 group-hover:opacity-70 hover:opacity-100 transition ${
                      darkMode
                        ? 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-300 bg-gray-900/60'
                        : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 bg-white/70'
                    }`}
                    title="Show another quote"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={cycleViewMode}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all text-sm ${
                  darkMode
                    ? 'bg-blue-900/50 text-blue-100 hover:bg-blue-800'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                } shadow-sm border ${darkMode ? 'border-blue-700' : 'border-blue-300'}`}
                title="Cycle views: week → day → 3-day"
              >
                <CalendarRange size={16} />
                {viewMode === 'week' && 'Week view'}
                {viewMode === 'day' && 'Day view'}
                {viewMode === 'three' && '3-day view'}
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all text-sm ${
                  darkMode
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } shadow-sm border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={resetWeek}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all text-sm ${
                  darkMode
                    ? 'bg-red-900/50 text-red-200 hover:bg-red-800'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                } shadow-sm border ${darkMode ? 'border-red-700' : 'border-red-300'}`}
                title="Reset all checkboxes"
              >
                <RotateCcw size={16} />
              </button>
              <div className="inline-flex">
                <button
                  onClick={exportData}
                  className={`flex items-center gap-1 px-3 py-2 rounded-l-lg transition-all text-sm ${
                    darkMode
                      ? 'bg-emerald-900/50 text-emerald-100 hover:bg-emerald-800'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  } shadow-sm border ${darkMode ? 'border-emerald-700' : 'border-emerald-300'}`}
                  title="Copy your progress to sync manually"
                >
                  <Upload size={16} />
                </button>
                <button
                  onClick={importData}
                  className={`flex items-center gap-1 px-3 py-2 rounded-r-lg transition-all text-sm ${
                    darkMode
                      ? 'bg-purple-900/50 text-purple-100 hover:bg-purple-800'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  } shadow-sm border ${darkMode ? 'border-purple-700' : 'border-purple-300'}`}
                  title="Paste previously exported data"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full p-6">
        {syncMessage && (
          <div
            className={`mb-4 text-sm px-3 py-2 rounded-md ${darkMode ? 'bg-emerald-900/60 text-emerald-100' : 'bg-emerald-50 text-emerald-700'} border ${darkMode ? 'border-emerald-700' : 'border-emerald-200'}`}
          >
            {syncMessage}
          </div>
        )}

        {viewMode === 'day' && (
          <div className="mb-4 flex gap-2 flex-wrap justify-center">
            {days.map((day) => {
              const isSelectedDay = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedDay === day
                      ? darkMode
                        ? 'bg-blue-700 text-white border-blue-600'
                        : 'bg-blue-600 text-white border-blue-700'
                      : darkMode
                        ? 'bg-gray-800 text-gray-200 border-gray-700 hover:border-blue-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {renderDayLabel(day, isSelectedDay)}
                </button>
              );
            })}
          </div>
        )}

        {viewMode === 'week' ? (
          <div className="grid grid-cols-7 gap-4">
            {days.map((day) => renderDayCard(day, true))}
          </div>
        ) : viewMode === 'day' ? (
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">{renderDayCard(selectedDay)}</div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row w-full gap-4">
            {threeDayWindow.map((day) => (
              <div key={day} className="flex-1 min-w-0">
                {renderDayCard(day)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Helpful Links */}
      <footer
        className={`w-full border-t mt-8 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
      >
        <div className="px-6 py-4">
          <h3
            className={`text-xs font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <Link size={14} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
            Helpful Links
          </h3>
          <a
            href="https://www.youtube.com/watch?v=_wi7j1_-O3Q"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm transition-colors hover:underline ${
              darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🕐 10s interval timer
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
