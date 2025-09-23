
import React from 'react';
import GameBoard from './components/GameBoard';

function App() {
  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 to-blue-900 font-sans antialiased overflow-hidden">
      <div className="container mx-auto p-4 h-full flex flex-col items-center">
        <header className="w-full text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-300 tracking-wider">
            Go Fish: AI Challenge
          </h1>
        </header>
        <main className="w-full h-full flex-grow">
          <GameBoard />
        </main>
      </div>
    </div>
  );
}

export default App;
