import React, { useEffect, useState } from 'react';
import { Card } from '../types';

interface AnimatedCardProps {
  card: Card;
  startRect: DOMRect;
  endRect: DOMRect;
  isBook: boolean;
  delay: number;
  index: number;
  total: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ card, startRect, endRect, isBook, delay, index, total }) => {
  const [style, setStyle] = useState<React.CSSProperties>(() => {
    let initialLeft = startRect.left + startRect.width / 2;
    const initialTop = startRect.top + startRect.height / 2;

    // For book formation, spread the cards out horizontally from where they start.
    // This makes it look like they are coming from different positions in the hand.
    if (isBook) {
      const offset = (index - (total - 1) / 2) * 40; // 40px separation
      initialLeft += offset;
    }

    return {
      left: initialLeft,
      top: initialTop,
      opacity: 0,
      transform: 'scale(0.5) translate(-50%, -50%)',
      position: 'fixed',
      transition: 'all 0.8s cubic-bezier(0.45, 0, 0.55, 1)',
      zIndex: 100,
    };
  });

  useEffect(() => {
    // Initial delay before starting animation
    const initialTimer = setTimeout(() => {
      // Animate to start position and scale up
      setStyle(prev => ({
        ...prev,
        opacity: 1,
        transform: 'scale(1.2) translate(-50%, -50%)',
        transition: 'all 0.4s cubic-bezier(0.45, 0, 0.55, 1)'
      }));
      
      // Animate to end position
      const moveTimer = setTimeout(() => {
        const finalLeft = endRect.left + endRect.width / 2;
        const finalTop = endRect.top + endRect.height / 2;
        let finalTransform = `scale(${isBook ? '0.7' : '1'}) translate(-50%, -50%)`;

        // For book formation, converge in the middle and fan out slightly.
        if (isBook) {
            const angle = (index - (total - 1) / 2) * 5; // 5 degree separation
            finalTransform += ` rotate(${angle}deg)`;
        }

        setStyle(prev => ({
          ...prev,
          left: finalLeft,
          top: finalTop,
          transform: finalTransform,
          transition: 'all 0.6s cubic-bezier(0.45, 0, 0.55, 1)'
        }));
      }, 150);
      
      // Fade out at end
      const fadeTimer = setTimeout(() => {
        setStyle(prev => ({
          ...prev,
          opacity: 0,
          transform: `scale(0.5) translate(-50%, -50%)`,
        }));
      }, 800);

      return () => {
        clearTimeout(moveTimer);
        clearTimeout(fadeTimer);
      }
    }, delay);

    return () => clearTimeout(initialTimer);
  }, [startRect, endRect, isBook, delay, index, total]);

  const color = (card.suit === '♥' || card.suit === '♦') ? 'text-red-400' : 'text-slate-200';

  return (
    <div style={style}>
        <div className="w-16 h-24 bg-slate-700 border-2 border-cyan-400 rounded-md flex flex-col justify-between p-1 shadow-2xl shadow-black/50">
            <span className={`text-xl font-bold ${color}`}>{card.rank}</span>
            <span className={`text-2xl ${color}`}>{card.suit}</span>
        </div>
    </div>
  );
};