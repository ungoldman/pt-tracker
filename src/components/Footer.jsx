import { Link } from 'lucide-react';

const TIMER_LINKS = [
  { href: 'https://www.youtube.com/watch?v=_wi7j1_-O3Q', label: '🕒 10s interval timer' },
  { href: 'https://www.youtube.com/watch?v=kD6FCbmAORY', label: '🕒 30s interval timer' },
];

export default function Footer({ darkMode }) {
  return (
    <footer
      className={`w-full border-t mt-6 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
    >
      <div className="px-6 py-4">
        <div className={`flex items-center gap-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Link size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
            Helpful Links
          </h3>

          <div className="flex items-center gap-6">
            {TIMER_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm transition-colors hover:underline ${
                  darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
