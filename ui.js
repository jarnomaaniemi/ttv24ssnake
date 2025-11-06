import { setupRealtimeScoreListener } from "./firebase.js";
import { initGame, draw, gameState } from "./gameCore.js";
import { gameLoop } from "./gameLoop.js";

// Globaalit muuttujat
export let themeMode = localStorage.getItem('themeMode') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

// DOM-elementi
const gameBtn = document.getElementById('gameBtn');
const themeBtn = document.getElementById('themeToggle');

// Käyttöliittymän alustus
export function setupUI() {
    applyTheme();
    
    // Pelaajan nimi
    let playerName = localStorage.getItem('playerName');
    if (!playerName) {
        playerName = generateRandomUsername();
        localStorage.setItem('playerName', playerName);
    }
    gameState.playerName = playerName;
    document.getElementById('playerName').textContent = playerName

    // Paras tulos
    if (localStorage.getItem('bestScore')) {
        gameState.bestScore = parseInt(localStorage.getItem('bestScore'))
        document.getElementById('bestScore').textContent = "Paras tulos: " + gameState.bestScore;
    }

    // Painikkeet
    gameBtn.addEventListener('click', startGame);
    gameBtn.focus();
    themeBtn.addEventListener('click', function (e) {
        toggleTheme();
        e.target.blur();
    });

    // Tulostaulukko
    setupRealtimeScoreListener(document.getElementById("leaderboardList"));
}

export function startGame() {
    initGame();
    requestAnimationFrame(gameLoop);
    gameBtn.style.display = 'none'
}

export function applyTheme() {
    document.body.classList.remove('light-theme', 'dark-theme');

    if (themeMode === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.add('light-theme');
    }

    if (themeBtn) {
        themeBtn.textContent = themeMode === 'dark' ? '☀️' : '🌙';
    }

    return themeMode === 'dark';
}

export function toggleTheme() {
    themeMode = (themeMode === 'light') ? 'dark' : 'light';
    localStorage.setItem('themeMode', themeMode);
    applyTheme();
    draw();
}

export function generateRandomUsername() {
    const adjectives = ["Nopea", "Vahva", "Fiksu", "Rohkea", "Hiljainen"];
    const animals = ["Kettu", "Karhu", "Susi", "Pöllö", "Ilves"];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adj}${animal}${number}`;
}