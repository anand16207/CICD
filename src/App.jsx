import React, { useEffect, useState, useRef } from "react";
import "./App.css";

const SETTINGS = {
  GRAVITY: 0.6,
  FLAP_FORCE: -8,
  PIPE_SPEED: 3.5,
  PIPE_SPAWN_RATE: 1500, // ms
  PIPE_WIDTH: 52,
  PIPE_GAP: 160,
};

function App() {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const birdRef = useRef();
  const gameLoopRef = useRef();
  const pipesRef = useRef([]); // Stores pipe objects: { x, topHeight, id }
  
  const state = useRef({
    y: 250,
    vy: 0,
    rotation: 0,
    pipes: [],
    lastPipeTime: 0,
    score: 0
  });

  const startGame = () => {
    setGameOver(false);
    setGameStarted(true);
    setScore(0);
    state.current = {
      y: 250, vy: 0, rotation: 0,
      pipes: [], lastPipeTime: Date.now(), score: 0
    };
    gameLoopRef.current = requestAnimationFrame(update);
  };

  const flap = () => {
    if (!gameStarted || gameOver) {
      startGame();
    } else {
      state.current.vy = SETTINGS.FLAP_FORCE;
    }
  };

  const update = () => {
    if (gameOver) return;
    const s = state.current;

    // 1. Bird Physics
    s.vy += SETTINGS.GRAVITY;
    s.y += s.vy;
    s.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (s.vy * 0.1)));

    // 2. Pipe Management
    if (Date.now() - s.lastPipeTime > SETTINGS.PIPE_SPAWN_RATE) {
      const minPipeHeight = 50;
      const maxPipeHeight = 300;
      const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight)) + minPipeHeight;
      s.pipes.push({ x: 400, topHeight, id: Date.now(), passed: false });
      s.lastPipeTime = Date.now();
    }

    s.pipes.forEach(pipe => {
      pipe.x -= SETTINGS.PIPE_SPEED;
      // Scoring
      if (!pipe.passed && pipe.x < 50) {
        pipe.passed = true;
        s.score += 1;
        setScore(s.score);
      }
    });

    // Remove off-screen pipes
    s.pipes = s.pipes.filter(p => p.x > -SETTINGS.PIPE_WIDTH);

    // 3. Collision Detection
    const birdRect = birdRef.current.getBoundingClientRect();
    const hitCeiling = s.y < 0;
    const hitFloor = s.y > 480;

    const hitPipe = s.pipes.some(pipe => {
      const inXRange = 50 + 34 > pipe.x && 50 < pipe.x + SETTINGS.PIPE_WIDTH;
      const inYRange = s.y < pipe.topHeight || s.y + 24 > pipe.topHeight + SETTINGS.PIPE_GAP;
      return inXRange && inYRange;
    });

    if (hitCeiling || hitFloor || hitPipe) {
      setGameOver(true);
      return;
    }

    // 4. Sync Visuals
    birdRef.current.style.transform = `translateY(${s.y}px) rotate(${s.rotation}rad)`;
    
    gameLoopRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.code === "Space" || e.code === "ArrowUp") flap(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver]);

  return (
    <div className="game-wrapper" onClick={flap}>
      <div className="game-screen">
        <div className="score-display">{score}</div>
        
        {/* Bird */}
        <div ref={birdRef} className="bird">
          <div className="wing"></div>
          🟡
        </div>

        {/* Pipes */}
        {state.current.pipes.map(pipe => (
          <React.Fragment key={pipe.id}>
            <div 
              className="pipe pipe-top" 
              style={{ left: pipe.x, height: pipe.topHeight, width: SETTINGS.PIPE_WIDTH }}
            />
            <div 
              className="pipe pipe-bottom" 
              style={{ 
                left: pipe.x, 
                top: pipe.topHeight + SETTINGS.PIPE_GAP,
                height: 600, // Overflowing height
                width: SETTINGS.PIPE_WIDTH 
              }}
            />
          </React.Fragment>
        ))}

        {!gameStarted && <div className="overlay">TAP TO START</div>}
        {gameOver && <div className="overlay">GAME OVER<br/><span>Tap to Restart</span></div>}
        
        <div className="ground"></div>
      </div>
    </div>
  );
}

export default App;