const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const highScoreElement = document.getElementById('high-score');
const targetScoreElement = document.getElementById('target-score');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreElement = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again-btn');
const specialMeterBar = document.getElementById('special-meter-bar');

// Audio elements
const soundBackground = document.getElementById('sound-background');
soundBackground.volume = 0.5;
const soundSwap = document.getElementById('sound-swap');
const soundMatch = document.getElementById('sound-match');
const soundBomb = document.getElementById('sound-bomb');
const soundLineBomb = document.getElementById('sound-line-bomb');
const soundRainbowBomb = document.getElementById('sound-rainbow-bomb');
const soundLevelUp = document.getElementById('sound-level-up');

const boardSize = 8;
const tileTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
let board = [];
let score = 0;
let multiplier = 1;
let level = 1;
let scoreToNextLevel = 1000;
let highScore = 0;
let selectedTile = null;
let specialMeter = 0;
const specialMeterMax = 100;
let isMusicPlaying = false;

function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}

function updateSpecialMeter() {
    const percentage = Math.min(100, (specialMeter / specialMeterMax) * 100);
    specialMeterBar.style.width = `${percentage}%`;
}

function updateScoreDisplay() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    highScoreElement.textContent = highScore;
    targetScoreElement.textContent = scoreToNextLevel;
}

function showLevelUpPopup() {
    playSound(soundLevelUp);
    gameBoard.classList.add('screen-flash');
    setTimeout(() => gameBoard.classList.remove('screen-flash'), 500);

    const popup = document.createElement('div');
    popup.textContent = 'Level Up!';
    popup.classList.add('level-up-popup');
    gameBoard.appendChild(popup);

    setTimeout(() => { popup.remove(); }, 2500);
}

function showComboPopup(multiplier) {
    const comboTexts = ['Combo', 'Super', 'Awesome', 'Excellent', 'Unbelievable!'];
    const text = `${comboTexts[Math.min(multiplier - 2, comboTexts.length - 1)]} x${multiplier}!`;

    const popup = document.createElement('div');
    popup.textContent = text;
    popup.classList.add('combo-popup');
    gameBoard.appendChild(popup);

    setTimeout(() => { popup.remove(); }, 1000);
}

function handleGameOver() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    finalScoreElement.textContent = score;
    gameOverOverlay.classList.remove('hidden');
    gameBoard.style.pointerEvents = 'none'; // Disable game board interaction
}

function checkForPossibleMoves() {
    const tempBoard = board.map(row => [...row]);

    function checkMatchesOnTempBoard(tempB) {
        // Horizontal
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize - 2; c++) {
                if (tempB[r][c] && tempB[r][c] === tempB[r][c + 1] && tempB[r][c] === tempB[r][c + 2]) {
                    return true;
                }
            }
        }
        // Vertical
        for (let c = 0; c < boardSize; c++) {
            for (let r = 0; r < boardSize - 2; r++) {
                if (tempB[r][c] && tempB[r + 1][c] && tempB[r][c] === tempB[r + 1][c] && tempB[r][c] === tempB[r + 2][c]) {
                    return true;
                }
            }
        }
        return false;
    }

    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            // Try swapping with right neighbor
            if (c + 1 < boardSize) {
                [tempBoard[r][c], tempBoard[r][c + 1]] = [tempBoard[r][c + 1], tempBoard[r][c]];
                if (checkMatchesOnTempBoard(tempBoard)) {
                    return true;
                }
                [tempBoard[r][c], tempBoard[r][c + 1]] = [tempBoard[r][c + 1], tempBoard[r][c]]; // Swap back
            }

            // Try swapping with bottom neighbor
            if (r + 1 < boardSize) {
                [tempBoard[r][c], tempBoard[r + 1][c]] = [tempBoard[r + 1][c], tempBoard[r][c]];
                if (checkMatchesOnTempBoard(tempBoard)) {
                    return true;
                }
                [tempBoard[r][c], tempBoard[r + 1][c]] = [tempBoard[r + 1][c], tempBoard[r][c]]; // Swap back
            }
        }
    }
    return false;
}

