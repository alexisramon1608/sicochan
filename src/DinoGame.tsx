// DinoGame.tsx - TypeScript React Component Module
import React, { useEffect, useRef } from 'react';

interface DinoGameProps {
  containerId?: string;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
  jumpPower: number;
  grounded: boolean;
  color: string;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Sprites {
  obstacle: HTMLImageElement | null;
  background: HTMLImageElement | null;
}

class DinoGameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scoreElement: HTMLElement | null = null;
  gameOverElement: HTMLElement| null = null;
  finalScoreElement: HTMLElement | null = null;

  isRunning: boolean = false;
  score: number = 0;
  gameSpeed: number = 3;
  gravity: number = 0.6;

  player: Player;
  obstacles: Obstacle[] = [];
  obstacleTimer: number = 0;
  obstacleInterval: number = 120;

  bgX: number = 0;
  playerSprites: HTMLImageElement[] = [];
  currentPlayerSprite: number = 0;
  playerSpritesLoaded: number = 0;
  specialSprite: HTMLImageElement | null = null;
  specialSpriteLoaded: boolean = false;
  animationTime: number = 0;

  sprites: Sprites = {
    obstacle: null,
    background: null
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.player = {
      x: 50,
      y: canvas.height - 120,
      width: 80,
      height: 80,
      dy: 0,
      jumpPower: 20,
      grounded: true,
      color: '#FF6B6B'
    };

    this.loadSprites();
    this.setupControls();
  }

  setElements(scoreEl: HTMLElement, gameOverEl: HTMLElement, finalScoreEl: HTMLElement) {
    this.scoreElement = scoreEl;
    this.gameOverElement = gameOverEl;
    this.finalScoreElement = finalScoreEl;
  }

  loadSprites() {
    const playerSpriteUrls = [
      'https://i.imgur.com/ma5qyfz.png',
      'https://i.imgur.com/YrhlSea.png',
      'https://i.imgur.com/6Qh5zgf.png'
    ];

    playerSpriteUrls.forEach((url, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        this.playerSprites[index] = img;
        this.playerSpritesLoaded++;
      };
      img.onerror = () => {
        console.log(`Failed to load player sprite ${index + 1}`);
        this.playerSpritesLoaded++;
      };
    });

    const specialImg = new Image();
    specialImg.crossOrigin = 'anonymous';
    specialImg.src = 'https://i.imgur.com/JZa569N.png';
    specialImg.onload = () => {
      this.specialSprite = specialImg;
      this.specialSpriteLoaded = true;
    };

