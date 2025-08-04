// Factory mechanic for the top grid

const FACTORY_COLS = 5, FACTORY_ROWS = 5;
const FACTORY_COLORS = ["red", "green", "blue", "yellow", "magenta"];
//const topGrid = document.getElementById('top-grid');

window.factoryBuildings = {};

// Initialize all to level 1, 0 xp
function initFactoryBuildings() {
    window.factoryBuildings = {};
    document.querySelectorAll('#top-grid .building').forEach(building => {
        let color = FACTORY_COLORS.find(col => building.classList.contains(col));
        if (color) {
            window.factoryBuildings[color] = {
                level: 1,
                xp: 0,
                xpForLevel: 6, // Default XP for level up, can scale with level
                building,
                bar: building.parentNode.querySelector('.factory-progress-bar-inner'),
            };
            // Reset bar visual to 0
            if (window.factoryBuildings[color].bar) {
                window.factoryBuildings[color].bar.style.width = '0%';
            }
        }
    });
}

window.initFactoryBuildings = initFactoryBuildings;

// Level up handler (customize for more effects)
function onFactoryBuildingLevelUp(color) {
    window.factoryBuildings[color].level += 1;
    window.factoryBuildings[color].xpForLevel = 6 + 2 * (window.factoryBuildings[color].level - 1);
    // Update level label
    const b = window.factoryBuildings[color].building;
    if (b) {
        const label = b.querySelector('.building-level-label');
        if (label) label.textContent = 'Lvl ' + window.factoryBuildings[color].level;
    }
}


window.onFactoryBuildingLevelUp = onFactoryBuildingLevelUp;

// Gain XP and update bar
function gainFactoryBuildingXP(color, points) {
    let buildingData = window.factoryBuildings[color];
    if (!buildingData) return;
    buildingData.xp += points;

    // Level up if full or over
    while (buildingData.xp >= buildingData.xpForLevel) {
        buildingData.xp -= buildingData.xpForLevel;
        onFactoryBuildingLevelUp(color);
    }
    // Update bar visual
    const percent = (buildingData.xp / buildingData.xpForLevel) * 100;
    if (buildingData.bar) {
        buildingData.bar.style.width = percent + '%';
    }
}
window.gainFactoryBuildingXP = gainFactoryBuildingXP;

// Utility to check adjacency (horizontal/vertical)
function areAdjacent(a, b) {
    return (Math.abs(a.r - b.r) + Math.abs(a.c - b.c)) === 1;
}

// Find random positions for each color, ensuring no two are adjacent
function getNonAdjacentPositions(cols, rows, count) {
    let attempts = 0;
    while (attempts < 500) {
        let positions = [];
        let used = Array.from({length: rows}, () => Array(cols).fill(false));
        for (let i = 0; i < count; ++i) {
            // Gather all empty and non-adjacent-to-used positions, not in first/last row
            let possible = [];
            for (let r = 1; r < rows - 1; ++r) { // <-- start at 1, end at rows-2
                for (let c = 0; c < cols; ++c) {
                    if (used[r][c]) continue;
                    let adj = false;
                    for (let dr = -1; dr <= 1; ++dr) for (let dc = -1; dc <= 1; ++dc) {
                        if (Math.abs(dr) + Math.abs(dc) !== 1) continue;
                        let nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && used[nr][nc])
                            adj = true;
                    }
                    if (!adj) possible.push({r, c});
                }
            }
            if (!possible.length) break;
            let choice = possible[Math.floor(Math.random() * possible.length)];
            positions.push(choice);
            used[choice.r][choice.c] = true;
        }
        if (positions.length === count) return positions;
        attempts++;
    }
    return null;
}