function shuffleBoard() {
    let hasPossibleMoves = false;
    do {
        board = []; // Clear the board data
        for (let row = 0; row < boardSize; row++) {
            board[row] = []; // Create a new row
            for (let col = 0; col < boardSize; col++) {
                let tileType;
                do {
                    tileType = tileTypes[Math.floor(Math.random() * tileTypes.length)];
                } while (
                    (col >= 2 && board[row][col - 1] === tileType && board[row][col - 2] === tileType) ||
                    (row >= 2 && board[row - 1][col] === tileType && board[row - 2][col] === tileType)
                );
                board[row][col] = tileType;
            }
        }
        hasPossibleMoves = checkForPossibleMoves();
    } while (!hasPossibleMoves);
    renderBoard(); // Render the newly shuffled board
}


// ゲームボードの初期化
function initializeBoard() {
    highScore = localStorage.getItem('highScore') || 0;
    board = []; // Clear the board data
    for (let row = 0; row < boardSize; row++) {
        board[row] = []; // Create a new row
        for (let col = 0; col < boardSize; col++) {
            let tileType;
            do {
                tileType = tileTypes[Math.floor(Math.random() * tileTypes.length)];
            } while (
                (col >= 2 && board[row][col - 1] === tileType && board[row][col - 2] === tileType) ||
                (row >= 2 && board[row - 1][col] === tileType && board[row - 2][col] === tileType)
            );
            board[row][col] = tileType;
        }
    }
}

// ゲームボードの描画（初回のみ）
function renderBoard() {
    gameBoard.innerHTML = ''; // ボードをクリア
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.style.backgroundColor = board[row][col];
            tile.dataset.row = row;
            tile.dataset.col = col;
            // 位置を絶対指定
            tile.style.top = `${row * 52}px`;
            tile.style.left = `${col * 52}px`;
            gameBoard.appendChild(tile);
        }
    }
}

initializeBoard();
shuffleBoard();
updateScoreDisplay();

gameBoard.addEventListener('click', async (e) => {
    if (!isMusicPlaying) {
        soundBackground.play();
        isMusicPlaying = true;
    }

    const clickedTileElement = e.target;
    if (!clickedTileElement.classList.contains('tile')) return;

    const row = parseInt(clickedTileElement.dataset.row);
    const col = parseInt(clickedTileElement.dataset.col);

    if (selectedTile) {
        const selectedTileElement = document.querySelector(`.tile[data-row='${selectedTile.row}'][data-col='${selectedTile.col}']`);
        selectedTileElement.classList.remove('selected');

        if (isAdjacent(row, col, selectedTile.row, selectedTile.col)) {
            await swapTiles(row, col, selectedTile.row, selectedTile.col);
            await handleMatches(row, col, selectedTile.row, selectedTile.col);
            selectedTile = null;
        } else {
            selectedTile = { row, col };
            clickedTileElement.classList.add('selected');
        }
    } else {
        selectedTile = { row, col };
        clickedTileElement.classList.add('selected');
    }
});

async function handleMatches(row1, col1, row2, col2) {
    const tile1Type = getTileType(row1, col1);
    const tile2Type = getTileType(row2, col2);

    if (tile1Type === 'rainbow-bomb' || tile2Type === 'rainbow-bomb') {
        playSound(soundRainbowBomb);
        createSpecialCombinationParticles(col1 * 52 + 25, row1 * 52 + 25);
        const rainbowBomb = tile1Type === 'rainbow-bomb' ? {r: row1, c: col1} : {r: row2, c: col2};
        const otherTileColor = tile1Type === 'rainbow-bomb' ? board[row2][col2].split('-')[0] : board[row1][col1].split('-')[0];
        
        let tilesToClear = new Set([`${rainbowBomb.r}-${rainbowBomb.c}`]);
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] && board[r][c].startsWith(otherTileColor)) {
                    tilesToClear.add(`${r}-${c}`);
                }
            }
        }
        await runMatchCycle(tilesToClear);
        return;
    }

    // 特殊タイルのかけ合わせ処理
    if (isSpecial(tile1Type) && isSpecial(tile2Type)) {
        const combinedTilesToClear = handleSpecialTileCombination(tile1Type, tile2Type, row1, col1, row2, col2);
        if (combinedTilesToClear.size > 0) {
            // Remove the two special tiles themselves from the board
            board[row1][col1] = null;
            board[row2][col2] = null;
            await runMatchCycle(combinedTilesToClear);
            return;
        }
    }

    // 通常のマッチ処理
    const matchInfo = checkForMatches();
    let tilesToClear = matchInfo.toRemove;

    if (tilesToClear.size === 0) {
        setTimeout(async () => { await swapTiles(row1, col1, row2, col2); }, 200);
        return;
    }

    // 特殊タイル生成の場所を決める
    const swappedTile1Pos = `${row1}-${col1}`;
    const swappedTile2Pos = `${row2}-${col2}`;
    let creationPos = null;
    if (tilesToClear.has(swappedTile1Pos)) {
        creationPos = {row: row1, col: col1};
    } else if (tilesToClear.has(swappedTile2Pos)) {
        creationPos = {row: row2, col: col2};
    }

    // もしスワップしたタイルがマッチに含まれない場合（連鎖など）、マッチの中から適当な場所を選ぶ
    if (!creationPos && matchInfo.toCreate.length > 0) {
        const firstMatchPos = tilesToClear.values().next().value;
        const [row, col] = firstMatchPos.split('-').map(Number);
        creationPos = { row, col };
    }

    matchInfo.toCreate.forEach(st => st.pos = creationPos);

    await runMatchCycle(tilesToClear, matchInfo.toCreate);
}

