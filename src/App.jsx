import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isJumping, setIsJumping] = useState(false);
  const [dinoBottom, setDinoBottom] = useState(0);
  const [obstacleLeft, setObstacleLeft] = useState(100);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Jump logic
  const jump = () => {
    if (isJumping || gameOver) return;
    setIsJumping(true);

    let upInterval = setInterval(() => {
      setDinoBottom((prev) => {
        if (prev >= 120) {
          clearInterval(upInterval);
          let downInterval = setInterval(() => {
            setDinoBottom((prevDown) => {
              if (prevDown <= 0) {
                clearInterval(downInterval);
                setIsJumping(false);
                return 0;
              }
              return prevDown - 5;
            });
          }, 20);
        }
        return prev + 5;
      });
    }, 20);
  };

  // Keyboard control
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space") jump();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // Obstacle movement
  useEffect(() => {
    if (gameOver) return;

    const obstacleInterval = setInterval(() => {
      setObstacleLeft((prev) => {
        if (prev < -10) {
          setScore((s) => s + 1);
          return 100;
        }
        return prev - 2;
      });
    }, 20);

    // Collision detection
    if (obstacleLeft < 15 && obstacleLeft > 0 && dinoBottom < 40) {
      setGameOver(true);
      clearInterval(obstacleInterval);
    }

    return () => clearInterval(obstacleInterval);
  }, [obstacleLeft, dinoBottom, gameOver]);

  const restart = () => {
    setGameOver(false);
    setScore(0);
    setObstacleLeft(100);
    setDinoBottom(0);
  };

  return (
    <div className="game">
      <h2>🦖 Dino Game (Offline)</h2>
      <p>Score: {score}</p>

      <div className="game-area" onClick={jump}>
        <div
          className="dino"
          style={{ bottom: `${dinoBottom}px` }}
        ></div>
        <div
          className="obstacle"
          style={{ left: `${obstacleLeft}%` }}
        ></div>
      </div>

      {gameOver && (
        <div className="game-over">
          <h3>Game Over</h3>
          <button onClick={restart}>Restart</button>
        </div>
      )}
    </div>
  );
}

export default App;
