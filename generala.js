const diceElements = document.querySelectorAll('.dice');
const rollButton = document.getElementById('roll-button');
const scoreTable = document.getElementById('score-table');
const playerNameInput = document.getElementById('player-name');
const addPlayerButton = document.getElementById('add-player');
const playersList = document.getElementById('players-list');
const scoreOptions = document.getElementById('score-options');
const categoryButtons = document.getElementById('category-buttons');
const editScoreButton = document.getElementById('edit-score-button');
const restartGameButton = document.getElementById('restart-game-button');

let players = [];
let currentPlayerIndex = 0;
let diceValues = [0, 0, 0, 0, 0];
let rollsLeft = 3;
let currentTurn = 1;

const categories = [
    '1', '2', '3', '4', '5', '6',
    'Escalera', 'Full', 'Póker', 'Generala', 'Generala Doble'
];

// Agregar estas variables al principio del archivo
let editHistory = [];
const maxHistoryLength = 10; // Número máximo de ediciones que queremos guardar

function addPlayer() {
    const name = playerNameInput.value.trim();
    if (name) {
        players.push({
            name: name,
            scores: Array(categories.length).fill(null)
        });
        updatePlayersList();
        playerNameInput.value = '';
        updateScoreTable();
    }
}

function updatePlayersList() {
    playersList.innerHTML = players.map(player => `<div class="player">${player.name}</div>`).join('');
}

function updateScoreTable() {
    let html = '<tr><th>Categoría</th>' + players.map(player => `<th>${player.name}</th>`).join('') + '</tr>';
    categories.forEach((category, index) => {
        html += '<tr>';
        html += `<td>${category}</td>`;
        players.forEach(player => {
            if (player.scores[index] !== null) {
                html += `<td>${player.scores[index]}</td>`;
            } else {
                html += `<td class="available">-</td>`;
            }
        });
        html += '</tr>';
    });
    
    // Agregar fila para el total
    html += '<tr><th>Total</th>';
    players.forEach(player => {
        const total = player.scores.reduce((sum, score) => sum + (score || 0), 0);
        html += `<th>${total}</th>`;
    });
    html += '</tr>';
    
    scoreTable.innerHTML = html;
}

function updateCurrentPlayerInfo() {
    const currentPlayer = players[currentPlayerIndex];
    const playerInfo = document.createElement('div');
    playerInfo.id = 'current-player-info';
    playerInfo.innerHTML = `
        <h3>Turno de ${currentPlayer.name}</h3>
        <p>Tiradas restantes: ${rollsLeft}</p>
        <p>Categorías disponibles:</p>
        <ul>
            ${categories.map((category, index) => 
                currentPlayer.scores[index] === null ? `<li>${category}</li>` : ''
            ).join('')}
        </ul>
    `;
    
    const existingInfo = document.getElementById('current-player-info');
    if (existingInfo) {
        existingInfo.replaceWith(playerInfo);
    } else {
        document.getElementById('game-container').insertBefore(playerInfo, scoreOptions);
    }
    
    // Mostrar opciones de puntaje si hay dados en la mesa
    if (diceValues.some(value => value !== 0)) {
        showScoreOptions();
    } else {
        scoreOptions.style.display = 'none';
    }
}

function rollDice() {
    if (rollsLeft > 0) {
        diceValues = diceValues.map((value, index) => {
            const die = diceElements[index];
            return die.classList.contains('selected') ? value : Math.floor(Math.random() * 6) + 1;
        });
        updateDiceDisplay();
        rollsLeft--;
        updateCurrentPlayerInfo();
        showScoreOptions(); // Mostrar opciones de puntaje después de cada tirada
        if (rollsLeft === 0) {
            rollButton.style.display = 'none';
        }
    }
}

function updateDiceDisplay() {
    diceElements.forEach((die, index) => {
        die.innerHTML = diceValues[index] ? 
            `<span>${diceValues[index]}</span><div class="tirita-izquierda"></div><div class="tirita-derecha"></div>` : 
            '<div class="tirita-izquierda"></div><div class="tirita-derecha"></div>';
    });
}

