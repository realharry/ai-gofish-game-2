import React, { useRef, useEffect, useState } from 'react';

interface GameLogProps {
  logs: string[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Default to collapsed on small screens.
    if (window.innerWidth < 768) { // Tailwind's 'md' breakpoint
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (logContainerRef.current && !isCollapsed) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isCollapsed]);

  return (
    <div className={`
      bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-2 flex flex-col
      transition-all duration-300 ease-in-out w-64
      ${isCollapsed ? 'h-12' : 'h-full'}
    `}>
      <div className="flex justify-between items-center pb-1 mb-1 border-b border-slate-600 flex-shrink-0">
        <h4 className="font-bold text-slate-300">Game Log</h4>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sm px-2 py-0.5 hover:bg-slate-700 rounded text-cyan-400"
          aria-expanded={!isCollapsed}
          aria-controls="game-log-content"
          aria-label={isCollapsed ? "Show game log" : "Hide game log"}
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
      </div>
      <div
        id="game-log-content"
        ref={logContainerRef}
        className={`flex-grow overflow-y-auto text-sm pr-2 ${isCollapsed ? 'hidden' : ''}`}
        aria-hidden={isCollapsed}
      >
        {logs.map((log, index) => (
          <p key={index} className="mb-2 text-slate-400 last:mb-0">
            {log}
          </p>
        ))}
      </div>
    </div>
  );
};