function onDroppingCoinArrive(coin) {
    // Animate value transfer with particles!
    const value = parseInt(coin.dataset.value || "1", 10);
    const startRect = coin.getBoundingClientRect();
    const currencyIcon = document.querySelector('.currency-coin-icon');
    const endRect = currencyIcon.getBoundingClientRect();

    // For each point, animate a particle
    let arrived = 0;
    for (let i = 0; i < value; ++i) {
        // Small random offset to avoid perfect overlap
        const offsetX = (Math.random()-0.5) * 12;
        const offsetY = (Math.random()-0.5) * 12;

        const particle = document.createElement('div');
        particle.className = 'particle-fly coin-particle';
        particle.style.background = coin.style.background; // match coin color
        particle.style.width = particle.style.height = "16px";
        particle.style.left = `${startRect.left + startRect.width/2 - 8 + offsetX}px`;
        particle.style.top  = `${startRect.top + startRect.height/2 - 8 + offsetY}px`;
        particle.style.opacity = 1;
        particle.style.zIndex = 2000;
        document.body.appendChild(particle);

        // Animate to currency icon center
        const endX = endRect.left + endRect.width/2 - (startRect.left + startRect.width/2) - 8;
        const endY = endRect.top + endRect.height/2 - (startRect.top + startRect.height/2) - 8;

        // Animate
        setTimeout(() => {
            particle.style.transform = `translate(${endX}px, ${endY}px) scale(1.15)`;
        }, 16);

        // When arrived, remove and count
        setTimeout(() => {
            particle.style.opacity = 0;
            setTimeout(() => {
                particle.remove();
                arrived++;
                if (arrived === value) {
                    // Update player_coins after all arrive!
                    setCurrency(window.currency + value);
                }
            }, 180);
        }, 750);
    }

    // Remove the actual dropping coin immediately (visual only)
    coin.remove();
}


function renderFactoryBuildings() {
    // Remove old buildings if any
    document.querySelectorAll('#top-grid .building').forEach(el => el.remove());

    const positions = getNonAdjacentPositions(FACTORY_COLS, FACTORY_ROWS, FACTORY_COLORS.length);
    if (!positions) return; // fallback: can't place
    positions.forEach((pos, idx) => {
        // Get cell index
        let cellIdx = pos.r * FACTORY_COLS + pos.c;
        const cell = topGrid.children[cellIdx];
        if (!cell) return;
        const building = document.createElement('div');
        building.className = 'building ' + FACTORY_COLORS[idx];

        // Level label
        const lvlSpan = document.createElement('span');
        lvlSpan.className = 'building-level-label';
        lvlSpan.textContent = 'Lvl 1'; // Start at 1
        building.appendChild(lvlSpan);

        // Progress bar
        const bar = document.createElement('div');
        bar.className = 'factory-progress-bar';
        const barInner = document.createElement('div');
        barInner.className = 'factory-progress-bar-inner';
        bar.appendChild(barInner);

        // Container for vertical stacking
        const stack = document.createElement('div');
        stack.className = 'factory-stack';

        stack.appendChild(building);
        stack.appendChild(bar);
        cell.appendChild(stack);

        //cell.appendChild(building);

        window.initFactoryBuildings();
    });
}
function bounceFactoryBuilding(color) {
    // Find building div in top grid with class matching the color
    const building = document.querySelector(`#top-grid .building.${color}`);
    if (building) {
        building.classList.remove('bounce'); // Reset if already bouncing
        // Force reflow to allow retriggering animation
        void building.offsetWidth;
        building.classList.add('bounce');
    }


}
window.bounceFactoryBuilding = bounceFactoryBuilding; // Make available to 3match.js

window.addEventListener('DOMContentLoaded', renderFactoryBuildings);

