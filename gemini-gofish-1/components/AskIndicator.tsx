import React, { useEffect, useState } from 'react';

interface AskIndicatorProps {
  startRect: DOMRect;
  endRect: DOMRect;
}

const PointerIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.59V18h-2v-1.41L7.41 13 6 11.59 10.59 7 12 5.59 16.59 10l-1.41 1.41L13 10.83v5.76z"/>
  </svg>
);


export const AskIndicator: React.FC<AskIndicatorProps> = ({ startRect, endRect }) => {
  const [style, setStyle] = useState<React.CSSProperties>(() => ({
    left: startRect.left + startRect.width / 2,
    top: startRect.top + startRect.height / 2,
    opacity: 0,
    transform: 'scale(0.5) translate(-50%, -50%)',
    position: 'fixed',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 100,
    filter: 'drop-shadow(0 0 10px rgb(34 211 238 / 0.7))'
  }));

  useEffect(() => {
    const midX = startRect.left + (endRect.left - startRect.left) / 2.5;
    const midY = startRect.top + (endRect.top - startRect.top) / 2.5;

    const deltaX = endRect.left - startRect.left;
    const deltaY = endRect.top - startRect.top;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;

    // Appear and rotate
    const t1 = setTimeout(() => {
      setStyle(prev => ({
        ...prev,
        opacity: 1,
        transform: `translate(-50%, -50%) scale(1) rotate(${angle}deg)`,
      }));
    }, 10);

    // Lunge forward
    const t2 = setTimeout(() => {
      setStyle(prev => ({
        ...prev,
        left: midX,
        top: midY,
        transform: `translate(-50%, -50%) scale(1.3) rotate(${angle}deg)`,
      }));
    }, 50);
    
    // Retract and fade
    const t3 = setTimeout(() => {
       setStyle(prev => ({
        ...prev,
        opacity: 0,
        left: startRect.left + startRect.width / 2,
        top: startRect.top + startRect.height / 2,
        transform: `translate(-50%, -50%) scale(0.5) rotate(${angle}deg)`,
       }));
    }, 400);

    return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
    }
  }, [startRect, endRect]);

  return (
    <div style={style}>
      <PointerIcon />
    </div>
  );
};