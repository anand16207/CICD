import { useEffect, useState, useRef } from "react";
import "./App.css";

const SETTINGS = {
  GRAVITY: 0.6,
  JUMP_FORCE: -12,
  DUCK_GRAVITY: 1.5,
  INITIAL_SPEED: 7,
  SPEED_INC: 0.0015,
};

function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isNight, setIsNight] = useState(false);

  const dinoRef = useRef();
  const obstacleRef = useRef();
  const gameLoopRef = useRef();
  
  const state = useRef({
    y: 0, vy: 0, 
    isJumping: false, isDucking: false,
    obsX: 120, obsType: 'cactus', 
    speed: SETTINGS.INITIAL_SPEED, distance: 0
  });

  const startGame = () => {
    setGameOver(false);
    setGameStarted(true);
    setScore(0);
    state.current = {
      y: 0, vy: 0, isJumping: false, isDucking: false,
      obsX: 120, obsType: 'cactus',
      speed: SETTINGS.INITIAL_SPEED, distance: 0
    };
    gameLoopRef.current = requestAnimationFrame(update);
  };

  const update = () => {
    if (gameOver) return;
    const s = state.current;

    // Physics
    s.vy += s.isDucking ? SETTINGS.DUCK_GRAVITY : SETTINGS.GRAVITY;
    s.y += s.vy;
    if (s.y > 0) { s.y = 0; s.vy = 0; s.isJumping = false; }

    // Movement
    s.obsX -= s.speed;
    s.speed += SETTINGS.SPEED_INC;
    s.distance += 1;

    if (s.obsX < -10) {
      s.obsX = 100 + (Math.random() * 50);
      s.obsType = (s.distance > 800 && Math.random() > 0.7) ? 'bird' : 'cactus';
    }

    // High-Precision Collision
    const d = dinoRef.current.getBoundingClientRect();
    const o = obstacleRef.current.getBoundingClientRect();
    const p = 12; // Hitbox padding
    if (d.right-p > o.left+p && d.left+p < o.right-p && d.bottom-p > o.top+p && d.top+p < o.bottom-p) {
      setGameOver(true);
      return;
    }

    // Sync Visuals
    dinoRef.current.style.transform = `translateY(${s.y}px) scaleX(-1) scaleY(${s.isDucking ? 0.6 : 1})`;
    obstacleRef.current.style.left = `${s.obsX}%`;
    obstacleRef.current.style.bottom = s.obsType === 'bird' ? (s.distance % 200 > 100 ? '80px' : '40px') : '18px';
    
    const currentScore = Math.floor(s.distance / 10);
    setScore(currentScore);
    setIsNight(Math.floor(currentScore / 500) % 2 === 1);

    gameLoopRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (["Space", "ArrowUp"].includes(e.code)) { e.preventDefault(); if(!gameStarted || gameOver) startGame(); else if(!state.current.isJumping) { state.current.vy = SETTINGS.JUMP_FORCE; state.current.isJumping = true; } }
      if (e.code === "ArrowDown") { e.preventDefault(); if(!state.current.isJumping) state.current.isDucking = true; }
    };
    const handleKeyUp = (e) => { if (e.code === "ArrowDown") state.current.isDucking = false; };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKey); window.removeEventListener("keyup", handleKeyUp); cancelAnimationFrame(gameLoopRef.current); };
  }, [gameStarted, gameOver]);

  return (
    <div className={`chrome-shell ${isNight ? 'night' : ''}`}>
      <div className="game-container">
        <div className="score">HI {highScore.toString().padStart(5, '0')} {score.toString().padStart(5, '0')}</div>
        
        <div className="world">
          <div className="clouds" />
          <div className="stars" />
          <div className="horizon-line" />
          
          <div ref={dinoRef} className={`dino ${!state.current.isJumping && gameStarted ? 'running' : ''}`}>
            <div className="dino-eye" />
            🦖
          </div>

          <div ref={obstacleRef} className={`obstacle ${state.current.obsType}`}>
            {state.current.obsType === 'cactus' ? '🌵' : '🕊️'}
          </div>

          {gameOver && (
            <div className="overlay">
              <div className="game-over-text">G A M E  O V E R</div>
              <button className="restart-btn" onClick={startGame}>🔄</button>
            </div>
          )}
          {!gameStarted && <div className="start-msg">PRESS SPACE TO RUN</div>}
        </div>
      </div>
    </div>
  );
}

export default App;
