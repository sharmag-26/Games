(() => {
  const coinCountEl = document.getElementById('coinCount');
  const seedCountsEl = document.getElementById('seedCounts');
  const roundInfoEl = document.getElementById('roundInfo');
  const goalTextEl = document.getElementById('goalText');
  const statusTextEl = document.getElementById('statusText');

  const shopBtn = document.getElementById('shopBtn');
  const shopModal = document.getElementById('shopModal');
  const closeShop = document.getElementById('closeShop');
  const shopItemsEl = document.querySelector('.shopItems');

  const seedSelect = document.getElementById('seedSelect');
  const inventoryEl = document.getElementById('inventory');
  const garden = document.getElementById('gardenArea');
  const coinsLayer = document.getElementById('coinsLayer');
  const plantsLayer = document.getElementById('plantsLayer');
  const npcsLayer = document.getElementById('npcs');
  const playerEl = document.getElementById('player');

  const STORAGE_KEY = 'flower_garden_state_v2';
  const ROUND_SECONDS = 75;

  const seedTypes = {
    rose: { icon: 'R', cost: 5, growTime: 8, payout: 6 },
    tulip: { icon: 'T', cost: 3, growTime: 6, payout: 4 },
    sunflower: { icon: 'S', cost: 8, growTime: 10, payout: 9 }
  };

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
    coins: 12,
    seeds: { rose: 1, tulip: 2, sunflower: 0 },
    level: 1,
    bestLevel: 1
  };

  let roundStartMs = Date.now();
  let roundGoal = getGoalForLevel(state.level);
  let roundProgress = 0;

  function getGoalForLevel(level) {
    return 10 + level * 5;
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setStatus(message) {
    statusTextEl.textContent = message;
  }

  function renderHUD() {
    coinCountEl.textContent = state.coins;
    seedCountsEl.textContent = Object.entries(state.seeds)
      .map(([name, count]) => `${name}:${count}`)
      .join(' ');

    const secondsLeft = Math.max(
      0,
      ROUND_SECONDS - Math.floor((Date.now() - roundStartMs) / 1000)
    );

    roundInfoEl.textContent = `Level ${state.level} | Goal ${roundProgress}/${roundGoal} | Time ${secondsLeft}s`;
    goalTextEl.textContent = `${roundProgress}/${roundGoal}`;
  }

  function renderInventory() {
    inventoryEl.innerHTML = '';
    Object.keys(seedTypes).forEach((seedName) => {
      const item = document.createElement('div');
      item.textContent = `${seedTypes[seedName].icon} ${seedName}: ${state.seeds[seedName]}`;
      inventoryEl.appendChild(item);
    });
  }

  function setupShop() {
    shopItemsEl.innerHTML = '';
    seedSelect.innerHTML = '<option value="none">-- none --</option>';

    Object.keys(seedTypes).forEach((seedName) => {
      const seed = seedTypes[seedName];
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.margin = '8px 0';
      row.innerHTML = `<div>${seed.icon} <strong>${seedName}</strong> - ${seed.cost} coins</div>`;

      const buyBtn = document.createElement('button');
      buyBtn.textContent = 'Buy';
      buyBtn.onclick = () => {
        if (state.coins < seed.cost) {
          setStatus('Not enough coins. Collect more and try again.');
          return;
        }
        state.coins -= seed.cost;
        state.seeds[seedName] += 1;
        save();
        renderHUD();
        renderInventory();
        setStatus(`Bought 1 ${seedName} seed.`);
      };

      row.appendChild(buyBtn);
      shopItemsEl.appendChild(row);

      const option = document.createElement('option');
      option.value = seedName;
      option.textContent = `${seed.icon} ${seedName}`;
      seedSelect.appendChild(option);
    });
  }

  function resetRound() {
    roundStartMs = Date.now();
    roundGoal = getGoalForLevel(state.level);
    roundProgress = 0;
    renderHUD();
  }

  function nextLevel() {
    state.level += 1;
    state.bestLevel = Math.max(state.level, state.bestLevel || 1);
    const bonus = 4 + state.level;
    state.coins += bonus;
    save();
    plantsLayer.innerHTML = '';
    setStatus(`Level cleared! Bonus +${bonus} coins.`);
    resetRound();
    renderInventory();
  }

  function failRound() {
    state.level = Math.max(1, state.level - 1);
    save();
    plantsLayer.innerHTML = '';
    setStatus('Time up. Round reset. Plant and harvest faster.');
    resetRound();
  }

  function addRoundProgress(amount) {
    roundProgress += amount;
    if (roundProgress >= roundGoal) {
      nextLevel();
    }
    renderHUD();
  }

  function spawnCoin(amount = 1) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.textContent = '$';

    const x = Math.random() * (garden.clientWidth - 40);
    const y = 40 + Math.random() * (garden.clientHeight - 150);
    coin.style.left = `${x}px`;
    coin.style.top = `${y}px`;

    coin.onclick = () => {
      state.coins += amount;
      save();
      renderHUD();
      coin.remove();
    };

    coinsLayer.appendChild(coin);
    setTimeout(() => {
      if (coin.parentNode) coin.remove();
    }, 8000);
  }

  function maturePlant(plantEl, seedName) {
    plantEl.classList.add('mature');
    plantEl.dataset.mature = '1';

    const hint = plantEl.querySelector('.hint');
    if (hint) hint.textContent = 'Click to harvest';

    const productionInterval = setInterval(() => {
      if (!plantEl.parentNode) {
        clearInterval(productionInterval);
        return;
      }

      const coin = document.createElement('div');
      coin.className = 'coin';
      coin.textContent = '$';
      coin.style.left = `${parseFloat(plantEl.style.left) + (Math.random() * 20 - 10)}px`;
      coin.style.top = `${garden.clientHeight - 90}px`;

      coin.onclick = () => {
        state.coins += 1;
        save();
        renderHUD();
        coin.remove();
      };

      coinsLayer.appendChild(coin);
      setTimeout(() => {
        if (coin.parentNode) coin.remove();
      }, 5000);
    }, 5000);

    plantEl.addEventListener('click', (event) => {
      event.stopPropagation();
      if (plantEl.dataset.mature !== '1') return;

      const payout = seedTypes[seedName].payout + Math.floor(Math.random() * 3);
      state.coins += payout;
      save();
      addRoundProgress(payout);
      renderHUD();
      setStatus(`Harvested ${seedName} for +${payout} coins.`);
      plantEl.remove();
      clearInterval(productionInterval);
    });
  }

  function plantAt(seedName, x) {
    state.seeds[seedName] -= 1;
    save();
    renderHUD();
    renderInventory();

    const plantEl = document.createElement('div');
    plantEl.className = 'plant';
    plantEl.style.left = `${x}px`;
    plantEl.dataset.type = seedName;
    plantEl.innerHTML = `<div class='grow'>.</div><div class='label'>${seedName}</div><div class='hint'>Growing...</div>`;
    plantsLayer.appendChild(plantEl);

    let tick = 0;
    const growGoal = seedTypes[seedName].growTime;

    const growth = setInterval(() => {
      tick += 1;
      const growEl = plantEl.querySelector('.grow');
      if (!growEl) {
        clearInterval(growth);
        return;
      }

      if (tick < growGoal / 2) growEl.textContent = '.';
      else if (tick < growGoal) growEl.textContent = '*';
      else growEl.textContent = seedTypes[seedName].icon;

      if (tick >= growGoal) {
        clearInterval(growth);
        maturePlant(plantEl, seedName);
      }
    }, 1000);
  }

  function placeNPCs() {
    npcsLayer.innerHTML = '';
    const npcNames = ['Luna', 'Maya', 'Iris', 'Zara'];
    const spacing = garden.clientWidth / (npcNames.length + 1);

    npcNames.forEach((name, index) => {
      const x = spacing * (index + 1);
      const npc = document.createElement('div');
      npc.className = 'npc';
      npc.style.left = `${x}px`;
      npc.style.bottom = '8px';
      npc.innerHTML = `${name}<div class='name' style='font-size:11px'>NPC</div>`;
      npcsLayer.appendChild(npc);
    });
  }

  let px = 80;
  function renderPlayer() {
    playerEl.style.left = `${px}px`;
  }

  function setupInputs() {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        px = Math.min(garden.clientWidth - 40, px + 24);
        renderPlayer();
      }
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        px = Math.max(20, px - 24);
        renderPlayer();
      }
    });

    garden.addEventListener('click', (event) => {
      if (event.target.classList.contains('coin')) return;

      const selected = seedSelect.value;
      if (selected === 'none') {
        setStatus('Pick a seed first. Open Shop if needed.');
        return;
      }

      if (state.seeds[selected] <= 0) {
        setStatus(`No ${selected} seeds. Buy more in the shop.`);
        return;
      }

      const rect = garden.getBoundingClientRect();
      const x = event.clientX - rect.left;
      plantAt(selected, x);
      setStatus(`Planted ${selected}.`);
    });

    shopBtn.addEventListener('click', () => {
      shopModal.style.display = 'flex';
      setupShop();
    });

    closeShop.addEventListener('click', () => {
      shopModal.style.display = 'none';
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      state = {
        coins: 12,
        seeds: { rose: 1, tulip: 2, sunflower: 0 },
        level: 1,
        bestLevel: 1
      };
      localStorage.removeItem(STORAGE_KEY);
      save();
      coinsLayer.innerHTML = '';
      plantsLayer.innerHTML = '';
      setStatus('Game reset. Fresh garden started.');
      renderInventory();
      resetRound();
      renderHUD();
    });

    window.addEventListener('resize', () => {
      placeNPCs();
      renderPlayer();
    });
  }

  function initGameLoop() {
    setInterval(() => spawnCoin(1), 3200);

    setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartMs) / 1000);
      if (elapsed >= ROUND_SECONDS) {
        failRound();
      } else {
        renderHUD();
      }
    }, 300);
  }

  function init() {
    renderInventory();
    setupShop();
    placeNPCs();
    renderPlayer();
    resetRound();
    renderHUD();
    setupInputs();
    initGameLoop();
    setStatus('Reach the coin goal before time runs out.');
  }

  init();
})();