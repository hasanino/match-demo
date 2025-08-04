// 3-match parameters
const MATCH_COLS = 6;
const MATCH_ROWS = 7;
const MATCH_COLORS = ["red", "green", "blue", "yellow", "magenta"];
const MIN_MATCH = 3;

const bottomGrid = document.getElementById('bottom-grid');
let board = [];
let selected = null;

function getMatchXP(size) {
    if (size === 3) return 1;
    if (size === 4) return 2;
    if (size === 5) return 3;
    if (size >= 6) return 6;
    return 0;
}

// Utility
function randColor() {
    return MATCH_COLORS[Math.floor(Math.random() * MATCH_COLORS.length)];
}

// Make sure there is at least one match or possible swap
function canSwapExists(b) {
    // Look for any possible swap that creates a match
    for (let r = 0; r < MATCH_ROWS; ++r) {
        for (let c = 0; c < MATCH_COLS; ++c) {
            // Try right swap
            if (c < MATCH_COLS - 1) {
                swapCells(b, r, c, r, c+1);
                if (hasAnyMatches(b)) { swapCells(b, r, c, r, c+1); return true; }
                swapCells(b, r, c, r, c+1);
            }
            // Try down swap
            if (r < MATCH_ROWS - 1) {
                swapCells(b, r, c, r+1, c);
                if (hasAnyMatches(b)) { swapCells(b, r, c, r+1, c); return true; }
                swapCells(b, r, c, r+1, c);
            }
        }
    }
    return false;
}

// Check if any matches exist on board
function hasAnyMatches(b) {
    // Horizontal
    for (let r = 0; r < MATCH_ROWS; ++r) {
        let count = 1;
        for (let c = 1; c < MATCH_COLS; ++c) {
            if (b[r][c] && b[r][c] === b[r][c-1]) count++;
            else count = 1;
            if (count >= MIN_MATCH) return true;
        }
    }
    // Vertical
    for (let c = 0; c < MATCH_COLS; ++c) {
        let count = 1;
        for (let r = 1; r < MATCH_ROWS; ++r) {
            if (b[r][c] && b[r][c] === b[r-1][c]) count++;
            else count = 1;
            if (count >= MIN_MATCH) return true;
        }
    }
    return false;
}

// Fill board with randoms, but guarantee at least one possible move
function fillBoard() {
    do {
        board = [];
        for (let r = 0; r < MATCH_ROWS; ++r) {
            let row = [];
            for (let c = 0; c < MATCH_COLS; ++c) {
                let color;
                do {
                    color = randColor();
                } while (
                    (c > 1 && color === row[c-1] && color === row[c-2]) ||
                    (r > 1 && color === board[r-1][c] && color === board[r-2][c])
                );
                row.push(color);
            }
            board.push(row);
        }
    } while (!canSwapExists(board));
}

function renderBoard() {
    bottomGrid.innerHTML = "";
    for (let r = 0; r < MATCH_ROWS; ++r) {
        for (let c = 0; c < MATCH_COLS; ++c) {
            const cell = document.createElement('div');
            cell.className = 'match-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            if (selected && selected.r === r && selected.c === c) cell.classList.add("selected");

            const block = document.createElement('div');
            block.className = 'match-block ' + board[r][c];

            cell.appendChild(block);
            cell.addEventListener('click', () => handleCellClick(r, c));
            bottomGrid.appendChild(cell);
        }
    }
}

function handleCellClick(r, c) {
    if (!selected) {
        selected = {r, c};
        renderBoard();
        return;
    }
    // Only allow swap with neighbor
    if (Math.abs(selected.r - r) + Math.abs(selected.c - c) === 1) {
        swapCells(board, selected.r, selected.c, r, c);
        if (findAndClearMatches()) {
            selected = null;
            setTimeout(() => {
                refillAndResolve();
            }, 200);
        } else {
            // Not a valid move, swap back
            swapCells(board, selected.r, selected.c, r, c);
            selected = null;
        }
        renderBoard();
    } else {
        selected = {r, c};
        renderBoard();
    }
}

function swapCells(b, r1, c1, r2, c2) {
    let tmp = b[r1][c1];
    b[r1][c1] = b[r2][c2];
    b[r2][c2] = tmp;
}

