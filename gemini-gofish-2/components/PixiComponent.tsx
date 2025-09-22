import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { GameState, Card, Player, Suit, AvatarId } from '../game/types';

interface PixiComponentProps {
  gameState: GameState;
}

// Card dimensions and styling
const CARD_WIDTH = 80;
const CARD_HEIGHT = 110;
const CARD_CORNER_RADIUS = 8;
const PADDING = 20;

const suitColor = (suit: Suit) => (suit === Suit.Hearts || suit === Suit.Diamonds ? 0xDD2222 : 0x111111);

const avatarSvgs: Record<AvatarId, string> = {
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  memory: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v2a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M12 12a3 3 0 0 0-3 3v2a3 3 0 0 0 6 0v-2a3 3 0 0 0-3-3Z"/><path d="M20 12a8 8 0 1 0-8 8"/><path d="M12 4.5v1.5"/><path d="M12 10.5v1.5"/></svg>`,
  random: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M16 8h.01"/><path d="M12 12h.01"/><path d="M8 16h.01"/><path d="M8 8h.01"/><path d="M12 16h.01"/><path d="M16 12h.01"/></svg>`,
  targeted: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
};

export const PixiComponent: React.FC<PixiComponentProps> = ({ gameState }) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  
  // Use useState to create the app instance only once.
  const [app] = useState(() => new PIXI.Application());
  // Use a ref to store the initialization promise, preventing multiple init calls.
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const tooltipRef = useRef<PIXI.Container | null>(null);
  const avatarTexturesRef = useRef<Record<AvatarId, PIXI.Texture> | null>(null);
  const prevGameStateRef = useRef<GameState | null>(null);


  const createCardSprite = useCallback((card: Card, faceUp: boolean, isHighlighted: boolean): PIXI.Container => {
    const container = new PIXI.Container();

    if (isHighlighted && faceUp) {
        const glow = new PIXI.Graphics();
        // Use a blur filter to create a soft glow effect
        glow.filters = [new PIXI.BlurFilter(4)];
        glow.beginFill(0x4ade80, 0.7); // green-400 to match user icon
        // Draw the glow slightly larger than the card
        glow.drawRoundedRect(-4, -4, CARD_WIDTH + 8, CARD_HEIGHT + 8, CARD_CORNER_RADIUS + 4);
        glow.endFill();
        container.addChild(glow);
    }
    
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(1, 0xAAAAAA);
    graphics.beginFill(0xFFFFF0); // Use a softer ivory color
    graphics.drawRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
    graphics.endFill();
    container.addChild(graphics);

    if (faceUp) {
      const color = suitColor(card.suit);
      const rankFontSize = 18;
      const suitFontSize = 14;
      const cornerPadding = 8;
      const cardFont = "'Times New Roman', serif"; // Use a more classic font

      // Top-left corner text
      const rankTextTop = new PIXI.Text(card.rank, { fontFamily: cardFont, fontSize: rankFontSize, fill: color, fontWeight: 'bold' });
      rankTextTop.position.set(cornerPadding, cornerPadding);
      container.addChild(rankTextTop);
      
      const suitTextTop = new PIXI.Text(card.suit, { fontFamily: cardFont, fontSize: suitFontSize, fill: color });
      suitTextTop.position.set(cornerPadding, cornerPadding + rankFontSize);
      container.addChild(suitTextTop);

      // Center suit symbol
      const centerSuit = new PIXI.Text(card.suit, {
        fontFamily: cardFont,
        fontSize: 50,
        fill: color,
        dropShadow: {
          color: '#000000',
          alpha: 0.2,
          distance: 1,
          angle: Math.PI / 4,
          blur: 2,
        },
      });
      centerSuit.anchor.set(0.5);
      centerSuit.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);
      container.addChild(centerSuit);

      // Bottom-right corner text (rotated)
      const bottomCornerGroup = new PIXI.Container();
      const rankTextBottom = new PIXI.Text(card.rank, { fontFamily: cardFont, fontSize: rankFontSize, fill: color, fontWeight: 'bold' });
      const suitTextBottom = new PIXI.Text(card.suit, { fontFamily: cardFont, fontSize: suitFontSize, fill: color });
      suitTextBottom.position.y = rankFontSize;
      bottomCornerGroup.addChild(rankTextBottom, suitTextBottom);
      
      bottomCornerGroup.pivot.set(bottomCornerGroup.width / 2, bottomCornerGroup.height / 2);
      bottomCornerGroup.rotation = Math.PI; // 180 degrees
      bottomCornerGroup.position.set(CARD_WIDTH - bottomCornerGroup.pivot.x - cornerPadding, CARD_HEIGHT - bottomCornerGroup.pivot.y - cornerPadding);
      container.addChild(bottomCornerGroup);

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
    
    const playerInfoContainer = new PIXI.Container();
    const avatarTexture = avatarTexturesRef.current?.[player.avatarId];
    let nameOffsetX = 0;

    if (avatarTexture) {
      const avatarSprite = new PIXI.Sprite(avatarTexture);
      avatarSprite.anchor.set(0, 0.5);
      avatarSprite.width = 24;
      avatarSprite.height = 24;
      playerInfoContainer.addChild(avatarSprite);
      nameOffsetX = avatarSprite.width + 8;
    }
    
    const nameText = new PIXI.Text(player.name, { fontSize: 18, fill: 0xFFFFFF, fontWeight: 'bold' });
    nameText.anchor.set(0, 0.5);
    nameText.position.set(nameOffsetX, 0);
    playerInfoContainer.addChild(nameText);

    playerInfoContainer.pivot.set(playerInfoContainer.width / 2, 0);
    playerInfoContainer.position.set(position.x, position.y);
    container.addChild(playerInfoContainer);


    const handWidth = player.hand.length * (CARD_WIDTH / 3) + (CARD_WIDTH * 2/3);
    const startX = position.x - handWidth / 2;

    player.hand.forEach((card, i) => {
      // All cards are now rendered face-up, but only the human player's are highlighted.
      const cardSprite = createCardSprite(card, true, isHuman);
      cardSprite.position.set(startX + i * (CARD_WIDTH / 3), position.y + 30);
      
      // Add interactivity for opponent cards
      if (!isHuman && tooltipRef.current) {
        cardSprite.eventMode = 'static';
        cardSprite.interactive = true;
        
        const tooltip = tooltipRef.current;
        const tooltipText = tooltip.getChildAt(1) as PIXI.Text;
        const tooltipBg = tooltip.getChildAt(0) as PIXI.Graphics;

        cardSprite.on('pointerover', () => {
          tooltipText.text = `Rank: ${card.rank}`;
          
          const padding = 8;
          tooltipBg.clear();
          tooltipBg.beginFill(0x111111, 0.8);
          tooltipBg.drawRoundedRect(
            -padding,
            -padding,
            tooltipText.width + 2 * padding,
            tooltipText.height + 2 * padding,
            4
          );
          tooltipBg.endFill();
          
          tooltip.visible = true;
        });

        cardSprite.on('pointerout', () => {
          tooltip.visible = false;
        });

        cardSprite.on('pointermove', (event) => {
          // Position tooltip near the cursor
          tooltip.position.set(event.global.x + 20, event.global.y);
        });
      }

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
    if (!app || !app.stage || !tooltipRef.current) return;
    app.stage.removeChildren();

    const { players, deck } = state;
    const { width, height } = app.screen;

    // Draw Human Player (Bottom)
    const human = players[0];
    app.stage.addChild(drawPlayer(human, { x: width / 2, y: height - CARD_HEIGHT - PADDING }, true));

    // Draw AI Players
    const opponentPositions = [
        { x: width / 2, y: PADDING }, // Top
        { x: PADDING + CARD_WIDTH, y: height / 2 }, // Left
        { x: width - PADDING - CARD_WIDTH, y: height / 2 }, // Right
    ];
    players.slice(1).forEach((player, i) => {
        app.stage.addChild(drawPlayer(player, opponentPositions[i], false));
    });

    // Draw Deck
    if (deck.length > 0) {
        const deckContainer = new PIXI.Container();

        // Show up to 10 card backs to represent the stack
        const maxVisibleCards = Math.min(deck.length, 10);
        for (let i = 0; i < maxVisibleCards; i++) {
            const cardBack = createCardSprite({rank: 'A', suit: Suit.Spades, id:''}, false, false);
            // Stagger them to look like a fanned stack
            cardBack.position.set(i * 2, i * -1);
            deckContainer.addChild(cardBack);
        }
        
        const deckText = new PIXI.Text(`${deck.length} cards`, { fontSize: 16, fill: 0xFFFFFF });
        deckText.anchor.set(0.5, 0);
        // Position text below the stack
        deckText.position.set(
          (CARD_WIDTH / 2) + (maxVisibleCards > 0 ? (maxVisibleCards - 1) : 0),
          CARD_HEIGHT + 5
        );
        deckContainer.addChild(deckText);
        
        deckContainer.position.set(width / 2 - CARD_WIDTH - 20, height / 2 - CARD_HEIGHT / 2);
        app.stage.addChild(deckContainer);
    }
    
    // Add the tooltip to the stage last so it renders on top of everything.
    app.stage.addChild(tooltipRef.current);

  }, [app, createCardSprite, drawPlayer]);

  const animateSetCompletion = useCallback((cardSprites: PIXI.Container[]) => {
    if (!app) return;
    const duration = 1200; // ms
    let elapsed = 0;

    cardSprites.forEach(sprite => app.stage.addChild(sprite));

    const tick = (ticker: PIXI.Ticker) => {
        elapsed += ticker.deltaMS;
        const progress = Math.min(elapsed / duration, 1);

        // Pulse effect: scale up then down using a sine wave
        const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
        // Fade out
        const alpha = 1 - progress;

        cardSprites.forEach(sprite => {
            sprite.scale.set(scale);
            sprite.alpha = alpha;
        });

        if (progress >= 1) {
            app.ticker.remove(tick);
            cardSprites.forEach(sprite => sprite.destroy());
        }
    };

    app.ticker.add(tick);
  }, [app]);
  
  // This effect handles drawing updates and animations whenever the gameState changes.
  useEffect(() => {
    const drawAndAnimate = async () => {
      // Ensure initialization is complete and we have a game state before drawing.
      if (!initPromiseRef.current || !gameState || !app.renderer) {
        return;
      }
      await initPromiseRef.current;
      
      const prevGameState = prevGameStateRef.current;

      // First, draw the new, final state of the board immediately.
      drawGame(gameState);

      // Now, if there was a previous state, check for changes to animate.
      if (prevGameState) {
          const { width, height } = app.screen;
          
          const getPlayerPosition = (index: number, w: number, h: number) => {
              if (index === 0) return { x: w / 2, y: h - CARD_HEIGHT - PADDING };
              const oppPos = [
                  { x: w / 2, y: PADDING },
                  { x: PADDING + CARD_WIDTH, y: h / 2 },
                  { x: w - PADDING - CARD_WIDTH, y: h / 2 },
              ];
              return oppPos[index - 1];
          };

          // Check for set completions
          gameState.players.forEach((player, playerIndex) => {
              const prevPlayer = prevGameState.players[playerIndex];
              if (player.sets.length > prevPlayer.sets.length) {
                  const newRank = player.sets.find(rank => !prevPlayer.sets.includes(rank));
                  if (!newRank) return;

                  const playerPosition = getPlayerPosition(playerIndex, width, height);

                  const cardIndices: number[] = [];
                  prevPlayer.hand.forEach((card, index) => {
                      if (card.rank === newRank) cardIndices.push(index);
                  });

                  if (cardIndices.length === 4) {
                      const handWidth = prevPlayer.hand.length * (CARD_WIDTH / 3) + (CARD_WIDTH * 2/3);
                      const startX = playerPosition.x - handWidth / 2;
                      const y = playerPosition.y + 30;

                      const animatedSprites = cardIndices.map(cardIndex => {
                          const card = prevPlayer.hand[cardIndex];
                          const sprite = createCardSprite(card, true, playerIndex === 0);
                          sprite.position.set(startX + cardIndex * (CARD_WIDTH / 3), y);
                          // Set pivot to center for scaling animation
                          sprite.pivot.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);
                          sprite.x += CARD_WIDTH / 2;
                          sprite.y += CARD_HEIGHT / 2;
                          return sprite;
                      });

                      animateSetCompletion(animatedSprites);
                  }
              }
          });
      }

      // Update the ref *after* using it for comparison
      prevGameStateRef.current = gameState;
    };
    drawAndAnimate();
  }, [gameState, drawGame, app, createCardSprite, animateSetCompletion]);

  // This effect handles the one-time setup and teardown of the PIXI application.
  useEffect(() => {
    const container = pixiContainerRef.current;
    if (!container) return;
    
    let isMounted = true;

    const setup = async () => {
      // Initialize only if it hasn't been started before.
      if (!initPromiseRef.current) {
        initPromiseRef.current = app.init({
          background: '#1e293b',
          resizeTo: container,
          antialias: true,
        });
      }

      // Wait for the single initialization promise to resolve.
      await initPromiseRef.current;

      // If the component was unmounted while we were waiting, abort.
      if (!isMounted) {
        return;
      }

      // Load avatar textures once
      if (!avatarTexturesRef.current) {
          const textures: Partial<Record<AvatarId, PIXI.Texture>> = {};
          for (const key in avatarSvgs) {
              const avatarId = key as AvatarId;
              const dataUri = 'data:image/svg+xml;base64,' + btoa(avatarSvgs[avatarId]);
              textures[avatarId] = await PIXI.Assets.load(dataUri);
          }
          avatarTexturesRef.current = textures as Record<AvatarId, PIXI.Texture>;
      }

      // Create and store the tooltip instance once the app is ready.
      if (!tooltipRef.current) {
          const tooltip = new PIXI.Container();
          const tooltipBg = new PIXI.Graphics();
          const tooltipText = new PIXI.Text('', {
              fontFamily: 'Arial',
              fontSize: 16,
              fill: 0xffffff,
              align: 'center',
          });
          tooltip.addChild(tooltipBg, tooltipText);
          tooltip.visible = false;
          tooltipRef.current = tooltip;
      }

      // Append the canvas only if it's not already in the container.
      if (!container.contains(app.canvas)) {
        container.appendChild(app.canvas);
      }
    };

    setup();

    return () => {
      isMounted = false;
      // On cleanup, just detach the canvas. The app instance and its
      // initialized state are preserved for the next mount.
      if (app.canvas && container.contains(app.canvas)) {
        container.removeChild(app.canvas);
      }
    };
  }, [app]);

  return <div ref={pixiContainerRef} className="w-full h-full rounded-lg overflow-hidden" />;
};