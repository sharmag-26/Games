// @ts-nocheck
export class GrowthSystem {
    constructor(game) {
        this.game = game;
    }
    addRoundProgress(amount) {
        this.game.roundProgress += amount;
        if (this.game.roundProgress >= this.game.roundGoal) {
            this.game.state.level += 1;
            this.game.state.bestLevel = Math.max(this.game.state.bestLevel, this.game.state.level);
            this.game.state.gardeners.you.coins += 8 + this.game.state.level;
            this.game.ui.setStatus(`Level cleared. Welcome to level ${this.game.state.level}.`);
            this.game.roundStartMs = Date.now();
            this.game.roundGoal = this.game.getGoalForLevel(this.game.state.level);
            this.game.roundProgress = 0;
            this.game.dom.plantsLayer.innerHTML = "";
        }
        this.game.persist();
        this.game.ui.renderHUD();
    }
    collectCoinForPlayer(coin) {
        if (!coin || !coin.parentNode)
            return;
        const value = parseInt(coin.dataset.value || "1", 10);
        this.game.state.gardeners.you.coins += value;
        this.game.persist();
        this.game.ui.renderInventory();
        this.game.ui.renderHUD();
        coin.remove();
        this.game.ui.setStatus(`Collected ${value} coin${value > 1 ? "s" : ""}.`);
    }
    createCoin(x, y, value, collectorId = "you") {
        const coin = document.createElement("div");
        coin.className = "coin";
        coin.dataset.owner = collectorId;
        coin.dataset.value = String(value);
        coin.textContent = "$";
        coin.style.left = `${x}px`;
        coin.style.top = `${y}px`;
        if (collectorId !== "you")
            coin.style.opacity = "0.7";
        coin.onclick = (event) => {
            event.stopPropagation();
            this.collectCoinForPlayer(coin);
        };
        this.game.dom.coinsLayer.appendChild(coin);
        if (collectorId !== "you") {
            setTimeout(() => {
                if (!coin.parentNode)
                    return;
                this.game.state.gardeners[collectorId].coins += value;
                this.game.persist();
                this.game.ui.renderInventory();
                coin.remove();
            }, 2600);
        }
        setTimeout(() => {
            if (coin.parentNode)
                coin.remove();
        }, 7000);
    }
    maturePlant(plantEl, ownerId, seed) {
        plantEl.classList.add("mature");
        plantEl.dataset.mature = "1";
        const hint = plantEl.querySelector(".hint");
        if (hint)
            hint.textContent = ownerId === "you" ? "Harvest" : "Auto harvest";
        const drip = setInterval(() => {
            if (!plantEl.parentNode) {
                clearInterval(drip);
                return;
            }
            this.createCoin(parseFloat(plantEl.style.left) + (Math.random() * 16 - 8), 430, 1, ownerId);
        }, 6000);
        if (ownerId !== "you") {
            setTimeout(() => {
                if (!plantEl.parentNode)
                    return;
                this.game.state.gardeners[ownerId].coins += this.game.seedTypes[seed].payout;
                this.game.persist();
                this.game.ui.renderInventory();
                plantEl.remove();
                clearInterval(drip);
            }, 4000 + Math.floor(Math.random() * 3000));
            return;
        }
        plantEl.addEventListener("click", (event) => {
            event.stopPropagation();
            if (plantEl.dataset.mature !== "1")
                return;
            const payout = this.game.seedTypes[seed].payout + Math.floor(Math.random() * 3);
            this.game.state.gardeners.you.coins += payout;
            this.addRoundProgress(payout);
            this.game.persist();
            this.game.ui.renderInventory();
            this.game.ui.renderHUD();
            this.game.ui.setStatus(`Harvested ${seed} for +${payout} coins.`);
            plantEl.remove();
            clearInterval(drip);
        });
    }
    plantSeed(ownerId, seed, x) {
        if (this.game.state.gardeners[ownerId].seeds[seed] <= 0)
            return false;
        this.game.state.gardeners[ownerId].seeds[seed] -= 1;
        const plantEl = document.createElement("div");
        plantEl.className = "plant";
        plantEl.style.left = `${x}px`;
        plantEl.dataset.type = seed;
        plantEl.dataset.owner = ownerId;
        plantEl.dataset.boost = "0";
        plantEl.innerHTML = `<div class='grow'><span class='bloom ${this.game.seedTypes[seed].bloomClass} stage-sprout'></span></div><div class='label'>${seed}</div><div class='hint'>Growing...</div>`;
        this.game.dom.plantsLayer.appendChild(plantEl);
        let tick = 0;
        const target = this.game.seedTypes[seed].growTime;
        const growth = setInterval(() => {
            const boost = parseFloat(plantEl.dataset.boost || "0");
            tick += 1 + boost;
            plantEl.dataset.boost = String(Math.max(0, boost - 0.2));
            const growEl = plantEl.querySelector(".grow");
            if (!growEl) {
                clearInterval(growth);
                return;
            }
            const bloom = growEl.querySelector(".bloom");
            if (!bloom)
                return;
            if (tick < target / 2)
                bloom.className = `bloom ${this.game.seedTypes[seed].bloomClass} stage-sprout`;
            else if (tick < target)
                bloom.className = `bloom ${this.game.seedTypes[seed].bloomClass} stage-bud`;
            else
                bloom.className = `bloom ${this.game.seedTypes[seed].bloomClass} stage-bloom`;
            if (tick >= target) {
                clearInterval(growth);
                this.maturePlant(plantEl, ownerId, seed);
            }
        }, 1000);
        this.game.persist();
        this.game.ui.renderInventory();
        this.game.ui.renderHUD();
        return true;
    }
    npcGrowCycle() {
        this.game.npcIds.forEach((ownerId) => {
            const options = Object.keys(this.game.seedTypes).filter((seed) => this.game.state.gardeners[ownerId].seeds[seed] > 0);
            if (!options.length)
                return;
            const seed = options[Math.floor(Math.random() * options.length)];
            this.plantSeed(ownerId, seed, this.game.scene.getRandomXForOwner(ownerId));
        });
    }
    waterNearestPlant() {
        const candidates = Array.from(this.game.dom.plantsLayer.querySelectorAll('.plant[data-owner="you"]')).filter((plant) => plant.dataset.mature !== "1");
        if (!candidates.length) {
            this.game.ui.setStatus("No growing plant nearby to water.");
            return;
        }
        let nearest = null;
        let best = Infinity;
        candidates.forEach((plant) => {
            const x = parseFloat(plant.style.left || "0");
            const distance = Math.abs(x - this.game.player.x);
            if (distance < best) {
                best = distance;
                nearest = plant;
            }
        });
        if (!nearest || best > 140) {
            this.game.ui.setStatus("Move closer to a growing plant to water it.");
            return;
        }
        const nowBoost = parseFloat(nearest.dataset.boost || "0");
        nearest.dataset.boost = String(Math.min(2.5, nowBoost + 1));
        nearest.classList.add("watered");
        setTimeout(() => nearest.classList.remove("watered"), 650);
        const pop = document.createElement("div");
        pop.className = "water-pop";
        pop.textContent = "+water";
        pop.style.left = nearest.style.left;
        pop.style.top = "430px";
        this.game.dom.coinsLayer.appendChild(pop);
        setTimeout(() => pop.remove(), 800);
        const hint = nearest.querySelector(".hint");
        if (hint)
            hint.textContent = "Watered: faster growth";
        this.game.ui.setStatus("Watered plant. Growth speed increased.");
    }
    plantAtPlayer() {
        if (this.game.player.plantedCooldownMs > 0)
            return;
        const selectedSeed = this.game.dom.seedSelect.value;
        if (selectedSeed === "none") {
            this.game.ui.setStatus("Choose a seed first.");
            return;
        }
        const owner = this.game.scene.ownerForX(this.game.player.x);
        if (owner !== "you") {
            this.game.ui.setStatus("Move back to your private plot to plant.");
            return;
        }
        const planted = this.plantSeed("you", selectedSeed, this.game.player.x);
        if (!planted) {
            this.game.ui.setStatus(`No ${selectedSeed} seeds available.`);
            return;
        }
        this.game.player.plantedCooldownMs = 280;
        this.game.ui.setStatus(`Planted ${selectedSeed} in your private plot.`);
    }
    tryCollectNearbyCoins() {
        const playerY = 128 + this.game.player.depth * 370;
        const coins = this.game.dom.coinsLayer.querySelectorAll(".coin");
        coins.forEach((coin) => {
            const cx = parseFloat(coin.style.left || "0");
            const cy = parseFloat(coin.style.top || "0") + 30;
            if (Math.hypot(cx - this.game.player.x, cy - playerY) < 48)
                this.collectCoinForPlayer(coin);
        });
    }
}
//# sourceMappingURL=growthSystem.js.map