function handleSpecialTileCombination(tile1Type, tile2Type, row1, col1, row2, col2) {
    createSpecialCombinationParticles(col1 * 52 + 25, row1 * 52 + 25);
    let tilesToClear = new Set();
    const color1 = tile1Type.split('-')[0];
    const color2 = tile2Type.split('-')[0];

    // Combination 1: ラインクリア＋ラインクリア（同方向）
    if (tile1Type.includes('line-bomb-h') && tile2Type.includes('line-bomb-h')) {
        playSound(soundLineBomb);
        for (let c = 0; c < boardSize; c++) {
            tilesToClear.add(`${row1}-${c}`);
            tilesToClear.add(`${row2}-${c}`);
        }
    } else if (tile1Type.includes('line-bomb-v') && tile2Type.includes('line-bomb-v')) {
        playSound(soundLineBomb);
        for (let r = 0; r < boardSize; r++) {
            tilesToClear.add(`${r}-${col1}`);
            tilesToClear.add(`${r}-${col2}`);
        }
    }
    // Combination 2: ラインクリア＋ラインクリア（異方向）
    else if ((tile1Type.includes('line-bomb-h') && tile2Type.includes('line-bomb-v')) ||
               (tile1Type.includes('line-bomb-v') && tile2Type.includes('line-bomb-h'))) {
        playSound(soundLineBomb);
        const hBombRow = tile1Type.includes('line-bomb-h') ? row1 : row2;
        const vBombCol = tile1Type.includes('line-bomb-v') ? col1 : col2;
        for (let c = 0; c < boardSize; c++) tilesToClear.add(`${hBombRow}-${c}`);
        for (let r = 0; r < boardSize; r++) tilesToClear.add(`${r}-${vBombCol}`);
    }
    // Combination 3: ラインクリア＋爆弾
    else if ((tile1Type.includes('line-bomb-h') || tile1Type.includes('line-bomb-v')) && tile2Type.includes('bomb')) {
        playSound(soundBomb);
        const lineBombRow = tile1Type.includes('line-bomb-h') ? row1 : row2;
        const lineBombCol = tile1Type.includes('line-bomb-v') ? col1 : col2;
        const bombRow = tile2Type.includes('bomb') ? row2 : row1;
        const bombCol = tile2Type.includes('bomb') ? col2 : col1;

        // Clear the line
        if (tile1Type.includes('line-bomb-h')) {
            for (let c = 0; c < boardSize; c++) tilesToClear.add(`${lineBombRow}-${c}`);
        } else { // line-bomb-v
            for (let r = 0; r < boardSize; r++) tilesToClear.add(`${r}-${lineBombCol}`);
        }

        // Treat cleared line tiles as bombs
        const tempTilesToBomb = new Set();
        tilesToClear.forEach(pos => {
            const [r, c] = pos.split('-').map(Number);
            for (let br = Math.max(0, r - 1); br <= Math.min(boardSize - 1, r + 1); br++) {
                for (let bc = Math.max(0, c - 1); bc <= Math.min(boardSize - 1, c + 1); bc++) {
                    tempTilesToBomb.add(`${br}-${bc}`);
                }
            }
        });
        tempTilesToBomb.forEach(pos => tilesToClear.add(pos));

    } else if ((tile2Type.includes('line-bomb-h') || tile2Type.includes('line-bomb-v')) && tile1Type.includes('bomb')) {
        playSound(soundBomb);
        const lineBombRow = tile2Type.includes('line-bomb-h') ? row2 : row1;
        const lineBombCol = tile2Type.includes('line-bomb-v') ? col2 : col1;
        const bombRow = tile1Type.includes('bomb') ? row1 : row2;
        const bombCol = tile1Type.includes('bomb') ? col1 : col2;

        // Clear the line
        if (tile2Type.includes('line-bomb-h')) {
            for (let c = 0; c < boardSize; c++) tilesToClear.add(`${lineBombRow}-${c}`);
        } else { // line-bomb-v
            for (let r = 0; r < boardSize; r++) tilesToClear.add(`${r}-${lineBombCol}`);
        }

        // Treat cleared line tiles as bombs
        const tempTilesToBomb = new Set();
        tilesToClear.forEach(pos => {
            const [r, c] = pos.split('-').map(Number);
            for (let br = Math.max(0, r - 1); br <= Math.min(boardSize - 1, r + 1); br++) {
                for (let bc = Math.max(0, c - 1); bc <= Math.min(boardSize - 1, c + 1); bc++) {
                    tempTilesToBomb.add(`${br}-${bc}`);
                }
            }
        });
        tempTilesToBomb.forEach(pos => tilesToClear.add(pos));
    }
    // Combination 4: 爆弾＋爆弾
    else if (tile1Type.includes('bomb') && tile2Type.includes('bomb')) {
        playSound(soundBomb);
        const centerRow = Math.floor((row1 + row2) / 2);
        const centerCol = Math.floor((col1 + col2) / 2);
        const radius = 2; // For a 5x5 area (center + 2 in each direction)

        for (let r = Math.max(0, centerRow - radius); r <= Math.min(boardSize - 1, centerRow + radius); r++) {
            for (let c = Math.max(0, centerCol - radius); c <= Math.min(boardSize - 1, c + 1); c++) {
                tilesToClear.add(`${r}-${c}`);
            }
        }
    }
    // Combination 5: カラー爆弾＋爆弾
    else if (tile1Type.includes('rainbow-bomb') && tile2Type.includes('bomb')) {
        playSound(soundBomb);
        const bombColor = tile2Type.split('-')[0];
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] && board[r][c].startsWith(bombColor)) {
                    for (let br = Math.max(0, r - 1); br <= Math.min(boardSize - 1, r + 1); br++) {
                        for (let bc = Math.max(0, c - 1); bc <= Math.min(boardSize - 1, c + 1); bc++) {
                            tilesToClear.add(`${br}-${bc}`);
                        }
                    }
                }
            }
        }
    } else if (tile2Type.includes('rainbow-bomb') && tile1Type.includes('bomb')) {
        playSound(soundBomb);
        const bombColor = tile1Type.split('-')[0];
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] && board[r][c].startsWith(bombColor)) {
                    for (let br = Math.max(0, r - 1); br <= Math.min(boardSize - 1, r + 1); br++) {
                        for (let bc = Math.max(0, c - 1); bc <= Math.min(boardSize - 1, c + 1); bc++) {
                            tilesToClear.add(`${br}-${bc}`);
                        }
                    }
                }
            }
        }
    }
    // Combination 6: カラー爆弾＋ラインクリア
    else if (tile1Type.includes('rainbow-bomb') && (tile2Type.includes('line-bomb-h') || tile2Type.includes('line-bomb-v'))) {
        playSound(soundLineBomb);
        const lineBombColor = tile2Type.split('-')[0];
        const isHorizontal = tile2Type.includes('line-bomb-h');
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] && board[r][c].startsWith(lineBombColor)) {
                    if (isHorizontal) {
                        for (let i = 0; i < boardSize; i++) tilesToClear.add(`${r}-${i}`);
                    } else {
                        for (let i = 0; i < boardSize; i++) tilesToClear.add(`${i}-${c}`);
                    }
                }
            }
        }
    } else if (tile2Type.includes('rainbow-bomb') && (tile1Type.includes('line-bomb-h') || tile1Type.includes('line-bomb-v'))) {
        playSound(soundLineBomb);
        const lineBombColor = tile1Type.split('-')[0];
        const isHorizontal = tile1Type.includes('line-bomb-h');
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] && board[r][c].startsWith(lineBombColor)) {
                    if (isHorizontal) {
                        for (let i = 0; i < boardSize; i++) tilesToClear.add(`${r}-${i}`);
                    } else {
                        for (let i = 0; i < boardSize; i++) tilesToClear.add(`${i}-${c}`);
                    }
                }
            }
        }
    }

    return tilesToClear;
}

