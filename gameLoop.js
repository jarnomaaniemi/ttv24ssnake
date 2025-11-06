import { draw, update, gameState } from "./gameCore.js";

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