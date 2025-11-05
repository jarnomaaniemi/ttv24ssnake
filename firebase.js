// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { collection, getDocs, query, orderBy, addDoc, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { playReplay } from "./gameLoop.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCQRtf4P3m23Roa6DzwPNx323TvFvol2qc",
    authDomain: "ssnake-97d8e.firebaseapp.com",
    projectId: "ssnake-97d8e",
    storageBucket: "ssnake-97d8e.firebasestorage.app",
    messagingSenderId: "247018675413",
    appId: "1:247018675413:web:1a379cde2fe88fb9ac965c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service // <-- LISÄTTY
const db = getFirestore(app);

let unsubscribeScores; // Tähän tallennetaan kuuntelijan peruutustoiminto

function setupRealtimeScoreListener(leaderboardElement) {
    const scoresRef = collection(db, "scores");
    // 12 korkeinta tulosta
    const q = query(scoresRef, orderBy("score", "desc"), limit(12));
    // onSnapshot palauttaa funktion, jolla voit peruuttaa kuuntelun
    unsubscribeScores = onSnapshot(q, (querySnapshot) => {
        const realtimeScores = [];
        querySnapshot.forEach((doc) => {
            realtimeScores.push({ id: doc.id, ...doc.data() });
        });
        updateLeaderboardUI(leaderboardElement, realtimeScores);
    }, (error) => {
        // TÄRKEÄÄ: Käsittele virheet täällä! Tämä on paikka, josta näet "Missing or insufficient permissions" -virheen.
        console.error("Virhe reaaliaikaisessa tulosten kuuntelussa:", error);
    });

    console.log("Reaaliaikainen tuloskuuntelija asetettu.");
}

// Esimerkkifunktio käyttöliittymän päivittämiseksi
function updateLeaderboardUI(leaderboardElement, scores) {
    leaderboardElement.innerHTML = '';
    scores.forEach((scoreEntry, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = `${index + 1}. ${scoreEntry.playerName}: ${scoreEntry.score}`;
        // Luo kuvake
        const replayIcon = document.createElement("span");
        replayIcon.textContent = "🎥";
        replayIcon.style.cursor = "pointer";
        replayIcon.style.marginLeft = "10px";
        // Lisää toiminto
        replayIcon.addEventListener("click", () => {
            playReplay(scoreEntry.replay);
        });

        listItem.appendChild(replayIcon);
        leaderboardElement.appendChild(listItem);
    });
}

async function saveScoreToDatabase(playerName, score, replay) {
    try {
        await addDoc(collection(db, "scores"), {
            playerName: playerName,
            score: score,
            replay: replay,
            timestamp: new Date()
        });
        console.log("Pisteet tallennettu!");
    } catch (error) {
        console.error("Virhe tallennettaessa pisteitä:", error);
    }
}


export { saveScoreToDatabase, setupRealtimeScoreListener };