function createRandomSpecialTile() {
    const specialTileTypes = ['line-bomb-h', 'line-bomb-v', 'bomb', 'rainbow-bomb'];
    const randomType = specialTileTypes[Math.floor(Math.random() * specialTileTypes.length)];

    const availableTiles = [];
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (board[r][c] && !isSpecial(board[r][c])) {
                availableTiles.push({r, c});
            }
        }
    }

    if (availableTiles.length > 0) {
        const randomPos = availableTiles[Math.floor(Math.random() * availableTiles.length)];
        const color = board[randomPos.r][randomPos.c].split('-')[0];
        const newType = randomType === 'rainbow-bomb' ? 'rainbow-bomb' : `${color}-${randomType}`;
        board[randomPos.r][randomPos.c] = newType;

        const tileElement = document.querySelector(`.tile[data-row='${randomPos.r}'][data-col='${randomPos.c}']`);
        if (tileElement) {
            tileElement.className = 'tile';
            tileElement.style.backgroundColor = '';
            const imageIndex = Math.floor(Math.random() * 2) + 1;
            if (newType.includes('line-bomb-h')) {
                tileElement.style.backgroundImage = `url(images/line-h-${imageIndex}.png)`;
            } else if (newType.includes('line-bomb-v')) {
                tileElement.style.backgroundImage = `url(images/line-v-${imageIndex}.png)`;
            } else if (newType.includes('bomb')) {
                tileElement.style.backgroundImage = `url(images/bomb-${imageIndex}.png)`;
            } else if (newType === 'rainbow-bomb') {
                tileElement.classList.add('rainbow-bomb');
            }
        }
    }
}

