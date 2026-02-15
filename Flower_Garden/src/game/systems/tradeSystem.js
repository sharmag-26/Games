// @ts-nocheck
export class TradeSystem {
    constructor(game) {
        this.game = game;
    }
    executeTrade(fromId, toId, seed, qty, pricePerSeed) {
        if (qty <= 0)
            return false;
        const from = this.game.state.gardeners[fromId];
        const to = this.game.state.gardeners[toId];
        const total = qty * pricePerSeed;
        if (from.seeds[seed] < qty || to.coins < total)
            return false;
        from.seeds[seed] -= qty;
        to.seeds[seed] += qty;
        to.coins -= total;
        from.coins += total;
        this.game.persist();
        this.game.ui.renderInventory();
        this.game.ui.renderHUD();
        return true;
    }
    userTrade(direction) {
        const partnerId = this.game.dom.tradePartnerEl.value;
        const seed = this.game.dom.tradeSeedEl.value;
        const qty = Math.max(1, Math.min(10, parseInt(this.game.dom.tradeQtyEl.value, 10) || 1));
        if (!partnerId || !seed)
            return;
        const buyPrice = this.game.seedTypes[seed].cost + 2;
        const sellPrice = Math.max(1, this.game.seedTypes[seed].cost - 1);
        let ok = false;
        if (direction === "buy") {
            ok = this.executeTrade(partnerId, "you", seed, qty, buyPrice);
            if (ok) {
                this.game.ui.setStatus(`Bought ${qty} ${seed} from ${this.game.gardenersMeta[partnerId].name}.`);
                this.game.ui.pushLog(`You bought ${qty} ${seed} from ${this.game.gardenersMeta[partnerId].name}`);
            }
        }
        else {
            ok = this.executeTrade("you", partnerId, seed, qty, sellPrice);
            if (ok) {
                this.game.ui.setStatus(`Sold ${qty} ${seed} to ${this.game.gardenersMeta[partnerId].name}.`);
                this.game.ui.pushLog(`You sold ${qty} ${seed} to ${this.game.gardenersMeta[partnerId].name}`);
            }
        }
        if (!ok)
            this.game.ui.setStatus("Trade failed. Check seeds and coins for both gardeners.");
    }
    npcTradeCycle() {
        const fromId = this.game.npcIds[Math.floor(Math.random() * this.game.npcIds.length)];
        let toId = this.game.npcIds[Math.floor(Math.random() * this.game.npcIds.length)];
        if (toId === fromId)
            toId = "you";
        const seedNames = Object.keys(this.game.seedTypes);
        const seed = seedNames[Math.floor(Math.random() * seedNames.length)];
        const ok = this.executeTrade(fromId, toId, seed, 1, this.game.seedTypes[seed].cost);
        if (ok) {
            this.game.ui.pushLog(`${this.game.gardenersMeta[fromId].name} traded ${seed} to ${this.game.gardenersMeta[toId].name}`);
        }
    }
}
//# sourceMappingURL=tradeSystem.js.map