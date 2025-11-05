import { draw, update, gameState } from "./gameCore.js";

let replayRequestId;
let lastFrameTime = 0;

export function gameLoop(timestamp) {
    if (!gameState.gameRunning || gameState.gameOver || gameState.paused) return;

    if (timestamp - lastFrameTime > gameState.gameSpeed) {
        update();
        draw();
        lastFrameTime = timestamp;
    }

    requestAnimationFrame(gameLoop);
}

export function playReplay(replayData) {
    if (replayData.length === 0) return;

    let frame = 0;
    let lastReplayTime = 0;
    gameState.gameRunning = false;
    gameState.paused = true;
    gameState.isReplaying = true;

    // UI päivitykset
    document.getElementById('MsgDisplay').textContent = "Toisinta käynnissä!";
    document.getElementById('gameBtn').style.display = 'none';
    document.getElementById('stopReplayBtn').style.display = 'inline-block';

    function replayLoop(timestamp) {
        if (frame >= replayData.length) {
            stopReplay();
            return;
        }
        const currentFrame = replayData[frame];
        // const currentSpeed = currentFrame.speed;
        const currentSpeed = 50;

        if (timestamp - lastReplayTime > currentSpeed) {
            gameState.snake = currentFrame.snake
            gameState.food = currentFrame.food
            draw();
            frame++;
            lastReplayTime = timestamp;
        }
        replayRequestId = requestAnimationFrame(replayLoop);
    }
    replayRequestId = requestAnimationFrame(replayLoop);
}

export function stopReplay() {
    cancelAnimationFrame(replayRequestId);
    gameState.isReplaying = false;
    document.getElementById('MsgDisplay').textContent = "";
    document.getElementById('stopReplayBtn').style.display = 'none';
    document.getElementById('gameBtn').style.display = 'inline-block';
}
