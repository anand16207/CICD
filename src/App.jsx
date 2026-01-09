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

  // Constants for game physics
  const GRAVITY = 0.5;
  const JUMP_FORCE = 15;
  const INITIAL_SPEED = 2;
  const SPEED_INCREMENT = 0.1;
  const MAX_SPEED = 8;
  
  const dinoVelocity = useRef(0);
  const isOnGround = useRef(true);

  // Start game function
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

  // Improved jump logic with physics
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

  // Animate clouds
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const animateClouds = () => {
      setClouds(prevClouds => 
        prevClouds.map(cloud => ({
          ...cloud,
          left: cloud.left <= -20 ? 120 : cloud.left - cloud.speed
        }))
      );
      animationIdRef.current = requestAnimationFrame(animateClouds);
    };

    animationIdRef.current = requestAnimationFrame(animateClouds);
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [gameStarted, gameOver]);

  // Game loop for physics
  const gameLoop = (timestamp) => {
    if (!gameStarted || gameOver) return;

    // Calculate delta time for consistent physics
    const deltaTime = timestamp - lastTimeRef.current || 0;
    lastTimeRef.current = timestamp;

    // Dino physics
    if (!isOnGround.current) {
      dinoVelocity.current -= GRAVITY * (deltaTime / 16.67);
      setDinoBottom((prev) => {
        const newBottom = prev + dinoVelocity.current;
        
        // Ground collision
        if (newBottom <= 0) {
          isOnGround.current = true;
          setIsJumping(false);
          dinoVelocity.current = 0;
          return 0;
        }
        
        return newBottom;
      });
    }

    // Move obstacle
    setObstacleLeft((prev) => {
      const newLeft = prev - (gameSpeed * (deltaTime / 16.67));
      
      if (newLeft < -10) {
        const newScore = score + 1;
        setScore(newScore);
        
        // Update high score
        if (newScore > highScore) {
          setHighScore(newScore);
        }
        
        // Gradually increase speed
        if (newScore % 10 === 0 && gameSpeed < MAX_SPEED) {
          setGameSpeed((speed) => Math.min(speed + SPEED_INCREMENT, MAX_SPEED));
        }
        
        return 100 + Math.random() * 50;
      }
      
      return newLeft;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  // Keyboard and click controls
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        jump();
      }
      
      // Restart on R key
      if (e.code === "KeyR" && gameOver) {
        restart();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameOver, gameStarted]);

  // Start game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver]);

  // Accurate collision detection using refs
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const checkCollision = () => {
      if (!dinoRef.current || !obstacleRef.current) return;

      const dinoRect = dinoRef.current.getBoundingClientRect();
      const obstacleRect = obstacleRef.current.getBoundingClientRect();
      const gameAreaRect = gameAreaRef.current?.getBoundingClientRect();

      if (!gameAreaRect) return;

      // Adjust positions relative to game area
      const dinoX = dinoRect.left - gameAreaRect.left;
      const dinoY = dinoRect.bottom - gameAreaRect.top;
      const dinoWidth = dinoRect.width;
      const dinoHeight = dinoRect.height;

      const obstacleX = obstacleRect.left - gameAreaRect.left;
      const obstacleY = obstacleRect.top - gameAreaRect.top;
      const obstacleWidth = obstacleRect.width;
      const obstacleHeight = obstacleRect.height;

      // More accurate collision detection
      const collisionTolerance = 5;
      
      const collisionDetected = 
        dinoX < obstacleX + obstacleWidth - collisionTolerance &&
        dinoX + dinoWidth > obstacleX + collisionTolerance &&
        dinoY > obstacleY + collisionTolerance &&
        dinoY - dinoHeight < obstacleY + obstacleHeight - collisionTolerance;

      if (collisionDetected) {
        setGameOver(true);
      }
    };

    const collisionInterval = setInterval(checkCollision, 16);
    return () => clearInterval(collisionInterval);
  }, [gameStarted, gameOver, dinoBottom, obstacleLeft]);

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
        <div className="sun"></div>
        <div className="mountain"></div>
        <div className="mountain mountain-2"></div>
        <div className="hills"></div>
        
        {clouds.map(cloud => (
          <div 
            key={cloud.id}
            className="cloud"
            style={{
              left: `${cloud.left}%`,
              width: `${cloud.size}px`,
              height: `${cloud.size * 0.6}px`,
              animationDuration: `${10 / cloud.speed}s`
            }}
          />
        ))}
      </div>

      <div className="game">
        <header className="game-header">
          <h1>🦖 Dino Runner</h1>
          <div className="score-display">
            <div className="score-box">
              <span className="score-label">SCORE</span>
              <span className="score-value">{score.toString().padStart(5, '0')}</span>
            </div>
            <div className="score-box">
              <span className="score-label">HIGH SCORE</span>
              <span className="score-value">{highScore.toString().padStart(5, '0')}</span>
            </div>
            <div className="score-box">
              <span className="score-label">SPEED</span>
              <span className="speed-value">{gameSpeed.toFixed(1)}x</span>
            </div>
          </div>
        </header>

        <div className="controls-info">
          <span className="control-key">SPACE</span>
          <span className="control-key">↑</span>
          <span className="control-key">W</span>
          <span className="control-text">to JUMP</span>
          <span className="control-key">R</span>
          <span className="control-text">to RESTART</span>
        </div>

        <div 
          ref={gameAreaRef}
          className="game-area" 
          onClick={jump}
        >
          {!gameStarted && (
            <div className="start-screen">
              <div className="start-title">
                <h2>DINO RUNNER</h2>
                <div className="title-dino">🦖</div>
              </div>
              <p className="start-subtitle">Avoid the cacti and run as far as you can!</p>
              <div className="start-instruction">
                <div className="pulse-animation">
                  <span className="pulse-text">TAP OR PRESS SPACE TO START</span>
                </div>
              </div>
              <div className="character-select">
                <div className="character active">
                  <div className="char-dino"></div>
                  <span>Dino</span>
                </div>
                <div className="character">
                  <div className="char-trex"></div>
                  <span>T-Rex</span>
                </div>
                <div className="character">
                  <div className="char-raptor"></div>
                  <span>Raptor</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="ground-line"></div>
          <div className="ground-texture"></div>
          
          <div
            ref={dinoRef}
            className={`dino-character ${isJumping ? 'jumping' : ''} ${isOnGround.current && !isJumping ? 'running' : ''}`}
            style={{ bottom: `${dinoBottom}px` }}
          >
            <div className="dino-body">
              <div className="dino-head">
                <div className="dino-eye"></div>
                <div className="dino-smile"></div>
              </div>
              <div className="dino-neck"></div>
              <div className="dino-torso"></div>
              <div className="dino-leg back-leg"></div>
              <div className="dino-leg front-leg"></div>
              <div className="dino-tail"></div>
            </div>
          </div>
          
          <div
            ref={obstacleRef}
            className="obstacle-cactus"
            style={{ 
              left: `${obstacleLeft}%`,
              height: `${60 + (score % 4) * 15}px`
            }}
          >
            <div className="cactus-main">
              <div className="cactus-arm left-arm"></div>
              <div className="cactus-arm right-arm"></div>
              <div className="cactus-thorn"></div>
              <div className="cactus-thorn thorn-2"></div>
              <div className="cactus-thorn thorn-3"></div>
            </div>
            <div className="cactus-pot"></div>
          </div>

          {/* Floating score indicators */}
          {score > 0 && score % 5 === 0 && (
            <div className="score-popup">+{score % 10 === 0 ? 'SPEED BOOST!' : '5 POINTS!'}</div>
          )}
        </div>

        <div className="power-ups">
          <div className="power-up-label">UPCOMING</div>
          <div className="power-up-item">2x SCORE</div>
          <div className="power-up-item">SHIELD</div>
          <div className="power-up-item">SLOW MO</div>
        </div>

        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-modal">
              <div className="game-over-icon">💥</div>
              <h2>GAME OVER</h2>
              <div className="final-stats">
                <div className="stat">
                  <span className="stat-label">SCORE</span>
                  <span className="stat-value">{score}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">HIGH SCORE</span>
                  <span className="stat-value">{highScore}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">MAX SPEED</span>
                  <span className="stat-value">{gameSpeed.toFixed(1)}x</span>
                </div>
              </div>
              <div className="game-over-buttons">
                <button className="btn-restart" onClick={restart}>
                  <span className="btn-icon">🔄</span>
                  PLAY AGAIN (R)
                </button>
                <button className="btn-share">
                  <span className="btn-icon">📤</span>
                  SHARE SCORE
                </button>
              </div>
              <div className="social-proof">
                <p>🏆 Global High Score: 12,450</p>
                <p>⭐ Try to beat your personal best!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
