const TOP_GRID_COLS = 5, TOP_GRID_ROWS = 5;    // Matches your uploaded grid.css
const BOTTOM_GRID_COLS = 6, BOTTOM_GRID_ROWS = 7;

const topGrid = document.getElementById('top-grid');
//const bottomGrid = document.getElementById('bottom-grid');

function renderGrid(gridEl, cols, rows, cellClass) {
    gridEl.innerHTML = '';
    for (let r = 0; r < rows; ++r) {
        for (let c = 0; c < cols; ++c) {
            const cell = document.createElement('div');
            cell.className = cellClass;
            cell.dataset.row = r;
            cell.dataset.col = c;
            gridEl.appendChild(cell);
        }
    }
}


window.currency = 0;

function fmt1(x) {
    return Number.isInteger(x) ? x.toString() : x.toFixed(1).replace(/\.0$/, "");
}

function setCurrency(val) {
    window.currency = val;
    document.getElementById('currency-amount').textContent = val;
}
window.setCurrency = setCurrency;


window.addEventListener('DOMContentLoaded', () => {
    // Render static top grid
    renderGrid(topGrid, TOP_GRID_COLS, TOP_GRID_ROWS, 'grid-cell');

    setCurrency(0);
    // Do NOT render the bottom grid here; 3match.js will handle #bottom-grid setup!
});