    const obstacleImg = new Image();
    obstacleImg.crossOrigin = 'anonymous';
    obstacleImg.src = 'https://i.imgur.com/Hf8RmIT.png';
    obstacleImg.onload = () => this.sprites.obstacle = obstacleImg;

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => this.sprites.background = bgImg;
  }

  setupControls() {
    const jumpHandler = (e: Event) => {
      e.preventDefault();
      this.jump();
    };

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        jumpHandler(e);
      }
    });

    // We listen on the document for touch/click to ensure it works inside the iframe overlay
    document.addEventListener('click', jumpHandler);
    document.addEventListener('touchstart', jumpHandler);
  }

  jump() {
    if (!this.isRunning) return;

    if (this.player.grounded) {
      this.player.dy = -this.player.jumpPower;
      this.player.grounded = false;
      this.currentPlayerSprite = (this.currentPlayerSprite + 1) % 3;
    }
  }

  update() {
    if (!this.isRunning) return;

    this.animationTime += 0.02;
    this.score += 1;
    this.gameSpeed = 3 + Math.floor(this.score / 200) * 0.8;

    this.player.dy += this.gravity;
    this.player.y += this.player.dy;

    const groundY = this.canvas.height - 100;
    if (this.player.y >= groundY) {
      this.player.y = groundY;
      this.player.dy = 0;
      this.player.grounded = true;
    }

    this.obstacleTimer++;
    if (this.obstacleTimer >= this.obstacleInterval) {
      this.obstacles.push({
        x: this.canvas.width,
        y: groundY - 45,
        width: 75,
        height: 125
      });
      this.obstacleTimer = 0;

      const baseInterval = Math.max(40, 120 - Math.floor(this.score / 300) * 8);
      const randomVariation = Math.random() * 80 - 40;
      this.obstacleInterval = Math.max(25, baseInterval + randomVariation);
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].x -= this.gameSpeed;

      if (this.obstacles[i].x + this.obstacles[i].width < 0) {
        this.obstacles.splice(i, 1);
      }
    }

    this.checkCollisions();
    this.bgX -= this.gameSpeed * 0.5;
    if (this.bgX <= -100) this.bgX = 0;
  }

  checkCollisions() {
    for (let obstacle of this.obstacles) {
      if (this.player.x < obstacle.x + obstacle.width &&
          this.player.x + this.player.width > obstacle.x &&
          this.player.y < obstacle.y + obstacle.height &&
          this.player.y + this.player.height > obstacle.y) {
        this.gameOver();
        return;
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.score >= 1000) {
      const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
      for (let i = 0; i <= 1; i += 0.2) {
        const hue = (this.animationTime * 50 + i * 360) % 360;
        gradient.addColorStop(i, `hsl(${hue}, 70%, 60%)`);
      }
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      if (this.sprites.background) {
        for (let x = this.bgX; x < this.canvas.width + 100; x += 100) {
          this.ctx.drawImage(this.sprites.background, x, 0, 100, 50);
        }
      } else {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);

    let currentSprite = null;
    let originalWidth = 350;
    let originalHeight = 575;

    if (this.score >= 1000 && this.specialSprite) {
      currentSprite = this.specialSprite;
      originalWidth = 500;
      originalHeight = 575;
    } else if (this.playerSprites[this.currentPlayerSprite] && this.playerSpritesLoaded > 0) {
      currentSprite = this.playerSprites[this.currentPlayerSprite];
    }

    if (currentSprite) {
      const scaleX = this.player.width / originalWidth;
      const scaleY = this.player.height / originalHeight;
      const scale = Math.min(scaleX, scaleY);

      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;

      const offsetX = (this.player.width - scaledWidth) / 2;
      const offsetY = (this.player.height - scaledHeight) / 2;

      this.ctx.drawImage(
        currentSprite,
        this.player.x + offsetX,
        this.player.y + offsetY,
        scaledWidth,
        scaledHeight
      );
    } else {
      this.ctx.fillStyle = this.player.color;
      this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }

    for (let obstacle of this.obstacles) {
      if (this.sprites.obstacle) {
        const scaleX = obstacle.width / 250;
        const scaleY = obstacle.height / 380;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = 250 * scale;
        const scaledHeight = 380 * scale;

        const offsetX = (obstacle.width - scaledWidth) / 2;
        const offsetY = (obstacle.height - scaledHeight) / 2;

        this.ctx.drawImage(
          this.sprites.obstacle,
          obstacle.x + offsetX,
          obstacle.y + offsetY,
          scaledWidth,
          scaledHeight
        );
      } else {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
    }

    if (this.scoreElement) {
      this.scoreElement.textContent = `Score: ${this.score}`;
    }
  }

  gameLoop() {
    this.update();
    this.render();

    if (this.isRunning) {
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  start() {
    this.isRunning = true;
    this.score = 0;
    this.gameSpeed = 3;
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.obstacleInterval = 120;
    this.currentPlayerSprite = 0;
    this.animationTime = 0;

    this.player.x = 50;
    this.player.y = this.canvas.height - 120;
    this.player.dy = 0;
    this.player.grounded = true;

    if (this.gameOverElement) {
      this.gameOverElement.style.display = 'none';
    }
    this.gameLoop();
  }

  gameOver() {
    this.isRunning = false;
    if (this.finalScoreElement) {
      this.finalScoreElement.textContent = this.score.toString();
    }
    if (this.gameOverElement) {
      this.gameOverElement.style.display = 'block';
    }
  }
}

// React component part (remains unchanged)
const DinoGame: React.FC<DinoGameProps> = ({ containerId = 'dino-game-container' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const gameOverRef = useRef<HTMLDivElement>(null);
  const finalScoreRef = useRef<HTMLSpanElement>(null);
  const gameEngineRef = useRef<DinoGameEngine | null>(null);

  useEffect(() => {
    if (canvasRef.current && scoreRef.current && gameOverRef.current && finalScoreRef.current) {
      gameEngineRef.current = new DinoGameEngine(canvasRef.current);
      gameEngineRef.current.setElements(scoreRef.current, gameOverRef.current, finalScoreRef.current);

      setTimeout(() => {
        gameEngineRef.current?.start();
      }, 500);
    }
  }, []);

  const handleRestart = () => {
    gameEngineRef.current?.start();
  };

  return (
    <div
      id={containerId}
      style={{
        border: '2px solid #333',
        background: 'white',
        position: 'relative',
        maxWidth: '100vw',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        style={{
          display: 'block',
          background: 'linear-gradient(to bottom, #87CEEB, #98FB98)',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
      <div
        ref={scoreRef}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          zIndex: 10
        }}
      >
        Score: 0
      </div>
      <div
        ref={gameOverRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          display: 'none',
          zIndex: 20
        }}
      >
        <h2>Game Over!</h2>
        <p>Final Score: <span ref={finalScoreRef}>0</span></p>
        <button
          onClick={handleRestart}
          style={{
            background: '#4CAF50',
            border: 'none',
            color: 'white',
            padding: '15px 32px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
            margin: '4px 2px',
            cursor: 'pointer',
            borderRadius: '5px'
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default DinoGame;

/**
 * Creates and injects the Dino Game as a full-screen overlay.
 */
export const createDinoGame = (): void => {
  // Prevent creating multiple game instances
  if (document.getElementById('dino-game-overlay-container')) {
    console.warn('Dino game is already active.');
    return;
  }

  // --- Main Overlay Container ---
  const overlay = document.createElement('div');
  overlay.id = 'dino-game-overlay-container';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  `;

  // --- Game Wrapper (for positioning iframe and close button) ---
  const gameWrapper = document.createElement('div');
  gameWrapper.style.cssText = `
    position: relative;
    width: 820px;
    max-width: 95%;
    height: 250px;
  `;

  // --- Close Button ---
  const closeButton = document.createElement('button');
  closeButton.innerText = '×'; // A nicer 'X'
  closeButton.style.cssText = `
    position: absolute;
    top: -15px;
    right: -15px;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: 2px solid white;
    background-color: #222;
    color: white;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 1;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: transform 0.2s ease, background-color 0.2s ease;
  `;
  closeButton.onmouseover = () => { closeButton.style.transform = 'scale(1.1)'; closeButton.style.backgroundColor = '#e63946'; };
  closeButton.onmouseout = () => { closeButton.style.transform = 'scale(1)'; closeButton.style.backgroundColor = '#222'; };

  // --- Iframe for the game ---
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  `;

  // --- HTML content for the iframe ---
  const gameHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dino Game</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            overflow: hidden; /* Prevent scrolling inside iframe */
            background: transparent;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        #gameContainer {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #gameCanvas {
            display: block;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, #87CEEB, #98FB98);
        }
        #score {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 24px;
            font-weight: bold;
            color: #333;
            text-shadow: 1px 1px 2px white;
            z-index: 10;
        }
        #gameOver {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            display: none;
            z-index: 20;
        }
        button {
            background: #4CAF50;
            border: none;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 5px;
            transition: background-color 0.2s ease;
        }
        button:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <div id="gameContainer">
        <canvas id="gameCanvas" width="800" height="200"></canvas>
        <div id="score">Score: 0</div>
        <div id="gameOver">
            <h2>Game Over!</h2>
            <p>Final Score: <span id="finalScore">0</span></p>
            <button onclick="window.game.start()">Play Again</button>
        </div>
    </div>
    <script>
        // Inject the game engine class into the iframe's window
        window.DinoGameEngine = ${DinoGameEngine.toString()};

        window.addEventListener('load', () => {
            const canvas = document.getElementById('gameCanvas');
            
            // Adjust canvas size to fit container if needed (for responsiveness)
            function resizeCanvas() {
                const container = document.getElementById('gameContainer');
                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;
                if(window.game) {
                  window.game.render(); // Re-render after resize
                }
            }
            // window.addEventListener('resize', resizeCanvas);
            
            // Initialize game
            window.game = new window.DinoGameEngine(canvas);
            window.game.setElements(
                document.getElementById('score'),
                document.getElementById('gameOver'),
                document.getElementById('finalScore')
            );

            // Auto-start after a brief delay
            setTimeout(() => window.game.start(), 300);
        });
    </script>
</body>
</html>`;

  iframe.srcdoc = gameHTML;

  // --- Event Handlers ---
  closeButton.onclick = () => {
    document.body.removeChild(overlay);
  };

  // Close the overlay by clicking on the background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });


  // --- Assemble and Inject ---
  gameWrapper.appendChild(iframe);
  gameWrapper.appendChild(closeButton);
  overlay.appendChild(gameWrapper);
  document.body.appendChild(overlay);
};

// Helper function for easy integration
export const initDinoGame = createDinoGame;
