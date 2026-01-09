import { useEffect, useState, useRef } from "react";
import "./App.css";

const SETTINGS = {
  GRAVITY: 0.6,
  JUMP_FORCE: -12,
  DUCK_GRAVITY: 1.5,
  GROUND_Y: 0,
  INITIAL_SPEED: 7,
  SPEED_INC: 0.001,
  SPAWN_INTERVAL: 1500,
};

function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Game Engine Refs
  const containerRef = useRef();
  const dinoRef = useRef();
  const obstacleRef = useRef();
  const gameLoopRef = useRef();
  
  // Game State Refs (High performance)
  const state = useRef({
    y: 0,
    vy: 0,
    isJumping: false,
    isDucking: false,
    obsX: 100,
    obsType: 'cactus', // 'cactus' or 'bird'
    birdY: 50,
    speed: SETTINGS.INITIAL_SPEED,
    distance: 0
  });

  const jump = () => {
    if (!gameStarted) return startGame();
    if (gameOver) return startGame();
    if (!state.current.isJumping && !state.current.isDucking) {
      state.current.vy = SETTINGS.JUMP_FORCE;
      state.current.isJumping = true;
    }
  };

  const duck = (isDuck) => {
    if (state.current.isJumping) return;
    state.current.isDucking = isDuck;
  };

  const startGame = () => {
    setGameOver(false);
    setGameStarted(true);
    setScore(0);
    state.current = {
      y: 0, vy: 0, isJumping: false, isDucking: false,
      obsX: 120, obsType: 'cactus', birdY: 50,
      speed: SETTINGS.INITIAL_SPEED, distance: 0
    };
    gameLoopRef.current = requestAnimationFrame(update);
  };

  const update = () => {
    if (gameOver) return;
    const s = state.current;

    // 1. Physics
    s.vy += s.isDucking ? SETTINGS.DUCK_GRAVITY : SETTINGS.GRAVITY;
    s.y += s.vy;

    if (s.y > SETTINGS.GROUND_Y) {
      s.y = SETTINGS.GROUND_Y;
      s.vy = 0;
      s.isJumping = false;
    }

    // 2. Obstacle Movement
    s.obsX -= s.speed;
    s.speed += SETTINGS.SPEED_INC;
    s.distance += 1;

    if (s.obsX < -10) {
      s.obsX = 100 + (Math.random() * 30);
      // Spawn bird only after score > 500
      s.obsType = (s.distance > 500 && Math.random() > 0.7) ? 'bird' : 'cactus';
      s.birdY = Math.random() > 0.5 ? 80 : 40; // High or low bird
    }

    // 3. Collision Logic
    const dRect = dinoRef.current.getBoundingClientRect();
    const oRect = obstacleRef.current.getBoundingClientRect();
    
    // Tight hitboxes
    const padding = 10;
    if (
      dRect.right - padding > oRect.left + padding &&
      dRect.left + padding < oRect.right - padding &&
      dRect.bottom - padding > oRect.top + padding &&
      dRect.top + padding < oRect.bottom - padding
    ) {
      setGameOver(true);
      return;
    }

    // 4. Sync UI
    dinoRef.current.style.transform = `translateY(${s.y}px) scaleY(${s.isDucking ? 0.6 : 1})`;
    obstacleRef.current.style.left = `${s.obsX}%`;
    if(s.obsType === 'bird') obstacleRef.current.style.bottom = `${s.birdY}px`;
    else obstacleRef.current.style.bottom = `10px`;
    
    setScore(Math.floor(s.distance / 10));
    if (Math.floor(s.distance / 10) % 1000 === 0 && s.distance > 0) {
        setIsDarkMode(prev => !prev);
    }

    gameLoopRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
      if (e.code === "ArrowDown") { e.preventDefault(); duck(true); }
    };
    const handleKeyUp = (e) => {
      if (e.code === "ArrowDown") duck(false);
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver]);

  return (
    <div className={`stage ${isDarkMode ? 'night' : 'day'}`}>
      <div className="score-panel">
        HI {highScore.toString().padStart(5, '0')} {score.toString().padStart(5, '0')}
      </div>

      <div className="game-world" ref={containerRef}>
        <div className="horizon" />
        
        {/* Dino */}
        <div 
          ref={dinoRef} 
          className={`dino-sprite ${state.current.isDucking ? 'ducking' : ''} ${!state.current.isJumping && gameStarted ? 'walking' : ''}`}
        >
          {state.current.isDucking ? '🦖' : '🦖'}
        </div>

        {/* Obstacle */}
        <div 
          ref={obstacleRef} 
          className={`obstacle ${state.current.obsType}`}
        >
          {state.current.obsType === 'cactus' ? '🌵' : '🕊️'}
        </div>

        {gameOver && (
          <div className="game-over">
            <h1>G A M E  O V E R</h1>
            <button onClick={startGame}>🔄</button>
          </div>
        )}

        {!gameStarted && (
            <div className="start-hint">PRESS SPACE TO PLAY</div>
        )}
      </div>
    </div>
  );
}

export default App;
