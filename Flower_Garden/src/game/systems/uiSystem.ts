// @ts-nocheck
export class UiSystem {
  constructor(game) {
    this.game = game;
  }

  seedSummary(seedMap) {
    return Object.keys(this.game.seedTypes)
      .map((seed) => `${seed}:${seedMap?.[seed] || 0}`)
      .join(" ");
  }

  pushLog(message) {
    const line = document.createElement("div");
    line.textContent = message;
    this.game.dom.tradeLogEl.prepend(line);
    while (this.game.dom.tradeLogEl.children.length > 8) {
      this.game.dom.tradeLogEl.removeChild(this.game.dom.tradeLogEl.lastChild);
    }
  }

  setStatus(message) {
    this.game.dom.statusTextEl.textContent = message;
  }

  renderHUD() {
    const you = this.game.state.gardeners.you;
    this.game.dom.coinCountEl.textContent = you.coins;
    this.game.dom.seedCountsEl.textContent = this.seedSummary(you.seeds);

    const secondsLeft = Math.max(
      0,
      this.game.roundSeconds - Math.floor((Date.now() - this.game.roundStartMs) / 1000)
    );

    this.game.dom.roundInfoEl.textContent =
      `Level ${this.game.state.level} | Goal ${this.game.roundProgress}/${this.game.roundGoal} | Time ${secondsLeft}s`;
    this.game.dom.goalTextEl.textContent = `${this.game.roundProgress}/${this.game.roundGoal}`;
  }

  renderInventory() {
    const you = this.game.state.gardeners.you;
    this.game.dom.inventoryEl.innerHTML = "";

    Object.keys(this.game.seedTypes).forEach((seed) => {
      const row = document.createElement("div");
      row.textContent = `${this.game.seedTypes[seed].icon} ${seed}: ${you.seeds[seed]}`;
      this.game.dom.inventoryEl.appendChild(row);
    });

    const barnTotal = Object.keys(this.game.seedTypes).reduce((sum, seed) => sum + (you.barnSeeds?.[seed] || 0), 0);
    const barnRow = document.createElement("div");
    barnRow.style.marginTop = "6px";
    barnRow.textContent = `Barn storage seeds: ${barnTotal}`;
    this.game.dom.inventoryEl.appendChild(barnRow);

    this.game.dom.communityInventoryEl.innerHTML = "";
    this.game.npcIds.forEach((id) => {
      const card = document.createElement("div");
      card.className = "community-card";
      card.textContent = `${this.game.gardenersMeta[id].name} | Coins ${this.game.state.gardeners[id].coins} | Bag ${this.seedSummary(this.game.state.gardeners[id].seeds)} | Barn ${this.seedSummary(this.game.state.gardeners[id].barnSeeds || {})}`;
      this.game.dom.communityInventoryEl.appendChild(card);
    });
  }

  renderBarnStorage(ownerId = "you") {
    if (!this.game.dom.barnSeedListEl) return;
    const owner = this.game.state.gardeners[ownerId];
    const storedTotal = Object.keys(this.game.seedTypes).reduce((sum, seed) => sum + (owner.barnSeeds?.[seed] || 0), 0);
    const bagTotal = Object.keys(this.game.seedTypes).reduce((sum, seed) => sum + (owner.seeds?.[seed] || 0), 0);
    const rows = Object.keys(this.game.seedTypes).map((seed) => {
      const value = owner.barnSeeds?.[seed] || 0;
      return `<div class="row"><span>${this.game.seedTypes[seed].icon} ${seed}</span><strong>${value}</strong></div>`;
    });
    const summary = `<div class="summary">Stored Seeds: <strong>${storedTotal}</strong> | Bag Seeds: <strong>${bagTotal}</strong></div>`;
    this.game.dom.barnSeedListEl.innerHTML = `${summary}${rows.join("")}`;
  }

  setupSelectors() {
    this.game.dom.seedSelect.innerHTML = '<option value="none">-- none --</option>';
    this.game.dom.tradeSeedEl.innerHTML = "";

    Object.keys(this.game.seedTypes).forEach((seed) => {
      const optionPlant = document.createElement("option");
      optionPlant.value = seed;
      optionPlant.textContent = `${this.game.seedTypes[seed].icon} ${seed}`;
      this.game.dom.seedSelect.appendChild(optionPlant);

      const optionTrade = document.createElement("option");
      optionTrade.value = seed;
      optionTrade.textContent = `${this.game.seedTypes[seed].icon} ${seed}`;
      this.game.dom.tradeSeedEl.appendChild(optionTrade);
    });

    this.game.dom.tradePartnerEl.innerHTML = "";
    this.game.npcIds.forEach((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = this.game.gardenersMeta[id].name;
      this.game.dom.tradePartnerEl.appendChild(option);
    });
  }

  setupShop() {
    this.game.dom.shopItemsEl.innerHTML = "";
    Object.keys(this.game.seedTypes).forEach((seed) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.margin = "8px 0";
      row.innerHTML = `<div>${this.game.seedTypes[seed].icon} <strong>${seed}</strong> - ${this.game.seedTypes[seed].cost} coins</div>`;

      const buyBtn = document.createElement("button");
      buyBtn.textContent = "Buy";
      buyBtn.onclick = () => {
        const you = this.game.state.gardeners.you;
        if (you.coins < this.game.seedTypes[seed].cost) {
          this.setStatus("Not enough coins in your wallet.");
          return;
        }

        you.coins -= this.game.seedTypes[seed].cost;
        you.seeds[seed] += 1;
        this.game.persist();
        this.renderInventory();
        this.renderHUD();
        this.setStatus(`Bought 1 ${seed} from shop.`);
      };

      row.appendChild(buyBtn);
      this.game.dom.shopItemsEl.appendChild(row);
    });
  }
}