function showScorePopup(score, positions) {
    const popup = document.createElement('div');
    popup.textContent = `+${score}`;
    popup.classList.add('score-popup');

    let totalX = 0;
    let totalY = 0;
    positions.forEach(pos => {
        const [row, col] = pos.split('-').map(Number);
        totalX += col * 52 + 25;
        totalY += row * 52 + 25;
    });
    const centerX = totalX / positions.size;
    const centerY = totalY / positions.size;

    popup.style.left = `${centerX}px`;
    popup.style.top = `${centerY}px`;

    gameBoard.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 1500);
}

function animateScoreUpdate(startScore, endScore) {
    const duration = 500; // ms
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const scoreIncrement = (endScore - startScore) / totalFrames;
    let currentFrame = 0;
    let currentScore = startScore;

    function update() {
        currentFrame++;
        currentScore += scoreIncrement;
        scoreElement.textContent = Math.round(currentScore);

        if (currentFrame < totalFrames) {
            requestAnimationFrame(update);
        } else {
            scoreElement.textContent = endScore;
        }
    }

    requestAnimationFrame(update);
}

async function runMatchCycle(initialTilesToClear, specialTilesToCreate = []) {
    let tilesToClear = new Set(initialTilesToClear);

    multiplier = 1;
    updateScoreDisplay();

    let active = true;
    while (active) {
        if (multiplier > 1) {
            showComboPopup(multiplier);
            gameBoard.classList.add('board-shaking');
            setTimeout(() => {
                gameBoard.classList.remove('board-shaking');
            }, 300);
        }

        const activatedTiles = await activateSpecialTiles(tilesToClear);
        tilesToClear = activatedTiles;

        const points = tilesToClear.size * 10 * multiplier;
        const startScore = score;
        score += points;
        animateScoreUpdate(startScore, score);
        specialMeter += tilesToClear.size;
        updateSpecialMeter();

        if (points > 0) {
            playSound(soundMatch);
            showScorePopup(points, tilesToClear);
        }

        if (score >= scoreToNextLevel) {
            level++;
            scoreToNextLevel = Math.floor(1000 * Math.pow(1.5, level - 1));
            showLevelUpPopup();
            if (level === 5) {
                tileTypes.push('grey');
            }
        }

        if (specialMeter >= specialMeterMax) {
            specialMeter -= specialMeterMax;
            createRandomSpecialTile();
            updateSpecialMeter();
        }

        updateScoreDisplay();

        const creationPositions = new Set();
        if (specialTilesToCreate.length > 0 && specialTilesToCreate[0].pos) {
             specialTilesToCreate.forEach(st => creationPositions.add(`${st.pos.row}-${st.pos.col}`));
        }
        const finalTilesToRemove = new Set([...tilesToClear].filter(pos => !creationPositions.has(pos)));

        await removeMatches(finalTilesToRemove);
        await createSpecialTiles(specialTilesToCreate);
        specialTilesToCreate = [];

        await shiftTilesDown();
        await fillNewTiles();

        const nextMatchInfo = checkForMatches();
        if (nextMatchInfo.toRemove.size > 0) {
            tilesToClear = nextMatchInfo.toRemove;
            specialTilesToCreate = nextMatchInfo.toCreate;
            if (specialTilesToCreate.length > 0) {
                let cascadeCreationPos = null;
                for (const pos of tilesToClear) {
                    const [r, c] = pos.split('-').map(Number);
                    if (!isSpecial(board[r][c])) {
                        cascadeCreationPos = { row: r, col: c };
                        break;
                    }
                }
                if (!cascadeCreationPos) {
                    const firstMatchPos = tilesToClear.values().next().value;
                    const [row, col] = firstMatchPos.split('-').map(Number);
                    cascadeCreationPos = { row, col };
                }
                specialTilesToCreate.forEach(st => st.pos = cascadeCreationPos);
            }
            multiplier++;
        } else {
            active = false;
        }
    }
    multiplier = 1;

    if (!checkForPossibleMoves()) {
        handleGameOver();
    }
}

