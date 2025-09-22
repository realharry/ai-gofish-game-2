
import React, { useRef, useEffect, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { GameState, Card, Player, Suit } from '../game/types';

interface PixiComponentProps {
  gameState: GameState;
}

// Card dimensions and styling
const CARD_WIDTH = 80;
const CARD_HEIGHT = 110;
const CARD_CORNER_RADIUS = 8;
const PADDING = 20;

const suitColor = (suit: Suit) => (suit === Suit.Hearts || suit === Suit.Diamonds ? 0xDD2222 : 0x111111);

export const PixiComponent: React.FC<PixiComponentProps> = ({ gameState }) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  // This ref holds the PIXI.Application instance. It's crucial that this instance
  // is created only once and persists across the fast re-renders of React's StrictMode.
  const appRef = useRef<PIXI.Application | null>(null);

  const createCardSprite = useCallback((card: Card, faceUp: boolean): PIXI.Container => {
    const container = new PIXI.Container();
    
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xFFFFFF);
    graphics.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
    graphics.endFill();
    container.addChild(graphics);

    if (faceUp) {
      const rankText = new PIXI.Text(card.rank, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: suitColor(card.suit),
        align: 'center',
        fontWeight: 'bold',
      });
      rankText.position.set(PADDING/2, PADDING/2);
      container.addChild(rankText);

      const suitText = new PIXI.Text(card.suit, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: suitColor(card.suit),
        align: 'center',
      });
      suitText.position.set(CARD_WIDTH - suitText.width - PADDING/2, CARD_HEIGHT - suitText.height - PADDING/2);
      container.addChild(suitText);
    } else {
        const backGraphics = new PIXI.Graphics();
        backGraphics.beginFill(0x0284c7); // sky-600
        backGraphics.drawRoundedRect(4, 4, CARD_WIDTH-8, CARD_HEIGHT-8, CARD_CORNER_RADIUS-2);
        backGraphics.endFill();
        container.addChild(backGraphics);
    }
    
    return container;
  }, []);

  const drawPlayer = useCallback((player: Player, position: {x: number, y: number}, isHuman: boolean) => {
    const container = new PIXI.Container();
    
    const nameText = new PIXI.Text(player.name, { fontSize: 18, fill: 0xFFFFFF, fontWeight: 'bold' });
    nameText.anchor.set(0.5, 0);
    nameText.position.set(position.x, position.y);
    container.addChild(nameText);

    const handWidth = player.hand.length * (CARD_WIDTH / 3) + (CARD_WIDTH * 2/3);
    const startX = position.x - handWidth / 2;

    player.hand.forEach((card, i) => {
      const cardSprite = createCardSprite(card, isHuman);
      cardSprite.position.set(startX + i * (CARD_WIDTH / 3), position.y + 30);
      container.addChild(cardSprite);
    });
    
    player.sets.forEach((rank, i) => {
        const setText = new PIXI.Text(`Set of ${rank}s`, { fontSize: 14, fill: 0xfacc15 });
        setText.anchor.set(0.5, 0);
        const setY = position.y + (isHuman ? -30 : CARD_HEIGHT + 40);
        setText.position.set(position.x - 60 + i * 120, setY);
        container.addChild(setText);
    });

    return container;
  }, [createCardSprite]);

  const drawGame = useCallback((state: GameState) => {
    const app = appRef.current;
    if (!app || !app.stage) return;
    app.stage.removeChildren();

    const { players, deck } = state;
    const { width, height } = app.screen;

    // Draw Human Player (Bottom)
    const human = players[0];
    app.stage.addChild(drawPlayer(human, { x: width / 2, y: height - CARD_HEIGHT - PADDING }, true));

    // Draw AI Players
    const opponentPositions = [
        { x: width / 2, y: PADDING }, // Top
        { x: PADDING + CARD_WIDTH/2, y: height / 2 }, // Left
        { x: width - PADDING - CARD_WIDTH/2, y: height / 2 }, // Right
    ];
    players.slice(1).forEach((player, i) => {
        app.stage.addChild(drawPlayer(player, opponentPositions[i], false));
    });

    // Draw Deck
    if (deck.length > 0) {
        const deckContainer = new PIXI.Container();
        const deckCard = createCardSprite({rank: 'A', suit: Suit.Spades, id:''}, false);
        deckContainer.addChild(deckCard);
        
        const deckText = new PIXI.Text(`${deck.length} cards`, { fontSize: 16, fill: 0xFFFFFF });
        deckText.anchor.set(0.5, 0);
        deckText.position.set(CARD_WIDTH / 2, CARD_HEIGHT + 5);
        deckContainer.addChild(deckText);
        
        deckContainer.position.set(width / 2 - CARD_WIDTH - 20, height / 2 - CARD_HEIGHT / 2);
        app.stage.addChild(deckContainer);
    }
  }, [createCardSprite, drawPlayer]);
  
  // This effect handles drawing updates whenever the gameState changes.
  useEffect(() => {
    // Do not draw if the app is not yet initialized or we don't have a game state.
    if (appRef.current?.stage && appRef.current.renderer && gameState) {
      drawGame(gameState);
    }
  }, [gameState, drawGame]);

  // This effect handles the one-time setup and teardown of the PIXI application.
  // It's designed to be robust against React's StrictMode.
  useEffect(() => {
    const container = pixiContainerRef.current;
    if (!container) return;

    const initializePixi = async () => {
      let app = appRef.current;

      // Create the PIXI application only if it doesn't exist.
      if (!app) {
        app = new PIXI.Application();
        appRef.current = app;
        
        // Asynchronously initialize the renderer. We must wait for this to
        // complete before we can safely access `app.canvas`.
        await app.init({
          background: '#1e293b',
          resizeTo: container,
          antialias: true,
        });
      }

      // Add the app's canvas to the DOM if it's not already there.
      if (!container.contains(app.canvas)) {
        container.appendChild(app.canvas);
      }
    };

    initializePixi();

    // The cleanup function runs when the component unmounts.
    return () => {
      const app = appRef.current;
      // In StrictMode, this removes the canvas before the re-mount.
      // We DO NOT destroy the app instance. This allows it to be re-used,
      // which prevents the "batcher already has a handler" error.
      if (app && container.contains(app.canvas)) {
        container.removeChild(app.canvas);
      }
    };
  }, []); // The empty dependency array ensures this effect runs only on mount and unmount.

  return <div ref={pixiContainerRef} className="w-full h-full rounded-lg overflow-hidden" />;
};