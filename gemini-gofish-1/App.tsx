
import React from 'react';
import { GameUI } from './components/GameUI';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans p-4">
      <header className="text-center mb-4">
        <h1 className="text-4xl font-bold text-cyan-400">AI Go Fish</h1>
        <p className="text-slate-400">Play against three AI opponents with unique strategies.</p>
      </header>
      <GameUI />
    </div>
  );
};

export default App;
