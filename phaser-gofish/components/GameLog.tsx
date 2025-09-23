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
    <div className="bg-slate-800/50 rounded-lg p-2 shadow-inner h-28 md:h-36">
      <h3 className="text-center font-bold text-cyan-300 mb-1 text-sm">Game Log</h3>
      <div ref={logContainerRef} className="h-full overflow-y-auto text-xs text-slate-300 space-y-1 pr-2">
        {logs.map((log, index) => (
          <p key={index} className="leading-tight">{log}</p>
        ))}
      </div>
    </div>
  );
};

export default GameLog;