function highlightBestOption() {
    let bestScore = 0;
    let bestCategory = -1;
    categories.forEach((category, index) => {
        if (players[currentPlayerIndex].scores[index] === null) {
            const score = calculateCategoryScore(index);
            if (score > bestScore) {
                bestScore = score;
                bestCategory = index;
            }
        }
    });
    if (bestCategory !== -1) {
        const buttons = categoryButtons.getElementsByTagName('button');
        buttons[bestCategory].style.backgroundColor = '#F9B54C';
    }
}

function showScoreOptions() {
    scoreOptions.style.display = 'block';
    categoryButtons.innerHTML = categories.map((category, index) => {
        if (players[currentPlayerIndex].scores[index] === null) {
            const score = calculateCategoryScore(index);
            return `<button onclick="selectCategory(${index})">${category} (${score})</button>`;
        }
        return '';
    }).join('');
    highlightBestOption();
}

function calculateCategoryScore(categoryIndex) {
    const isServed = rollsLeft === 2;
    
    if (categoryIndex < 6) {
        return diceValues.filter(value => value === categoryIndex + 1).reduce((a, b) => a + b, 0);
    } else {
        const sortedValues = [...diceValues].sort((a, b) => a - b);
        const valueCounts = diceValues.reduce((counts, value) => {
            counts[value] = (counts[value] || 0) + 1;
            return counts;
        }, {});

        let score = 0;
        switch (categoryIndex) {
            case 6: // Escalera
                if (
                    (sortedValues.join(',') === '1,2,3,4,5') ||
                    (sortedValues.join(',') === '2,3,4,5,6') ||
                    (sortedValues.join(',') === '1,3,4,5,6') ||
                    (sortedValues.join(',') === '1,2,3,4,6')  // Nueva condición para 6,1,2,3,4
                ) {
                    score = 20;
                    if (isServed) score += 5;
                }
                break;
            case 7: // Full
                const counts = Object.values(valueCounts);
                if (counts.includes(2) && counts.includes(3)) {
                    score = 30;
                    if (isServed) score += 5;
                }
                break;
            case 8: // Póker
                if (Object.values(valueCounts).includes(4)) {
                    score = 40;
                    if (isServed) score += 5;
                }
                break;
            case 9: // Generala
                if (Object.values(valueCounts).includes(5)) {
                    score = 50;
                    if (isServed) score += 5;
                }
                break;
            case 10: // Generala Doble
                if (Object.values(valueCounts).includes(5) && players[currentPlayerIndex].scores[9] !== null) {
                    score = 100;
                    if (isServed) score += 5;
                }
                break;
        }
        return score;
    }
}

function selectCategory(categoryIndex) {
    const player = players[currentPlayerIndex];
    player.scores[categoryIndex] = calculateCategoryScore(categoryIndex);
    saveGame();
    nextTurn();
}

function nextTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    if (currentPlayerIndex === 0) {
        currentTurn++;
    }
    rollsLeft = 3;
    diceValues = [0, 0, 0, 0, 0];
    updateDiceDisplay();
    updateScoreTable();
    rollButton.style.display = 'block';
    scoreOptions.style.display = 'none';
    diceElements.forEach(die => {
        die.classList.remove('selected');
        die.style.cursor = 'default';
    });

    if (currentTurn > 10) {
        endGame();
    } else {
        updateCurrentPlayerInfo();
    }
}

function endGame() {
    rollButton.disabled = true;
    rollButton.textContent = 'Juego terminado';
    const winner = players.reduce((prev, current) => 
        (prev.scores.reduce((sum, score) => sum + (score || 0), 0) > 
         current.scores.reduce((sum, score) => sum + (score || 0), 0)) ? prev : current
    );
    
    // Agregar la copa del mundo al nombre del ganador en la tabla de puntuación
    const winnerIndex = players.indexOf(winner);
    const headerCells = scoreTable.getElementsByTagName('th');
    headerCells[winnerIndex + 1].innerHTML += '<span class="world-cup"></span>';
    
    alert(`¡El juego ha terminado! El ganador es ${winner.name} con ${winner.scores.reduce((sum, score) => sum + (score || 0), 0)} puntos.`);
}

