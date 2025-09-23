import React from 'react';
import GameBoard from './components/GameBoard';
import { useGameEngine } from './hooks/useGameEngine';
import { Theme } from './types';

const THEME_STYLES: Record<Theme, string> = {
    [Theme.DarkBlue]: 'from-slate-900 to-blue-900',
    [Theme.Charcoal]: 'from-gray-800 to-slate-900',
    [Theme.Forest]: 'from-green-900 to-teal-900',
    [Theme.Purple]: 'from-indigo-900 to-purple-900',
};

function App() {
  const gameEngine = useGameEngine();
  const themeClass = THEME_STYLES[gameEngine.gameState.theme] || THEME_STYLES[Theme.DarkBlue];

  return (
    <div className={`w-screen h-screen bg-gradient-to-br ${themeClass} font-sans text-white antialiased overflow-hidden`}>
      <div className="container mx-auto p-4 h-full flex flex-col items-center">
        <header className="w-full text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-300 tracking-wider">
            Go Fish: AI Challenge
          </h1>
        </header>
        <main className="w-full h-full flex-grow">
          <GameBoard {...gameEngine} />
        </main>
      </div>
    </div>
  );
}

export default App;