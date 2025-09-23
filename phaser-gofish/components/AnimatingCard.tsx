
import React, { useState, useEffect } from 'react';
import { Card as CardType } from '../types';
import Card from './Card';

interface AnimatingCardProps {
  card: CardType;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  delay: number;
  duration: number;
}

const AnimatingCard: React.FC<AnimatingCardProps> = ({ card, startPos, endPos, delay, duration }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    left: startPos.x,
    top: startPos.y,
    opacity: 0,
    transform: 'translate(-50%, -50%) scale(0.8)',
    transition: `all ${duration}ms ease-in-out`,
    zIndex: 50,
  });

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStyle(prev => ({
        ...prev,
        left: endPos.x,
        top: endPos.y,
        opacity: 1,
        transform: 'translate(-50%, -50%) scale(1)',
      }));
    }, delay);

    const endTimer = setTimeout(() => {
      setStyle(prev => ({
        ...prev,
        opacity: 0,
      }));
    }, delay + duration);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [startPos, endPos, delay, duration]);

  return (
    <div style={style}>
      <Card card={card} />
    </div>
  );
};

export default AnimatingCard;