function findAndClearMatches() {
    let matched = [];
    // Horizontal matches
    for (let r = 0; r < MATCH_ROWS; ++r) {
        let count = 1;
        for (let c = 1; c <= MATCH_COLS; ++c) {
            if (c < MATCH_COLS && board[r][c] === board[r][c-1]) {
                count++;
            } else {
                if (count >= MIN_MATCH) {
                    for (let k = 0; k < count; ++k) matched.push({r, c: c-1-k});
                }
                count = 1;
            }
        }
    }
    // Vertical matches
    for (let c = 0; c < MATCH_COLS; ++c) {
        let count = 1;
        for (let r = 1; r <= MATCH_ROWS; ++r) {
            if (r < MATCH_ROWS && board[r][c] === board[r-1][c]) {
                count++;
            } else {
                if (count >= MIN_MATCH) {
                    for (let k = 0; k < count; ++k) matched.push({r: r-1-k, c});
                }
                count = 1;
            }
        }
    }

    if (matched.length) {
        // Find which colors were matched and where
        const colorToRects = {};
        matched.forEach(({r, c}) => {
            let idx = r * MATCH_COLS + c;
            let cell = bottomGrid.children[idx];
            if (cell && cell.firstChild) {
                let color = board[r][c];
                if (!colorToRects[color]) colorToRects[color] = [];
                colorToRects[color].push(cell.firstChild.getBoundingClientRect());
                cell.firstChild.classList.add("clearing");
            }
        });

        /***************************************/
        // After you have your board and before you clear anything:

        const colorXP = {};

        // Horizontal match groups
        for (let r = 0; r < MATCH_ROWS; ++r) {
            let count = 1;
            for (let c = 1; c <= MATCH_COLS; ++c) {
                if (c < MATCH_COLS && board[r][c] === board[r][c - 1]) {
                    count++;
                } else {
                    if (count >= 3) {
                        let color = board[r][c - 1];
                        const xp = getMatchXP(count);
                        if (colorXP[color]) colorXP[color] += xp;
                        else colorXP[color] = xp;
                    }
                    count = 1;
                }
            }
        }

        // Vertical match groups
        for (let c = 0; c < MATCH_COLS; ++c) {
            let count = 1;
            for (let r = 1; r <= MATCH_ROWS; ++r) {
                if (r < MATCH_ROWS && board[r][c] === board[r - 1][c]) {
                    count++;
                } else {
                    if (count >= 3) {
                        let color = board[r - 1][c];
                        const xp = getMatchXP(count);
                        if (colorXP[color]) colorXP[color] += xp;
                        else colorXP[color] = xp;
                    }
                    count = 1;
                }
            }
        }

        // Award XP per color
        Object.entries(colorXP).forEach(([color, xp]) => {
            if (window.gainFactoryBuildingXP) window.gainFactoryBuildingXP(color, xp);
        });
        /***************************************/



        // Launch particles and bounce in the background, do NOT wait for them
        Object.entries(colorToRects).forEach(([color, rects]) => {
            if (window.flyParticlesToBuilding) {
                window.flyParticlesToBuilding(color, rects, () => {
                    if (window.bounceFactoryBuilding) window.bounceFactoryBuilding(color);
                });
            }
        });

        // Immediately continue with the normal clearing/refill logic (no delay!)
        setTimeout(() => {
            matched.forEach(({r, c}) => board[r][c] = null);
            collapseAndRefill();
            setTimeout(() => {
                if (findAndClearMatches()) {
                    setTimeout(refillAndResolve, 150);
                }
            }, 80);
        }, 160); // keep short delay only for clearing/fade
        return true;
    }


    return false;
}

function collapseAndRefill() {
    // Collapse blocks
    for (let c = 0; c < MATCH_COLS; ++c) {
        for (let r = MATCH_ROWS-1; r >= 0; --r) {
            if (!board[r][c]) {
                for (let k = r-1; k >= 0; --k) {
                    if (board[k][c]) {
                        board[r][c] = board[k][c];
                        board[k][c] = null;
                        break;
                    }
                }
            }
        }
    }
    // Fill new blocks
    for (let r = 0; r < MATCH_ROWS; ++r) {
        for (let c = 0; c < MATCH_COLS; ++c) {
            if (!board[r][c]) board[r][c] = randColor();
        }
    }
    renderBoard();
}

function refillAndResolve() {
    renderBoard();
    // After refill, check if deadlocked; if so, shuffle until at least one move is possible
    let tries = 0;
    while (!canSwapExists(board)) {
        shuffleBoard();
        tries++;
        if (tries > 20) break; // fallback
    }
    renderBoard();
}

function shuffleBoard() {
    let all = [];
    for (let r = 0; r < MATCH_ROWS; ++r)
        for (let c = 0; c < MATCH_COLS; ++c)
            all.push(board[r][c]);
    for (let i = all.length - 1; i > 0; --i) {
        let j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
    }
    for (let r = 0, k = 0; r < MATCH_ROWS; ++r)
        for (let c = 0; c < MATCH_COLS; ++c, ++k)
            board[r][c] = all[k];
}

window.addEventListener('DOMContentLoaded', () => {
    fillBoard();
    renderBoard();
});
