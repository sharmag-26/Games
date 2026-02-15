// @ts-nocheck
export class SceneSystem {
    constructor(game) {
        this.game = game;
    }
    youPlotCenterX() {
        const bounds = this.game.plotBounds.you;
        if (!bounds)
            return 120;
        return (bounds.left + bounds.right) / 2;
    }
    keepPlayerInsideOwnPlot() {
        const bounds = this.game.plotBounds.you;
        if (!bounds)
            return;
        this.game.player.x = Math.max(bounds.left + 24, Math.min(bounds.right - 24, this.game.player.x));
        this.game.player.depth = Math.max(0.12, Math.min(0.95, this.game.player.depth));
    }
    renderPlayer() {
        const top = 128 + this.game.player.depth * 370;
        const scale = 0.58 + this.game.player.depth * 0.62;
        this.game.dom.playerAvatar.style.left = `${this.game.player.x}px`;
        this.game.dom.playerAvatar.style.top = `${top}px`;
        this.game.dom.playerAvatar.style.setProperty("--scale", scale.toFixed(3));
        const xParallax = (this.game.player.x / this.game.dom.garden.clientWidth - 0.5) * 10;
        const yParallax = (this.game.player.depth - 0.5) * 8;
        this.game.dom.garden.style.backgroundPosition = `${50 + xParallax}% ${50 + yParallax}%`;
        this.game.dom.playerAvatar.classList.toggle("walking", this.game.player.moving);
    }
    buildGardenScene() {
        this.game.dom.plotsLayer.innerHTML = "";
        this.game.dom.gardenersLayer.innerHTML = "";
        const section = 100 / this.game.gardenerIds.length;
        const centers = [];
        for (let i = 0; i < this.game.gardenerIds.length; i += 1)
            centers.push((i + 0.5) * section);
        this.game.gardenerIds.forEach((id, index) => {
            const widthPct = Math.max(14, section - 0.6);
            const centerPct = centers[index];
            const leftPct = centerPct - widthPct / 2;
            this.game.plotBounds[id] = {
                left: (leftPct / 100) * this.game.dom.garden.clientWidth,
                right: ((leftPct + widthPct) / 100) * this.game.dom.garden.clientWidth
            };
            const plot = document.createElement("div");
            plot.className = "plot";
            plot.style.left = `${leftPct}%`;
            plot.style.width = `${widthPct}%`;
            this.game.dom.plotsLayer.appendChild(plot);
            const label = document.createElement("div");
            label.className = "plot-label";
            label.style.left = `${centerPct}%`;
            label.textContent = `${this.game.gardenersMeta[id].name} plot`;
            this.game.dom.plotsLayer.appendChild(label);
            if (id !== "you") {
                const gardener = document.createElement("div");
                gardener.className = "gardener";
                gardener.style.left = `${centerPct}%`;
                gardener.style.zIndex = "8";
                gardener.innerHTML = `<div class='hat'></div><div class='head'></div><div class='body'></div><div class='arm left'></div><div class='arm right'></div><div class='tool'></div><div class='tag'>${this.game.gardenersMeta[id].name}</div>`;
                this.game.dom.gardenersLayer.appendChild(gardener);
            }
        });
        if (!this.game.player.x || this.game.player.x < 1)
            this.game.player.x = this.youPlotCenterX();
        this.keepPlayerInsideOwnPlot();
        this.renderPlayer();
    }
    ownerForX(x) {
        return this.game.gardenerIds.find((id) => x >= this.game.plotBounds[id].left && x <= this.game.plotBounds[id].right) || null;
    }
    getRandomXForOwner(ownerId) {
        const bounds = this.game.plotBounds[ownerId];
        if (!bounds)
            return 50;
        return bounds.left + 30 + Math.random() * Math.max(10, bounds.right - bounds.left - 60);
    }
}
//# sourceMappingURL=sceneSystem.js.map