function restartGame() {
    score = 0;
    multiplier = 1;
    level = 1;
    scoreToNextLevel = 1000;
    updateScoreDisplay();
    gameOverOverlay.classList.add('hidden');
    gameBoard.style.pointerEvents = 'auto';
    initializeBoard();
    renderBoard();
}

playAgainBtn.addEventListener('click', restartGame);


async function activateSpecialTiles(tilesToClear) {
    let newTilesFound = true;
    while(newTilesFound) {
        newTilesFound = false;
        const currentTiles = [...tilesToClear];
        for (const tilePos of currentTiles) {
            const [row, col] = tilePos.split('-').map(Number);
            const tileType = getTileType(row, col);

            if (isSpecial(tileType)) {
                let affectedTiles = [];
                if (tileType.includes('line-bomb-h')) {
                    playSound(soundLineBomb);
                    for (let c = 0; c < boardSize; c++) affectedTiles.push(`${row}-${c}`);
                }
                if (tileType.includes('line-bomb-v')) {
                    playSound(soundLineBomb);
                    for (let r = 0; r < boardSize; r++) affectedTiles.push(`${r}-${col}`);
                }
                if (tileType.includes('bomb')) {
                    playSound(soundBomb);
                    for (let r = Math.max(0, row - 1); r <= Math.min(boardSize - 1, row + 1); r++) {
                        for (let c = Math.max(0, col - 1); c <= Math.min(boardSize - 1, c + 1); c++) {
                            affectedTiles.push(`${r}-${c}`);
                        }
                    }
                }

                for (const affected of affectedTiles) {
                    if (!tilesToClear.has(affected)) {
                        tilesToClear.add(affected);
                        newTilesFound = true;
                    }
                }
            }
        }
    }
    return tilesToClear;
}

