import { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Refs for high-performance updates (avoids React render lag)
  const gameAreaRef = useRef(null);
  const dinoRef = useRef(null);
  const obstacleRef = useRef(null);
  
  // Game State Refs
  const posRef = useRef({
    dinoBottom: 0,
    dinoVelocity: 0,
    obstacleLeft: 100,
    gameSpeed: 5,
    isJumping: false,
    score: 0
  });

  const requestRef = useRef();
  const lastTimeRef = useRef();

  // Constants
  const GRAVITY = 0.8;
  const JUMP_FORCE = 16;
  const GROUND_LEVEL = 0;

  const jump = () => {
    if (!gameStarted) {
      startGame();
      return;
    }
    if (gameOver) return;
    if (!posRef.current.isJumping) {
      posRef.current.isJumping = true;
      posRef.current.dinoVelocity = JUMP_FORCE;
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    posRef.current = {
      dinoBottom: 0,
      dinoVelocity: 0,
      obstacleLeft: 100,
      gameSpeed: 5,
      isJumping: false,
      score: 0
    };
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = (time) => {
    if (gameOver) return;

    const deltaTime = (time - lastTimeRef.current) / 16.67; // Normalize to 60fps
    lastTimeRef.current = time;

    const state = posRef.current;

    // 1. Dino Physics
    if (state.isJumping) {
      state.dinoVelocity -= GRAVITY * deltaTime;
      state.dinoBottom += state.dinoVelocity * deltaTime;

      if (state.dinoBottom <= GROUND_LEVEL) {
        state.dinoBottom = GROUND_LEVEL;
        state.isJumping = false;
        state.dinoVelocity = 0;
      }
    }

    // 2. Obstacle Movement
    state.obstacleLeft -= state.gameSpeed * deltaTime;
    if (state.obstacleLeft < -5) {
      state.obstacleLeft = 100 + Math.random() * 20; // Reset cactus
      state.score += 1;
      setScore(state.score);
      state.gameSpeed += 0.1; // Slowly get faster
    }

    // 3. Update DOM directly for performance
    if (dinoRef.current) dinoRef.current.style.bottom = `${state.dinoBottom + 50}px`;
    if (obstacleRef.current) obstacleRef.current.style.left = `${state.obstacleLeft}%`;

    // 4. Collision Detection (Hitbox Shrinking)
    const dino = dinoRef.current.getBoundingClientRect();
    const obs = obstacleRef.current.getBoundingClientRect();

    // Shrink hitboxes by 15px to account for emoji whitespace
    const padding = 15;
    if (
      dino.right - padding > obs.left + padding &&
      dino.left + padding < obs.right - padding &&
      dino.bottom - padding > obs.top + padding
    ) {
      handleGameOver();
      return;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const handleGameOver = () => {
    setGameOver(true);
    if (posRef.current.score > highScore) setHighScore(posRef.current.score);
    cancelAnimationFrame(requestRef.current);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameStarted, gameOver]);

  return (
    <div className="game-container">
      <div className="background">
        <div className="sun" />
        <div className="cloud cloud-1" />
        <div className="cloud cloud-2" />
      </div>

      <div className="game-card">
        <div className="header">
          <h2>🦖 DINO RUN</h2>
          <div className="score-board">
            <span>HI: {highScore}</span>
            <span>SCORE: {score}</span>
          </div>
        </div>

        <div className="game-area" onClick={jump}>
          {!gameStarted && !gameOver && (
            <div className="overlay">
              <p>CLICK TO START</p>
              <span>(OR PRESS SPACE)</span>
            </div>
          )}

          <div className="ground-line" />
          
          <div ref={dinoRef} className={`dino ${posRef.current.isJumping ? "" : "running"}`}>
            🦖
          </div>

          <div ref={obstacleRef} className="cactus">
            🌵
          </div>
        </div>

        {gameOver && (
          <div className="game-over-overlay">
            <div className="modal">
              <h1>CRASHED! 💥</h1>
              <p>Score: {score}</p>
              <button onClick={startGame}>RETRY</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
