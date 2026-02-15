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
  const waterBtn = document.getElementById('waterBtn');
  const waveBtn = document.getElementById('waveBtn');
  const tradeLogEl = document.getElementById('tradeLog');
  const touchControls = document.getElementById('touchControls');

  const garden = document.getElementById('gardenArea');
  const plotsLayer = document.getElementById('plotsLayer');
  const plantsLayer = document.getElementById('plantsLayer');
  const gardenersLayer = document.getElementById('gardenersLayer');
  const playerAvatar = document.getElementById('playerAvatar');
  const coinsLayer = document.getElementById('coinsLayer');

  const STORAGE_KEY = 'flower_garden_state_v4';
  const ROUND_SECONDS = 90;
  const PLAYER_SPEED_X = 230;
  const PLAYER_SPEED_DEPTH = 0.95;

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
  const keys = {};
  const player = {
    x: 120,
    depth: 0.66,
    moving: false,
    plantedCooldownMs: 0,
    waveCooldownMs: 0
  };

  function getGoalForLevel(level) {
    return 18 + level * 7;
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function seedSummary(seedMap) {
    return Object.keys(seedTypes)
      .map((seed) => `${seed}:${seedMap[seed]}`)
      .join(' ');
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

  function youPlotCenterX() {
    const bounds = plotBounds.you;
    if (!bounds) return 120;
    return (bounds.left + bounds.right) / 2;
  }

  function keepPlayerInsideOwnPlot() {
    const bounds = plotBounds.you;
    if (!bounds) return;
    player.x = Math.max(bounds.left + 24, Math.min(bounds.right - 24, player.x));
    player.depth = Math.max(0.12, Math.min(0.95, player.depth));
  }

  function renderPlayer() {
    const top = 128 + player.depth * 370;
    const scale = 0.58 + player.depth * 0.62;
    playerAvatar.style.left = `${player.x}px`;
    playerAvatar.style.top = `${top}px`;
    playerAvatar.style.setProperty('--scale', scale.toFixed(3));

    const xParallax = (player.x / garden.clientWidth - 0.5) * 10;
    const yParallax = (player.depth - 0.5) * 8;
    garden.style.backgroundPosition = `${50 + xParallax}% ${50 + yParallax}%`;

    playerAvatar.classList.toggle('walking', player.moving);
  }

  function buildGardenScene() {
    plotsLayer.innerHTML = '';
    gardenersLayer.innerHTML = '';

    const section = 100 / gardenerIds.length;
    gardenerIds.forEach((id, index) => {
      const leftPct = index * section + 1;
      const widthPct = section - 2;

      plotBounds[id] = {
        left: (leftPct / 100) * garden.clientWidth,
        right: ((leftPct + widthPct) / 100) * garden.clientWidth
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

      if (id !== 'you') {
        const gardener = document.createElement('div');
        gardener.className = 'gardener';
        gardener.style.left = `${leftPct + widthPct / 2}%`;
        gardener.innerHTML = `<div class='hat'></div><div class='head'></div><div class='body'></div><div class='arm left'></div><div class='arm right'></div><div class='tool'></div><div class='tag'>${gardenersMeta[id].name}</div>`;
        gardenersLayer.appendChild(gardener);
      }
    });

    if (!player.x || player.x < 1) {
      player.x = youPlotCenterX();
    }
    keepPlayerInsideOwnPlot();
    renderPlayer();
  }

  function ownerForX(x) {
    return gardenerIds.find((id) => x >= plotBounds[id].left && x <= plotBounds[id].right) || null;
  }

  function getRandomXForOwner(ownerId) {
    const bounds = plotBounds[ownerId];
    if (!bounds) return 50;
    return bounds.left + 30 + Math.random() * Math.max(10, bounds.right - bounds.left - 60);
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

  function collectCoinForPlayer(coin) {
    if (!coin || !coin.parentNode) return;
    const value = parseInt(coin.dataset.value || '1', 10);
    state.gardeners.you.coins += value;
    save();
    renderInventory();
    renderHUD();
    coin.remove();
    setStatus(`Collected ${value} coin${value > 1 ? 's' : ''}.`);
  }

  function createCoin(x, y, value, collectorId = 'you') {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.dataset.owner = collectorId;
    coin.dataset.value = String(value);
    coin.textContent = '$';
    coin.style.left = `${x}px`;
    coin.style.top = `${y}px`;

    if (collectorId !== 'you') {
      coin.style.opacity = '0.7';
    }

    coin.onclick = (event) => {
      event.stopPropagation();
      collectCoinForPlayer(coin);
    };

    coinsLayer.appendChild(coin);
    if (collectorId !== 'you') {
      setTimeout(() => {
        if (!coin.parentNode) return;
        state.gardeners[collectorId].coins += value;
        save();
        renderInventory();
        coin.remove();
      }, 2600);
    }
    setTimeout(() => {
      if (coin.parentNode) coin.remove();
    }, 7000);
  }

  function maturePlant(plantEl, ownerId, seed) {
    plantEl.classList.add('mature');
    plantEl.dataset.mature = '1';
    const hint = plantEl.querySelector('.hint');
    if (hint) hint.textContent = ownerId === 'you' ? 'Harvest' : 'Auto harvest';

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
    plantEl.dataset.boost = '0';
    plantEl.innerHTML = `<div class='grow'>.</div><div class='label'>${seed}</div><div class='hint'>Growing...</div>`;
    plantsLayer.appendChild(plantEl);

    let tick = 0;
    const target = seedTypes[seed].growTime;
    const growth = setInterval(() => {
      const boost = parseFloat(plantEl.dataset.boost || '0');
      tick += 1 + boost;
      plantEl.dataset.boost = String(Math.max(0, boost - 0.2));
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
      setStatus('Trade failed. Check seeds and coins for both gardeners.');
    }
  }

  function npcTradeCycle() {
    const fromId = npcIds[Math.floor(Math.random() * npcIds.length)];
    let toId = npcIds[Math.floor(Math.random() * npcIds.length)];
    if (toId === fromId) toId = 'you';

    const seedNames = Object.keys(seedTypes);
    const seed = seedNames[Math.floor(Math.random() * seedNames.length)];
    const ok = executeTrade(fromId, toId, seed, 1, seedTypes[seed].cost);
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

  function plantAtPlayer() {
    if (player.plantedCooldownMs > 0) return;

    const selectedSeed = seedSelect.value;
    if (selectedSeed === 'none') {
      setStatus('Choose a seed first.');
      return;
    }

    const owner = ownerForX(player.x);
    if (owner !== 'you') {
      setStatus('Move back to your private plot to plant.');
      return;
    }

    const planted = plantSeed('you', selectedSeed, player.x);
    if (!planted) {
      setStatus(`No ${selectedSeed} seeds available.`);
      return;
    }

    player.plantedCooldownMs = 280;
    setStatus(`Planted ${selectedSeed} in your private plot.`);
  }

  function waterNearestPlant() {
    const candidates = Array.from(plantsLayer.querySelectorAll('.plant[data-owner="you"]'))
      .filter((plant) => plant.dataset.mature !== '1');
    if (!candidates.length) {
      setStatus('No growing plant nearby to water.');
      return;
    }

    let nearest = null;
    let best = Infinity;
    candidates.forEach((plant) => {
      const x = parseFloat(plant.style.left || '0');
      const d = Math.abs(x - player.x);
      if (d < best) {
        best = d;
        nearest = plant;
      }
    });

    if (!nearest || best > 140) {
      setStatus('Move closer to a growing plant to water it.');
      return;
    }

    const nowBoost = parseFloat(nearest.dataset.boost || '0');
    nearest.dataset.boost = String(Math.min(2.5, nowBoost + 1));
    nearest.classList.add('watered');
    setTimeout(() => nearest.classList.remove('watered'), 650);

    const pop = document.createElement('div');
    pop.className = 'water-pop';
    pop.textContent = '+water';
    pop.style.left = nearest.style.left;
    pop.style.top = '430px';
    coinsLayer.appendChild(pop);
    setTimeout(() => pop.remove(), 800);

    const hint = nearest.querySelector('.hint');
    if (hint) hint.textContent = 'Watered: faster growth';
    setStatus('Watered plant. Growth speed increased.');
  }

  function waveToNearestGardener() {
    if (player.waveCooldownMs > 0) return;

    const npcs = Array.from(gardenersLayer.querySelectorAll('.gardener'));
    if (!npcs.length) return;

    const playerPct = (player.x / garden.clientWidth) * 100;
    let nearest = null;
    let best = Infinity;
    npcs.forEach((npc) => {
      const pct = parseFloat(npc.style.left || '0');
      const d = Math.abs(pct - playerPct);
      if (d < best) {
        best = d;
        nearest = npc;
      }
    });

    playerAvatar.classList.add('waving');
    if (nearest) nearest.classList.add('waving');
    setTimeout(() => {
      playerAvatar.classList.remove('waving');
      if (nearest) nearest.classList.remove('waving');
    }, 1200);

    player.waveCooldownMs = 500;
    setStatus('You waved to the nearby gardener.');
  }

  function setupInputs() {
    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      keys[key] = true;

      const active = document.activeElement;
      const typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      if ((key === ' ' || key === 'e') && !typing) {
        event.preventDefault();
        plantAtPlayer();
      }
      if (key === 'r' && !typing) {
        event.preventDefault();
        waterNearestPlant();
      }
      if (key === 'f' && !typing) {
        event.preventDefault();
        waveToNearestGardener();
      }
      if (key.startsWith('arrow')) {
        event.preventDefault();
      }
    });

    window.addEventListener('keyup', (event) => {
      keys[event.key.toLowerCase()] = false;
    });

    garden.addEventListener('click', (event) => {
      if (event.target.classList.contains('coin')) return;
      plantAtPlayer();
    });

    buySeedBtn.addEventListener('click', () => userTrade('buy'));
    sellSeedBtn.addEventListener('click', () => userTrade('sell'));
    waterBtn.addEventListener('click', () => waterNearestPlant());
    waveBtn.addEventListener('click', () => waveToNearestGardener());

    if (touchControls) {
      touchControls.querySelectorAll('[data-touch-key]').forEach((btn) => {
        const key = btn.getAttribute('data-touch-key');
        const press = (event) => {
          event.preventDefault();
          keys[key] = true;
        };
        const release = (event) => {
          event.preventDefault();
          keys[key] = false;
        };
        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('pointerleave', release);
      });

      touchControls.querySelectorAll('[data-touch-action]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          const action = btn.getAttribute('data-touch-action');
          if (action === 'plant') plantAtPlayer();
          if (action === 'water') waterNearestPlant();
          if (action === 'wave') waveToNearestGardener();
        });
      });
    }

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

  function tryCollectNearbyCoins() {
    const playerY = 128 + player.depth * 370;
    const coins = coinsLayer.querySelectorAll('.coin');
    coins.forEach((coin) => {
      const cx = parseFloat(coin.style.left || '0');
      const cy = parseFloat(coin.style.top || '0') + 30;
      const distance = Math.hypot(cx - player.x, cy - playerY);
      if (distance < 48) {
        collectCoinForPlayer(coin);
      }
    });
  }

  function updateMovement(now) {
    if (!updateMovement.last) updateMovement.last = now;
    const dt = Math.min(0.05, (now - updateMovement.last) / 1000);
    updateMovement.last = now;

    const active = document.activeElement;
    const typing = active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA');

    let mx = 0;
    let md = 0;
    if (!typing) {
      if (keys['a'] || keys['arrowleft']) mx -= 1;
      if (keys['d'] || keys['arrowright']) mx += 1;
      if (keys['w'] || keys['arrowup']) md -= 1;
      if (keys['s'] || keys['arrowdown']) md += 1;
    }

    player.moving = mx !== 0 || md !== 0;
    if (player.moving) {
      const len = Math.hypot(mx, md) || 1;
      player.x += (mx / len) * PLAYER_SPEED_X * dt;
      player.depth += (md / len) * PLAYER_SPEED_DEPTH * dt;
      keepPlayerInsideOwnPlot();
      renderPlayer();
    }

    if (player.plantedCooldownMs > 0) {
      player.plantedCooldownMs -= dt * 1000;
    }
    if (player.waveCooldownMs > 0) {
      player.waveCooldownMs -= dt * 1000;
    }

    tryCollectNearbyCoins();
    requestAnimationFrame(updateMovement);
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
      const y = 90 + Math.random() * 300;
      createCoin(x, y, 1, 'you');
    }, 3500);

    setInterval(npcGrowCycle, 6500);
    setInterval(npcTradeCycle, 7000);
  }

  function init() {
    setupSelectors();
    buildGardenScene();
    player.x = youPlotCenterX();
    keepPlayerInsideOwnPlot();
    renderPlayer();
    setupShop();
    renderInventory();
    resetRound();
    setupInputs();
    runLoops();
    requestAnimationFrame(updateMovement);
    setStatus('3D mode active. Move with WASD or arrows, then press Space or E to plant.');
  }

  init();
})();