function createSpecialTiles(tilesToCreate) {
    if (!tilesToCreate || tilesToCreate.length === 0) return;

    tilesToCreate.forEach(st => {
        if (st.pos) {
            const { row, col } = st.pos;
            const newType = st.type === 'rainbow-bomb' ? 'rainbow-bomb' : `${st.color}-${st.type}`;
            board[row][col] = newType;

            const tileElement = document.querySelector(`.tile[data-row='${row}'][data-col='${col}']`);
            if(tileElement) {
                tileElement.className = 'tile';
                tileElement.style.backgroundColor = '';
                const imageIndex = Math.floor(Math.random() * 2) + 1;
                if (newType.includes('line-bomb-h')) {
                    tileElement.style.backgroundImage = `url(images/line-h-${imageIndex}.png)`;
                } else if (newType.includes('line-bomb-v')) {
                    tileElement.style.backgroundImage = `url(images/line-v-${imageIndex}.png)`;
                } else if (newType.includes('bomb')) {
                    tileElement.style.backgroundImage = `url(images/bomb-${imageIndex}.png)`;
                } else if (newType === 'rainbow-bomb') {
                    tileElement.classList.add('rainbow-bomb');
                } else {
                    tileElement.style.backgroundColor = st.color;
                }
            }
        }
    });
}

function showComboPopup(multiplier) {
    const comboTexts = ['Combo', 'Super', 'Awesome', 'Excellent', 'Unbelievable!'];
    const text = `${comboTexts[Math.min(multiplier - 2, comboTexts.length - 1)]} x${multiplier}!`;

    const popup = document.createElement('div');
    popup.textContent = text;
    popup.classList.add('combo-popup');
    gameBoard.appendChild(popup);

    setTimeout(() => { popup.remove(); }, 1000);
}

function createParticles(x, y, color) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.backgroundColor = color;
        const size = Math.random() * 10 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 40 + 20;
        particle.style.setProperty('--x', `${x + Math.cos(angle) * distance}px`);
        particle.style.setProperty('--y', `${y + Math.sin(angle) * distance}px`);
        gameBoard.appendChild(particle);
        setTimeout(() => {
            particle.remove();
        }, 800);
    }
}

function createSpecialCombinationParticles(x, y) {
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 15 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 80 + 40;
        particle.style.setProperty('--x', `${x + Math.cos(angle) * distance}px`);
        particle.style.setProperty('--y', `${y + Math.sin(angle) * distance}px`);
        gameBoard.appendChild(particle);
        setTimeout(() => {
            particle.remove();
        }, 1200);
    }

    const shockwave = document.createElement('div');
    shockwave.classList.add('shockwave');
    shockwave.style.left = `${x}px`;
    shockwave.style.top = `${y}px`;
    gameBoard.appendChild(shockwave);
    setTimeout(() => {
        shockwave.remove();
    }, 500);
}

function removeMatches(tilesToRemove) {
    tilesToRemove.forEach(pos => {
        const [row, col] = pos.split('-').map(Number);
        const tile = document.querySelector(`.tile[data-row='${row}'][data-col='${col}']`);
        if (tile) {
            createParticles(col * 52 + 25, row * 52 + 25, tile.style.backgroundColor);
            tile.classList.add('disappearing');
            board[row][col] = null;
        }
    });

    return new Promise(resolve => setTimeout(() => {
        document.querySelectorAll('.disappearing').forEach(tile => tile.remove());
        resolve();
    }, 300));
}

async function shiftTilesDown() {
    for (let col = 0; col < boardSize; col++) {
        let emptySpaces = 0;
        for (let row = boardSize - 1; row >= 0; row--) {
            if (board[row][col] === null) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                const tileElement = document.querySelector(`.tile[data-row='${row}'][data-col='${col}']`);
                if (tileElement) {
                    const newRow = row + emptySpaces;
                    board[newRow][col] = board[row][col];
                    board[row][col] = null;
                    tileElement.dataset.row = newRow;
                    tileElement.style.top = `${newRow * 52}px`;
                }
            }
        }
    }
    return new Promise(res => setTimeout(res, 300));
}

async function fillNewTiles() {
    const promises = [];
    for (let col = 0; col < boardSize; col++) {
        for (let row = boardSize - 1; row >= 0; row--) {
            if (board[row][col] === null) {
                const newTileType = tileTypes[Math.floor(Math.random() * tileTypes.length)];
                board[row][col] = newTileType;
                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.style.backgroundColor = newTileType;
                tile.dataset.row = row;
                tile.dataset.col = col;
                tile.style.left = `${col * 52}px`;
                tile.style.top = `${-52}px`;
                gameBoard.appendChild(tile);
                
                const promise = new Promise(res => setTimeout(() => {
                    tile.style.top = `${row * 52}px`;
                    res();
                }, 200));
                promises.push(promise);
            }
        }
    }
    await Promise.all(promises);
}

