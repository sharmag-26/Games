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
  const communityInventoryEl = document.getElementById('communityInventory');
  const tradePartnerEl = document.getElementById('tradePartner');
  const tradeSeedEl = document.getElementById('tradeSeed');
  const tradeQtyEl = document.getElementById('tradeQty');
  const buySeedBtn = document.getElementById('buySeedBtn');
  const sellSeedBtn = document.getElementById('sellSeedBtn');
  const tradeLogEl = document.getElementById('tradeLog');

  const garden = document.getElementById('gardenArea');
  const plotsLayer = document.getElementById('plotsLayer');
  const plantsLayer = document.getElementById('plantsLayer');
  const gardenersLayer = document.getElementById('gardenersLayer');
  const coinsLayer = document.getElementById('coinsLayer');

  const STORAGE_KEY = 'flower_garden_state_v3';
  const ROUND_SECONDS = 90;

  const seedTypes = {
    rose: { icon: 'R', cost: 5, growTime: 8, payout: 7 },
    tulip: { icon: 'T', cost: 4, growTime: 6, payout: 5 },
    sunflower: { icon: 'S', cost: 8, growTime: 10, payout: 10 }
  };

  const gardenersMeta = {
    you: { name: 'You', role: 'Lead Gardener' },
    luna: { name: 'Luna', role: 'Herb Specialist' },
    maya: { name: 'Maya', role: 'Soil Specialist' },
    iris: { name: 'Iris', role: 'Seed Keeper' },
    zara: { name: 'Zara', role: 'Bloom Expert' }
  };

  const gardenerIds = Object.keys(gardenersMeta);
  const npcIds = gardenerIds.filter((id) => id !== 'you');

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
    level: 1,
    bestLevel: 1,
    gardeners: {
      you: { coins: 20, seeds: { rose: 2, tulip: 2, sunflower: 1 } },
      luna: { coins: 14, seeds: { rose: 3, tulip: 1, sunflower: 1 } },
      maya: { coins: 16, seeds: { rose: 1, tulip: 3, sunflower: 0 } },
      iris: { coins: 15, seeds: { rose: 2, tulip: 2, sunflower: 2 } },
      zara: { coins: 18, seeds: { rose: 1, tulip: 2, sunflower: 2 } }
    }
  };

  let roundStartMs = Date.now();
  let roundGoal = getGoalForLevel(state.level);
  let roundProgress = 0;

  const plotBounds = {};

  function getGoalForLevel(level) {
    return 18 + level * 7;
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function seedSummary(seedMap) {
    return Object.keys(seedTypes).map((seed) => `${seed}:${seedMap[seed]}`).join(' ');
  }

  function pushLog(message) {
    const line = document.createElement('div');
    line.textContent = message;
    tradeLogEl.prepend(line);
    while (tradeLogEl.children.length > 8) {
      tradeLogEl.removeChild(tradeLogEl.lastChild);
    }
  }

  function setStatus(message) {
    statusTextEl.textContent = message;
  }

  function renderHUD() {
    const you = state.gardeners.you;
    coinCountEl.textContent = you.coins;
    seedCountsEl.textContent = seedSummary(you.seeds);

    const secondsLeft = Math.max(0, ROUND_SECONDS - Math.floor((Date.now() - roundStartMs) / 1000));
    roundInfoEl.textContent = `Level ${state.level} | Goal ${roundProgress}/${roundGoal} | Time ${secondsLeft}s`;
    goalTextEl.textContent = `${roundProgress}/${roundGoal}`;
  }

  function renderInventory() {
    const you = state.gardeners.you;
    inventoryEl.innerHTML = '';
    Object.keys(seedTypes).forEach((seed) => {
      const row = document.createElement('div');
      row.textContent = `${seedTypes[seed].icon} ${seed}: ${you.seeds[seed]}`;
      inventoryEl.appendChild(row);
    });

    communityInventoryEl.innerHTML = '';
    npcIds.forEach((id) => {
      const card = document.createElement('div');
      card.className = 'community-card';
      card.textContent = `${gardenersMeta[id].name} | Coins ${state.gardeners[id].coins} | ${seedSummary(state.gardeners[id].seeds)}`;
      communityInventoryEl.appendChild(card);
    });
  }

  function setupSelectors() {
    seedSelect.innerHTML = '<option value="none">-- none --</option>';
    tradeSeedEl.innerHTML = '';
    Object.keys(seedTypes).forEach((seed) => {
      const optionPlant = document.createElement('option');
      optionPlant.value = seed;
      optionPlant.textContent = `${seedTypes[seed].icon} ${seed}`;
      seedSelect.appendChild(optionPlant);

      const optionTrade = document.createElement('option');
      optionTrade.value = seed;
      optionTrade.textContent = `${seedTypes[seed].icon} ${seed}`;
      tradeSeedEl.appendChild(optionTrade);
    });

    tradePartnerEl.innerHTML = '';
    npcIds.forEach((id) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = gardenersMeta[id].name;
      tradePartnerEl.appendChild(option);
    });
  }

  function setupShop() {
    shopItemsEl.innerHTML = '';
    Object.keys(seedTypes).forEach((seed) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.margin = '8px 0';
      row.innerHTML = `<div>${seedTypes[seed].icon} <strong>${seed}</strong> - ${seedTypes[seed].cost} coins</div>`;

      const buyBtn = document.createElement('button');
      buyBtn.textContent = 'Buy';
      buyBtn.onclick = () => {
        const you = state.gardeners.you;
        if (you.coins < seedTypes[seed].cost) {
          setStatus('Not enough coins in your wallet.');
          return;
        }
        you.coins -= seedTypes[seed].cost;
        you.seeds[seed] += 1;
        save();
        renderInventory();
        renderHUD();
        setStatus(`Bought 1 ${seed} from shop.`);
      };
      row.appendChild(buyBtn);
      shopItemsEl.appendChild(row);
    });
  }

  function buildGardenScene() {
    plotsLayer.innerHTML = '';
    gardenersLayer.innerHTML = '';

    const section = 100 / gardenerIds.length;
    gardenerIds.forEach((id, index) => {
      const leftPct = index * section + 1;
      const widthPct = section - 2;

      plotBounds[id] = {
        left: leftPct / 100 * garden.clientWidth,
        right: (leftPct + widthPct) / 100 * garden.clientWidth
      };

      const plot = document.createElement('div');
      plot.className = 'plot';
      plot.style.left = `${leftPct}%`;
      plot.style.width = `${widthPct}%`;
      plotsLayer.appendChild(plot);

      const label = document.createElement('div');
      label.className = 'plot-label';
      label.style.left = `${leftPct + widthPct / 2}%`;
      label.textContent = `${gardenersMeta[id].name} plot`;
      plotsLayer.appendChild(label);

      const gardener = document.createElement('div');
      gardener.className = 'gardener';
      gardener.style.left = `${leftPct + widthPct / 2}%`;
      gardener.innerHTML = `<div class='hat'></div><div class='head'></div><div class='body'></div><div class='tool'></div><div class='tag'>${gardenersMeta[id].name}</div>`;
      gardenersLayer.appendChild(gardener);
    });
  }

  function ownerForX(x) {
    return gardenerIds.find((id) => x >= plotBounds[id].left && x <= plotBounds[id].right) || null;
  }

  function getRandomXForOwner(ownerId) {
    const bounds = plotBounds[ownerId];
    if (!bounds) return 50;
    return bounds.left + 30 + Math.random() * Math.max(10, (bounds.right - bounds.left - 60));
  }

  function addRoundProgress(amount) {
    roundProgress += amount;
    if (roundProgress >= roundGoal) {
      state.level += 1;
      state.bestLevel = Math.max(state.bestLevel, state.level);
      state.gardeners.you.coins += 8 + state.level;
      setStatus(`Level cleared. Welcome to level ${state.level}.`);
      roundStartMs = Date.now();
      roundGoal = getGoalForLevel(state.level);
      roundProgress = 0;
      plantsLayer.innerHTML = '';
    }
    save();
    renderHUD();
  }

  function createCoin(x, y, value, collectorId = 'you') {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.textContent = '$';
    coin.style.left = `${x}px`;
    coin.style.top = `${y}px`;

    coin.onclick = () => {
      state.gardeners[collectorId].coins += value;
      save();
      renderInventory();
      renderHUD();
      coin.remove();
    };

    coinsLayer.appendChild(coin);
    setTimeout(() => {
      if (coin.parentNode) coin.remove();
    }, 7000);
  }

  function maturePlant(plantEl, ownerId, seed) {
    plantEl.classList.add('mature');
    plantEl.dataset.mature = '1';
    const hint = plantEl.querySelector('.hint');
    if (hint) hint.textContent = ownerId === 'you' ? 'Click to harvest' : 'Auto harvest by owner';

    const drip = setInterval(() => {
      if (!plantEl.parentNode) {
        clearInterval(drip);
        return;
      }
      createCoin(parseFloat(plantEl.style.left) + (Math.random() * 16 - 8), 430, 1, ownerId);
    }, 6000);

    if (ownerId !== 'you') {
      setTimeout(() => {
        if (!plantEl.parentNode) return;
        const payout = seedTypes[seed].payout;
        state.gardeners[ownerId].coins += payout;
        save();
        renderInventory();
        plantEl.remove();
        clearInterval(drip);
      }, 4000 + Math.floor(Math.random() * 3000));
      return;
    }

    plantEl.addEventListener('click', (event) => {
      event.stopPropagation();
      if (plantEl.dataset.mature !== '1') return;
      const payout = seedTypes[seed].payout + Math.floor(Math.random() * 3);
      state.gardeners.you.coins += payout;
      addRoundProgress(payout);
      save();
      renderInventory();
      renderHUD();
      setStatus(`Harvested ${seed} for +${payout} coins.`);
      plantEl.remove();
      clearInterval(drip);
    });
  }

  function plantSeed(ownerId, seed, x) {
    if (state.gardeners[ownerId].seeds[seed] <= 0) return false;

    state.gardeners[ownerId].seeds[seed] -= 1;
    const plantEl = document.createElement('div');
    plantEl.className = 'plant';
    plantEl.style.left = `${x}px`;
    plantEl.dataset.type = seed;
    plantEl.dataset.owner = ownerId;
    plantEl.innerHTML = `<div class='grow'>.</div><div class='label'>${seed}</div><div class='hint'>Growing...</div>`;
    plantsLayer.appendChild(plantEl);

    let tick = 0;
    const target = seedTypes[seed].growTime;
    const growth = setInterval(() => {
      tick += 1;
      const growEl = plantEl.querySelector('.grow');
      if (!growEl) {
        clearInterval(growth);
        return;
      }
      if (tick < target / 2) growEl.textContent = '.';
      else if (tick < target) growEl.textContent = '*';
      else growEl.textContent = seedTypes[seed].icon;

      if (tick >= target) {
        clearInterval(growth);
        maturePlant(plantEl, ownerId, seed);
      }
    }, 1000);

    save();
    renderInventory();
    renderHUD();
    return true;
  }

  function npcGrowCycle() {
    npcIds.forEach((ownerId) => {
      const options = Object.keys(seedTypes).filter((seed) => state.gardeners[ownerId].seeds[seed] > 0);
      if (!options.length) return;
      const seed = options[Math.floor(Math.random() * options.length)];
      const x = getRandomXForOwner(ownerId);
      plantSeed(ownerId, seed, x);
    });
  }

  function executeTrade(fromId, toId, seed, qty, pricePerSeed) {
    if (qty <= 0) return false;
    const from = state.gardeners[fromId];
    const to = state.gardeners[toId];
    const total = qty * pricePerSeed;

    if (from.seeds[seed] < qty || to.coins < total) return false;

    from.seeds[seed] -= qty;
    to.seeds[seed] += qty;
    to.coins -= total;
    from.coins += total;

    save();
    renderInventory();
    renderHUD();
    return true;
  }

  function userTrade(direction) {
    const partnerId = tradePartnerEl.value;
    const seed = tradeSeedEl.value;
    const qty = Math.max(1, Math.min(10, parseInt(tradeQtyEl.value, 10) || 1));

    if (!partnerId || !seed) return;

    const buyPrice = seedTypes[seed].cost + 2;
    const sellPrice = Math.max(1, seedTypes[seed].cost - 1);

    let ok = false;
    if (direction === 'buy') {
      ok = executeTrade(partnerId, 'you', seed, qty, buyPrice);
      if (ok) {
        setStatus(`Bought ${qty} ${seed} from ${gardenersMeta[partnerId].name}.`);
        pushLog(`You bought ${qty} ${seed} from ${gardenersMeta[partnerId].name}`);
      }
    } else {
      ok = executeTrade('you', partnerId, seed, qty, sellPrice);
      if (ok) {
        setStatus(`Sold ${qty} ${seed} to ${gardenersMeta[partnerId].name}.`);
        pushLog(`You sold ${qty} ${seed} to ${gardenersMeta[partnerId].name}`);
      }
    }

    if (!ok) {
      setStatus('Trade failed. Check seeds/coins for both gardeners.');
    }
  }

  function npcTradeCycle() {
    const fromId = npcIds[Math.floor(Math.random() * npcIds.length)];
    let toId = npcIds[Math.floor(Math.random() * npcIds.length)];
    if (toId === fromId) toId = 'you';

    const seed = Object.keys(seedTypes)[Math.floor(Math.random() * Object.keys(seedTypes).length)];
    const qty = 1;
    const price = seedTypes[seed].cost;

    const ok = executeTrade(fromId, toId, seed, qty, price);
    if (ok) {
      pushLog(`${gardenersMeta[fromId].name} traded ${seed} to ${gardenersMeta[toId].name}`);
    }
  }

  function resetRound() {
    roundStartMs = Date.now();
    roundGoal = getGoalForLevel(state.level);
    roundProgress = 0;
    renderHUD();
  }

  function setupInputs() {
    garden.addEventListener('click', (event) => {
      if (event.target.classList.contains('coin')) return;

      const selectedSeed = seedSelect.value;
      if (selectedSeed === 'none') {
        setStatus('Choose a seed first.');
        return;
      }

      const rect = garden.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const owner = ownerForX(x);
      if (owner !== 'you') {
        setStatus('That plot is private. Plant inside your own space.');
        return;
      }

      const planted = plantSeed('you', selectedSeed, x);
      if (!planted) {
        setStatus(`No ${selectedSeed} seeds available.`);
        return;
      }

      setStatus(`Planted ${selectedSeed} in your private plot.`);
    });

    buySeedBtn.addEventListener('click', () => userTrade('buy'));
    sellSeedBtn.addEventListener('click', () => userTrade('sell'));

    shopBtn.addEventListener('click', () => {
      shopModal.style.display = 'flex';
      setupShop();
    });

    closeShop.addEventListener('click', () => {
      shopModal.style.display = 'none';
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });

    window.addEventListener('resize', () => {
      buildGardenScene();
    });
  }

  function runLoops() {
    setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartMs) / 1000);
      if (elapsed >= ROUND_SECONDS) {
        state.level = Math.max(1, state.level - 1);
        setStatus('Time up. Level reduced by 1 and round restarted.');
        resetRound();
      }
      renderHUD();
    }, 400);

    setInterval(() => {
      const x = 20 + Math.random() * (garden.clientWidth - 40);
      const y = 50 + Math.random() * 280;
      createCoin(x, y, 1, 'you');
    }, 3500);

    setInterval(npcGrowCycle, 6500);
    setInterval(npcTradeCycle, 7000);
  }

  function init() {
    setupSelectors();
    buildGardenScene();
    setupShop();
    renderInventory();
    resetRound();
    setupInputs();
    runLoops();
    setStatus('Private plots active. Grow, harvest, and trade with all gardeners.');
  }

  init();
})();