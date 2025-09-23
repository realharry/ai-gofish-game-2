import React, { useRef, useEffect } from 'react';

interface GameLogProps {
  logs: string[];
}

const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-800/50 rounded-lg p-2 shadow-inner h-24 md:h-28">
      <h3 className="text-center font-bold text-cyan-300 mb-1 text-sm">Game Log</h3>
      <div ref={logContainerRef} className="h-full overflow-y-auto text-xs text-slate-300 space-y-1 pr-2">
        {logs.map((log, index) => {
          const isMostRecent = index === logs.length - 1;
          return (
            <p
              key={index}
              className={`leading-tight p-1 rounded-md transition-all duration-300 ${
                isMostRecent
                  ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                  : ''
              }`}
            >
              {log}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default GameLog;