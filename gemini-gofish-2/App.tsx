
import React from 'react';
import { GameUI } from './components/GameUI';
import { PixiComponent } from './components/PixiComponent';
import { useGameEngine } from './hooks/useGameEngine';

export default function App() {
  const {
    gameState,
    isThinking,
    humanPlayerAction,
    startGame,
  } = useGameEngine();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      <header className="md:hidden p-4 bg-slate-800 border-b border-slate-700 text-center">
        <h1 className="text-2xl font-bold text-cyan-400">AI Go Fish</h1>
      </header>
      
      <main className="flex-grow w-full md:w-2/3 lg:w-3/4 p-4">
        {gameState ? (
          <PixiComponent gameState={gameState} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-lg">
            <p>Loading Game...</p>
          </div>
        )}
      </main>

      <aside className="w-full md:w-1/3 lg:w-1/4 bg-slate-950 p-4 lg:p-6 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col h-screen-third md:h-screen">
        <GameUI
          gameState={gameState}
          isThinking={isThinking}
          onPlayerAction={humanPlayerAction}
          onStartGame={startGame}
        />
      </aside>
    </div>
  );
}