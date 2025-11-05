export let replayData = [];

export function recordReplayFrame(snake, food, speed) {
  replayData.push({
    snake: snake.map(part => ({ x: part.x, y: part.y })),
    food: { x: food.x, y: food.y },
    speed: speed
  });
}

export function resetReplayData() {
  replayData.length = 0;
}