const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const multiplierElement = document.getElementById('multiplier');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreElement = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again-btn');

const boardSize = 8;
const tileTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
let board = [];
let score = 0;
let multiplier = 1;
let selectedTile = null;

function updateScoreDisplay() {
    scoreElement.textContent = score;
    multiplierElement.textContent = multiplier;
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
                if (tempB[r][c] && tempB[r][c] === tempB[r + 1][c] && tempB[r][c] === tempB[r + 2][c]) {
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

shuffleBoard();
updateScoreDisplay();

gameBoard.addEventListener('click', async (e) => {
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
    // レインボーボムのスワップ処理
    const tile1Type = getTileType(row1, col1);
    const tile2Type = getTileType(row2, col2);
    if (tile1Type === 'rainbow-bomb' || tile2Type === 'rainbow-bomb') {
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

async function runMatchCycle(initialTilesToClear, specialTilesToCreate = []) {
    let tilesToClear = new Set(initialTilesToClear);

    multiplier = 1;
    updateScoreDisplay();

    let active = true;
    while (active) {
        if (multiplier > 1) {
            showComboPopup(multiplier);
            gameBoard.classList.add('board-shaking');
            multiplierElement.classList.add('scaling');
            setTimeout(() => {
                gameBoard.classList.remove('board-shaking');
                multiplierElement.classList.remove('scaling');
            }, 300);
        }

        const activatedTiles = await activateSpecialTiles(tilesToClear);
        tilesToClear = activatedTiles;

        const points = tilesToClear.size * 10 * multiplier;
        score += points;
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
        shuffleBoard();
        if (!checkForPossibleMoves()) {
            handleGameOver();
        }
    }
}

function restartGame() {
    score = 0;
    multiplier = 1;
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
                    for (let c = 0; c < boardSize; c++) affectedTiles.push(`${row}-${c}`);
                }
                if (tileType.includes('line-bomb-v')) {
                    for (let r = 0; r < boardSize; r++) affectedTiles.push(`${r}-${col}`);
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
                tileElement.style.backgroundColor = st.color;
                if(newType.includes('line-bomb-h')) tileElement.classList.add('line-bomb-h');
                if(newType.includes('line-bomb-v')) tileElement.classList.add('line-bomb-v');
                if(newType === 'rainbow-bomb') {
                    tileElement.classList.add('rainbow-bomb');
                    tileElement.style.backgroundColor = '';
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

function removeMatches(tilesToRemove) {
    tilesToRemove.forEach(pos => {
        const [row, col] = pos.split('-').map(Number);
        const tile = document.querySelector(`.tile[data-row='${row}'][data-col='${col}']`);
        if (tile) {
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

    for (const hChain of horizontalChains) {
        for (const vChain of verticalChains) {
            const hSet = new Set(hChain.map(p => `${p.r}-${p.c}`));
            const vSet = new Set(vChain.map(p => `${p.r}-${p.c}`));
            const intersection = new Set([...hSet].filter(x => vSet.has(x)));
            if (intersection.size > 0) {
                const color = colorBoard[hChain[0].r][hChain[0].c];
                toCreate.push({type: 'line-bomb-v', color: color});
                hChain.forEach(p => toRemove.add(`${p.r}-${p.c}`));
                vChain.forEach(p => toRemove.add(`${p.r}-${p.c}`));
                processedChains.add(hChain).add(vChain);
            }
        }
    }

    for (const chain of allChains) {
        if (processedChains.has(chain)) continue;
        const color = colorBoard[chain[0].r][chain[0].c];
        chain.forEach(p => toRemove.add(`${p.r}-${p.c}`));
        if (chain.length === 4) {
            const type = horizontalChains.includes(chain) ? 'line-bomb-h' : 'line-bomb-v';
            toCreate.push({type, color});
        }
        if (chain.length >= 5) {
            toCreate.push({type: 'rainbow-bomb', color: 'rainbow'});
        }
    }

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