window.flyParticlesToBuilding = function(color, fromRects, onComplete) {
    // Get target building position
    const building = document.querySelector(`#top-grid .building.${color}`);
    if (!building) return onComplete && onComplete();
    const targetRect = building.getBoundingClientRect();
    let arrived = 0;
    fromRects.forEach(fromRect => {
        const particle = document.createElement('div');
        particle.className = `particle-fly ${color}`;
        const size = Math.max(14, Math.floor(fromRect.width * 0.4));
        // Start at center of fromRect
        particle.style.width = particle.style.height = `${size}px`;
        particle.style.left = `${fromRect.left + fromRect.width/2 - size/2}px`;
        particle.style.top  = `${fromRect.top + fromRect.height/2 - size/2}px`;
        particle.style.opacity = 1;
        document.body.appendChild(particle);

        // Calculate offset to building center
        const targetX = targetRect.left + targetRect.width/2 - size/2;
        const targetY = targetRect.top  + targetRect.height/2 - size/2;

        // Force reflow then move
        void particle.offsetWidth;
        particle.style.transform = `translate(${targetX - (fromRect.left + fromRect.width/2 - size/2)}px, ${targetY - (fromRect.top + fromRect.height/2 - size/2)}px)`;

        // After travel, fade out and remove
        setTimeout(() => {
            particle.style.opacity = 0;
            setTimeout(() => {
                particle.remove();
                arrived++;
                if (arrived === fromRects.length && onComplete) onComplete();
            }, 210);
        }, 650);
    });
    // If no rects, call onComplete instantly
    if (!fromRects.length && onComplete) onComplete();
};

let coinDropInterval = null;

function dropCoin() {
    const factoryArea = document.getElementById('factory_area');
    const topGrid = document.getElementById('top-grid');
    const coinOutput = document.getElementById('coin_output');

    // Find the source cell (top row, 3rd column, index 2)
    const COLS = 5;
    const startRow = 0, startCol = 2;
    const startCellIdx = startRow * COLS + startCol;
    const startCell = topGrid.children[startCellIdx];

    if (!startCell) return;

    // Get bounding rects (relative to viewport)
    const startRect = startCell.getBoundingClientRect();
    const outputRect = coinOutput.getBoundingClientRect();

    // Find relative positions to the factory area
    const areaRect = factoryArea.getBoundingClientRect();

    const coinSize = 20;
    const startX = startRect.left + startRect.width/2 - areaRect.left;
    const startY = startRect.top - coinSize/2 - areaRect.top; // half above the cell

    const endX = outputRect.left + outputRect.width/2 - areaRect.left;
    const endY = outputRect.top - coinSize - coinSize/2 - areaRect.top; // coin bottom touches output top


    // Create coin element
    const coin = document.createElement('div');
    coin.className = 'factory-coin dropping_coin';
    const coinValue = 1; // later you can change this value
    coin.dataset.value = coinValue;

    coin.style.left = `${startX - coinSize/2}px`;
    coin.style.top  = `${startY}px`;

    factoryArea.appendChild(coin);

    // Animate to output
    setTimeout(() => {
        coin.style.transform = `translate(${endX - startX}px, ${endY - startY}px)`;
    }, 300);

    // Remove coin after arriving
    setTimeout(() => {
        coin.style.opacity = 0;
        setTimeout(() => {
            onDroppingCoinArrive(coin);
        }, 300);
    }, 1400);
}

// Start dropping a coin every second at game start
window.startCoinDrop = function() {
    if (coinDropInterval) clearInterval(coinDropInterval);
    coinDropInterval = setInterval(dropCoin, 3000);
};
window.stopCoinDrop = function() {
    if (coinDropInterval) clearInterval(coinDropInterval);
};

window.addEventListener('DOMContentLoaded', () => {
    window.startCoinDrop();
});

function renderFactoryUpdates() {
    const container = document.getElementById('factory_updates');
    if (!container) return;
    container.innerHTML = '';

    // Coin button
    const coinBtn = document.createElement('button');
    coinBtn.className = 'update-btn';
    coinBtn.innerHTML = `<span class="update-icon coin"></span> <span>Coin</span>`;
    container.appendChild(coinBtn);

    // One for each building color
    FACTORY_COLORS.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'update-btn';
        btn.innerHTML = `<span class="update-icon ${color}"></span> <span>${color[0].toUpperCase()+color.slice(1)}</span>`;
        container.appendChild(btn);
    });
}

// Call after rendering/reinitializing buildings:
renderFactoryUpdates();