rollButton.addEventListener('click', rollDice);
addPlayerButton.addEventListener('click', addPlayer);

diceElements.forEach(die => {
    die.addEventListener('click', () => {
        if (rollsLeft < 3) {
            die.classList.toggle('selected');
        }
    });
});

function initGame() {
    loadGame();
    updateDiceDisplay();
    diceElements.forEach(die => {
        die.style.cursor = 'default';
    });
    scoreOptions.style.display = 'none';
    
    editScoreButton.addEventListener('click', editScore);
    restartGameButton.addEventListener('click', confirmRestart);
    
    // Agregar evento para el botón de deshacer
    const undoButton = document.getElementById('undo-edit-button');
    if (undoButton) {
        undoButton.addEventListener('click', undoLastEdit);
    }
}

// Agregar función para guardar el juego
function saveGame() {
    localStorage.setItem('generalaGame', JSON.stringify({
        players,
        currentPlayerIndex,
        currentTurn,
        editHistory
    }));
}

// Agregar función para cargar el juego
function loadGame() {
    const savedGame = localStorage.getItem('generalaGame');
    if (savedGame) {
        const gameData = JSON.parse(savedGame);
        players = gameData.players;
        currentPlayerIndex = gameData.currentPlayerIndex;
        currentTurn = gameData.currentTurn;
        editHistory = gameData.editHistory || [];
        updateScoreTable();
        updateCurrentPlayerInfo();
    }
}

// Agregar función para confirmar el reinicio del juego
function confirmRestart() {
    if (confirm('¿Estás seguro de que quieres reiniciar el juego? Todo el progreso se perderá.')) {
        restartGame();
    }
}

// Agregar función para reiniciar el juego
function restartGame() {
    players = [];
    currentPlayerIndex = 0;
    diceValues = [0, 0, 0, 0, 0];
    rollsLeft = 3;
    currentTurn = 1;
    localStorage.removeItem('generalaGame');
    updateScoreTable();
    updateCurrentPlayerInfo();
    updateDiceDisplay();
    rollButton.disabled = false;
    rollButton.textContent = 'Tirar dados';
}

// Llamar a initGame al final del archivo
initGame();

function editScore() {
    const playerIndex = prompt("Ingrese el número del jugador (1, 2, 3, ...):");
    if (playerIndex === null || playerIndex === "") return;
    
    const categoryIndex = prompt("Ingrese el número de la categoría (1-11):");
    if (categoryIndex === null || categoryIndex === "") return;
    
    const newScore = prompt("Ingrese el nuevo puntaje:");
    if (newScore === null || newScore === "") return;
    
    const player = players[parseInt(playerIndex) - 1];
    if (!player) {
        alert("Jugador no encontrado");
        return;
    }
    
    const category = parseInt(categoryIndex) - 1;
    if (category < 0 || category >= categories.length) {
        alert("Categoría no válida");
        return;
    }
    
    // Guardar el estado anterior antes de la edición
    const previousState = JSON.parse(JSON.stringify(players));
    
    // Realizar la edición
    player.scores[category] = parseInt(newScore);
    
    // Guardar la edición en el historial
    editHistory.push({
        playerIndex: parseInt(playerIndex) - 1,
        categoryIndex: category,
        previousScore: previousState[parseInt(playerIndex) - 1].scores[category],
        newScore: parseInt(newScore)
    });
    
    // Limitar el tamaño del historial
    if (editHistory.length > maxHistoryLength) {
        editHistory.shift();
    }
    
    updateScoreTable();
}

// Agregar función para deshacer la última edición
function undoLastEdit() {
    if (editHistory.length === 0) {
        alert("No hay ediciones para deshacer");
        return;
    }
    
    const lastEdit = editHistory.pop();
    players[lastEdit.playerIndex].scores[lastEdit.categoryIndex] = lastEdit.previousScore;
    
    updateScoreTable();
    alert("Se ha deshecho la última edición");
}
