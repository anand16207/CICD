import { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [isJumping, setIsJumping] = useState(false);
  const [dinoBottom, setDinoBottom] = useState(0);
  const [obstacleLeft, setObstacleLeft] = useState(100);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(2);
  const [clouds, setClouds] = useState([
    { id: 1, left: 20, speed: 0.5, size: 40 },
    { id: 2, left: 60, speed: 0.3, size: 60 },
    { id: 3, left: 85, speed: 0.4, size: 50 }
  ]);

  const gameAreaRef = useRef(null);
  const dinoRef = useRef(null);
  const obstacleRef = useRef(null);
  const lastTimeRef = useRef(0);
  const gameLoopRef = useRef(null);
  const animationIdRef = useRef(null);

  // Physics constants
  const GRAVITY = 0.5;
  const JUMP_FORCE = 15;
  const INITIAL_SPEED = 2;
  const SPEED_INCREMENT = 0.1;
  const MAX_SPEED = 8;

  const dinoVelocity = useRef(0);
  const isOnGround = useRef(true);

  // Start game
  const startGame = () => {
    if (!gameStarted) {
      setGameStarted(true);
      setGameOver(false);
      setScore(0);
      setGameSpeed(INITIAL_SPEED);
      setObstacleLeft(100);
      setDinoBottom(0);
      dinoVelocity.current = 0;
      isOnGround.current = true;
    }
  };

  // Jump
  const jump = () => {
    if (!gameStarted) {
      startGame();
      return;
    }
    if (gameOver) return;

    if (isOnGround.current) {
      isOnGround.current = false;
      dinoVelocity.current = JUMP_FORCE;
      setIsJumping(true);
    }
  };

  // Cloud animation
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const animateClouds = () => {
      setClouds(prev =>
        prev.map(cloud => ({
          ...cloud,
          left: cloud.left <= -20 ? 120 : cloud.left - cloud.speed
        }))
      );
      animationIdRef.current = requestAnimationFrame(animateClouds);
    };

    animationIdRef.current = requestAnimationFrame(animateClouds);
    return () => cancelAnimationFrame(animationIdRef.current);
  }, [gameStarted, gameOver]);

  // Main game loop
  const gameLoop = (timestamp) => {
    if (!gameStarted || gameOver) return;

    const deltaTime = timestamp - lastTimeRef.current || 0;
    lastTimeRef.current = timestamp;

    // Dino physics
    if (!isOnGround.current) {
      dinoVelocity.current -= GRAVITY * (deltaTime / 16.67);
      setDinoBottom(prev => {
        const next = prev + dinoVelocity.current;
        if (next <= 0) {
          isOnGround.current = true;
          setIsJumping(false);
          dinoVelocity.current = 0;
          return 0;
        }
        return next;
      });
    }

    // Obstacle movement
    setObstacleLeft(prev => {
      const next = prev - gameSpeed * (deltaTime / 16.67);

      if (next < -10) {
        const newScore = score + 1;
        setScore(newScore);
        if (newScore > highScore) setHighScore(newScore);

        if (newScore % 10 === 0 && gameSpeed < MAX_SPEED) {
          setGameSpeed(s => Math.min(s + SPEED_INCREMENT, MAX_SPEED));
        }
        return 100 + Math.random() * 50;
      }
      return next;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        jump();
      }
      if (e.code === "KeyR" && gameOver) restart();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameOver, gameStarted]);

  // Start loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameStarted, gameOver]);

  // Collision detection
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const checkCollision = () => {
      const dino = dinoRef.current?.getBoundingClientRect();
      const obs = obstacleRef.current?.getBoundingClientRect();
      const area = gameAreaRef.current?.getBoundingClientRect();
      if (!dino || !obs || !area) return;

      const dx = dino.left - area.left;
      const dy = dino.bottom - area.top;

      const ox = obs.left - area.left;
      const oy = obs.top - area.top;

      if (
        dx < ox + obs.width - 5 &&
        dx + dino.width > ox + 5 &&
        dy > oy + 5 &&
        dy - dino.height < oy + obs.height - 5
      ) {
        setGameOver(true);
      }
    };

    const interval = setInterval(checkCollision, 16);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  const restart = () => {
    setGameOver(false);
    setGameStarted(true);
    setScore(0);
    setGameSpeed(INITIAL_SPEED);
    setObstacleLeft(100);
    setDinoBottom(0);
    dinoVelocity.current = 0;
    isOnGround.current = true;
    setIsJumping(false);
  };

  return (
    <div className="game-container">
      <div className="background">
        <div className="sun" />
        {clouds.map(c => (
          <div
            key={c.id}
            className="cloud"
            style={{
              left: `${c.left}%`,
              width: `${c.size}px`,
              height: `${c.size * 0.6}px`
            }}
          />
        ))}
      </div>

      <div className="game">
        <h1>🦖 Dino</h1>

        <div
          ref={gameAreaRef}
          className="game-area"
          onClick={jump}
        >
          <div className="ground-line" />
          <div className="ground-texture" />

          {/* 🦖 EMOJI DINO */}
          <div
            ref={dinoRef}
            className={`dino-character ${isJumping ? "jumping" : ""} ${isOnGround.current && !isJumping ? "running" : ""}`}
            style={{ bottom: `${dinoBottom}px` }}
          >
            🦖
          </div>

          {/* 🌵 CACTUS */}
          <div
            ref={obstacleRef}
            className="obstacle-cactus"
            style={{ left: `${obstacleLeft}%` }}
          >
            <div className="cactus-main" />
          </div>
        </div>

        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-modal">
              <div className="game-over-icon">💥</div>
              <h2>GAME OVER</h2>
              <p>Score: {score}</p>
              <button className="btn-restart" onClick={restart}>🔄 Restart</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
