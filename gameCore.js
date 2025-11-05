import { themeMode } from "./ui.js";
import { replayData, resetReplayData, recordReplayFrame } from "./replay.js";
import { saveScoreToDatabase } from "./firebase.js";
import { gameLoop } from "./gameLoop.js";

// Canvas-elementin ja piirtoasetusten määrittely
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 16;
const tileCountX = (canvas.width / gridSize) | 0;
const tileCountY = (canvas.height / gridSize) | 0;

// Suuntajono, johon pelaajan painallukset tallennetaan
let directionQueue = [];

export const gameState = {
    playerName: "",         // Pelaajan nimi
    snake: [],              // Käärmeen osat (koordinaatit)
    food: null,             // Ruoan sijainti
    dx: 0, dy: 0,           // Käärmeen liikesuunta
    gameOver: false,        // Onko peli päättynyt
    score: 0,               // Nykyinen pistemäärä
    bestScore: 0,           // Paras tulos
    lastScore: 0,           // Edellisen pelin tulos
    gameSpeed: 150,         // Pelin nopeus (ms per frame)
    gameRunning: false,     // Onko peli käynnissä
    paused: false,          // Onko peli tauolla
    isReplaying: false      // Onko toisinta käynnissä
};

// Satunnaislukugeneraattori ruoan sijainnin arpomiseen
export function randomInt(min, max) {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return min + (array[0] % range);
}

// Pelin alustus: käynnistää uuden pelin
export function initGame() {
    if (gameState.isReplaying) return; // Ei aloiteta peliä jos toisinta käynnissä

    // Käärmeen aloituspaikka keskellä kenttää
    gameState.snake = [{ x: tileCountX >> 1, y: tileCountY >> 1 }];
    // Ruoan satunnainen sijainti
    gameState.food = { x: randomInt(0, tileCountX - 1), y: randomInt(0, tileCountY - 1) };
    // Alustetaan suunta ja tila
    gameState.dx = 1; gameState.dy = 0;
    gameState.gameOver = false;
    gameState.score = 0;
    gameState.gameSpeed = 150;
    gameState.gameRunning = true;
    gameState.paused = false;
    directionQueue = [];

    resetReplayData();

    // Päivitetään käyttöliittymä
    document.getElementById('score').textContent = `${gameState.score.toString().padStart(3, "0")}`;
    document.getElementById('MsgDisplay').textContent = "";
    document.getElementById('gameBtn').textContent = 'Aloita uudelleen';
}

// Näppäimistön kuuntelu: ohjaa käärmettä ja hallitsee taukoa
export function setupControls() {
    document.addEventListener('keydown', e => {
        if (gameState.gameRunning) {
            // Suunnan vaihto
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                if (directionQueue.length < 2) {
                    directionQueue.push(e.key);
                }
            }
            // Tauko päälle/pois
            if (e.key.toLowerCase() === "p") {
                gameState.paused = !gameState.paused;
                document.getElementById('MsgDisplay').textContent = gameState.paused ? "⏸️" : "";
                requestAnimationFrame(gameLoop);
            }
        }
        // Enter jatkaa peliä tauolta
        if (e.key === "Enter") {
            if (gameState.paused) {
                gameState.paused = false;
                document.getElementById('MsgDisplay').textContent = "";
                requestAnimationFrame(gameLoop);
            }
        }
    });
}

// Päivittää pelin tilan: liikuttaa käärmettä, tarkistaa törmäykset ja syö ruoan
export function update() {
    // Suunnan käsittely
    if (directionQueue.length > 0) {
        const nextDir = directionQueue.shift();
        if (nextDir === "ArrowUp" && gameState.dy === 0) { gameState.dx = 0; gameState.dy = -1; }
        if (nextDir === "ArrowDown" && gameState.dy === 0) { gameState.dx = 0; gameState.dy = 1; }
        if (nextDir === "ArrowLeft" && gameState.dx === 0) { gameState.dx = -1; gameState.dy = 0; }
        if (nextDir === "ArrowRight" && gameState.dx === 0) { gameState.dx = 1; gameState.dy = 0; }
    }
    // Uusi pää
    const head = { x: gameState.snake[0].x + gameState.dx, y: gameState.snake[0].y + gameState.dy };
    // Törmäystarkistus seinään
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        endGame();
        return;
    }
    // Törmäystarkistus omaan vartaloon
    for (let part of gameState.snake) {
        if (part.x === head.x && part.y === head.y) {
            endGame();
            return;
        }
    }
    // Päivitetään käärmeen sijainti
    gameState.snake.unshift(head);
    // Tarkistetaan ruoan syönti
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // Pisteiden päivitys
        gameState.score++;
        document.getElementById('score').textContent = gameState.score.toString().padStart(3, "0");
        // Nopeutetaan peliä 
        gameState.gameSpeed -= 1;
        if (gameState.gameSpeed < 50) gameState.gameSpeed = 50;
        // Uusi ruoka
        let newFood;
        do {
            newFood = { x: randomInt(0, tileCountX - 1), y: randomInt(0, tileCountY - 1) };
        } while (gameState.snake.some(part => part.x === newFood.x && part.y === newFood.y));
        gameState.food = newFood;
    } else {
        // Ei syöty: poistetaan häntä
        gameState.snake.pop();
    }
    // Tallennetaan ruutu toisintaa varten
    recordReplayFrame(gameState.snake, gameState.food, gameState.gameSpeed);
}

// Piirtää pelin tilan canvas-elementtiin
export function draw() {
    // Käytetään pelitilasta asetettua teemaa tummaan/vaaleaan väritykseen.
    const isDark = themeMode === 'dark';
    // Tausta
    ctx.fillStyle = isDark ? "#1e1e1e" : "#dfe8d4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Snake
    ctx.fillStyle = isDark ? '#6abf69' : '#2f4f2f';
    for (let part of gameState.snake) {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
    }
    // Ruoka: määritykset
    ctx.lineWidth = 3;
    ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
    const padding = 4; // pikselimäärä, esim. 4px sisäänpäin
    const startX = gameState.food.x * gridSize;
    const startY = gameState.food.y * gridSize;
    const endX = (gameState.food.x + 1) * gridSize;
    const endY = (gameState.food.y + 1) * gridSize;
    // Ruoka: piirto
    ctx.beginPath();
    ctx.moveTo(startX + padding, startY + padding);
    ctx.lineTo(endX - padding, endY - padding);
    ctx.moveTo(endX - padding, startY + padding);
    ctx.lineTo(startX + padding, endY - padding);
    ctx.stroke();
}

// Päättää pelin ja päivittää tulokset
export function endGame() {
    gameState.gameOver = true;
    gameState.gameRunning = false;
    gameState.lastScore = gameState.score;

    // Päivitetään paras tulos tarvittaess
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        localStorage.setItem('bestScore', gameState.bestScore);
        saveScoreToDatabase(gameState.playerName, gameState.bestScore, replayData);
    }

    // Päivitetään käyttöliittymä
    document.getElementById('lastScore').textContent = "Edellinen peli: " + gameState.lastScore;
    document.getElementById('bestScore').textContent = "Paras tulos: " + gameState.bestScore;
    document.getElementById('MsgDisplay').textContent = "Peli päättyi!";
    const gameBtn = document.getElementById('gameBtn');
    gameBtn.style.display = 'inline-block';
    gameBtn.textContent = 'Aloita uudelleen';
    gameBtn.focus();
}