function checkForMatches() {
    const toRemove = new Set();
    const toCreate = [];
    const colorBoard = board.map(row => row.map(tile => tile ? tile.split('-')[0] : null));

    const horizontalChains = [];
    const verticalChains = [];

    // Find horizontal chains of 3+
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize - 2; c++) {
            if (!colorBoard[r][c]) continue;
            let chain = [{r,c}];
            for (let k = c + 1; k < boardSize; k++) {
                if (colorBoard[r][k] === colorBoard[r][c]) chain.push({r,c:k});
                else break;
            }
            if (chain.length >= 3) {
                horizontalChains.push(chain);
                c += chain.length - 1;
            }
        }
    }

    // Find vertical chains of 3+
    for (let c = 0; c < boardSize; c++) {
        for (let r = 0; r < boardSize - 2; r++) {
            if (!colorBoard[r][c]) continue;
            let chain = [{r,c}];
            for (let k = r + 1; k < boardSize; k++) {
                if (colorBoard[k][c] === colorBoard[r][c]) chain.push({r:k,c});
                else break;
            }
            if (chain.length >= 3) {
                verticalChains.push(chain);
                r += chain.length - 1;
            }
        }
    }

    const allChains = [...horizontalChains, ...verticalChains];
    const processedChains = new Set();

    // Process L/T shapes
    for (const hChain of horizontalChains) {
        for (const vChain of verticalChains) {
            const hSet = new Set(hChain.map(p => `${p.r}-${p.c}`));
            const vSet = new Set(vChain.map(p => `${p.r}-${p.c}`));
            const intersection = new Set([...hSet].filter(x => vSet.has(x)));
            if (intersection.size > 0) {
                const color = colorBoard[hChain[0].r][hChain[0].c];
                toCreate.push({type: 'bomb', color: color});
                const hChainStr = hChain.map(p => `${p.r}-${p.c}`).join(',');
                const vChainStr = vChain.map(p => `${p.r}-${p.c}`).join(',');
                processedChains.add(hChainStr);
                processedChains.add(vChainStr);
            }
        }
    }

    // Process straight line matches
    for (const chain of allChains) {
        const chainString = chain.map(p => `${p.r}-${p.c}`).join(',');
        if (processedChains.has(chainString)) continue;

        const color = colorBoard[chain[0].r][chain[0].c];
        if (chain.length === 4) {
            const type = horizontalChains.some(c => c.map(p => `${p.r}-${p.c}`).join(',') === chainString) ? 'line-bomb-h' : 'line-bomb-v';
            toCreate.push({type, color});
        } else if (chain.length >= 5) {
            toCreate.push({type: 'rainbow-bomb', color: 'rainbow'});
        }
    }
    
    // Get tiles to remove
    allChains.forEach(chain => {
        chain.forEach(p => {
            toRemove.add(`${p.r}-${p.c}`);
        });
    });

    return { toRemove, toCreate };
}

function getTileType(row, col) {
    return board[row] ? board[row][col] : null;
}

function isSpecial(tileType) {
    return tileType && tileType.includes('-');
}

function isAdjacent(row1, col1, row2, col2) {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

async function swapTiles(row1, col1, row2, col2) {
    playSound(soundSwap);
    const tile1 = document.querySelector(`.tile[data-row='${row1}'][data-col='${col1}']`);
    const tile2 = document.querySelector(`.tile[data-row='${row2}'][data-col='${col2}']`);

    const tempType = board[row1][col1];
    board[row1][col1] = board[row2][col2];
    board[row2][col2] = tempType;

    if (tile1 && tile2) {
        const tile1Top = tile1.style.top;
        const tile1Left = tile1.style.left;
        tile1.style.top = tile2.style.top;
        tile1.style.left = tile2.style.left;
        tile2.style.top = tile1Top;
        tile2.style.left = tile1Left;

        const tempRow = tile1.dataset.row;
        tile1.dataset.row = tile2.dataset.row;
        tile2.dataset.row = tempRow;

        const tempCol = tile1.dataset.col;
        tile1.dataset.col = tile2.dataset.col;
        tile2.dataset.col = tempCol;
    }

    return new Promise(resolve => setTimeout(resolve, 300));
}