// @ts-nocheck
import { STORAGE_KEY, ROUND_SECONDS, PLAYER_SPEED_X, PLAYER_SPEED_DEPTH, seedTypes, gardenersMeta, initialState } from "../config/gameConfig.js";
import { loadState, saveState, resetState } from "../core/storage.js";
import { UiSystem } from "./systems/uiSystem.js";
import { SceneSystem } from "./systems/sceneSystem.js";
import { GrowthSystem } from "./systems/growthSystem.js";
import { TradeSystem } from "./systems/tradeSystem.js";
export class FlowerGardenGame {
    constructor(dom) {
        this.updateMovement = (now) => {
            if (!this.updateMovement.last)
                this.updateMovement.last = now;
            const dt = Math.min(0.05, (now - this.updateMovement.last) / 1000);
            this.updateMovement.last = now;
            const active = document.activeElement;
            const typing = active && ["INPUT", "SELECT", "TEXTAREA"].includes(active.tagName);
            let mx = 0;
            let md = 0;
            if (!typing) {
                if (this.keys.a || this.keys.arrowleft)
                    mx -= 1;
                if (this.keys.d || this.keys.arrowright)
                    mx += 1;
                if (this.keys.w || this.keys.arrowup)
                    md -= 1;
                if (this.keys.s || this.keys.arrowdown)
                    md += 1;
            }
            this.player.moving = mx !== 0 || md !== 0;
            if (this.player.moving) {
                const len = Math.hypot(mx, md) || 1;
                this.player.x += (mx / len) * PLAYER_SPEED_X * dt;
                this.player.depth += (md / len) * PLAYER_SPEED_DEPTH * dt;
                this.scene.keepPlayerInsideOwnPlot();
                this.scene.renderPlayer();
            }
            if (this.player.plantedCooldownMs > 0)
                this.player.plantedCooldownMs -= dt * 1000;
            if (this.player.waveCooldownMs > 0)
                this.player.waveCooldownMs -= dt * 1000;
            this.growth.tryCollectNearbyCoins();
            requestAnimationFrame(this.updateMovement);
        };
        this.dom = dom;
        this.seedTypes = seedTypes;
        this.gardenersMeta = gardenersMeta;
        this.gardenerIds = Object.keys(gardenersMeta);
        this.npcIds = this.gardenerIds.filter((id) => id !== "you");
        this.storageKey = STORAGE_KEY;
        this.roundSeconds = ROUND_SECONDS;
        this.state = loadState(this.storageKey, initialState);
        this.roundStartMs = Date.now();
        this.roundGoal = this.getGoalForLevel(this.state.level);
        this.roundProgress = 0;
        this.plotBounds = {};
        this.keys = {};
        this.player = {
            x: 120,
            depth: 0.66,
            moving: false,
            plantedCooldownMs: 0,
            waveCooldownMs: 0
        };
        this.ui = new UiSystem(this);
        this.scene = new SceneSystem(this);
        this.growth = new GrowthSystem(this);
        this.trade = new TradeSystem(this);
    }
    getGoalForLevel(level) {
        return 18 + level * 7;
    }
    persist() {
        saveState(this.storageKey, this.state);
    }
    resetRound() {
        this.roundStartMs = Date.now();
        this.roundGoal = this.getGoalForLevel(this.state.level);
        this.roundProgress = 0;
        this.ui.renderHUD();
    }
    waveToNearestGardener() {
        if (this.player.waveCooldownMs > 0)
            return;
        const npcs = Array.from(this.dom.gardenersLayer.querySelectorAll(".gardener"));
        if (!npcs.length)
            return;
        const playerPct = (this.player.x / this.dom.garden.clientWidth) * 100;
        let nearest = null;
        let best = Infinity;
        npcs.forEach((npc) => {
            const pct = parseFloat(npc.style.left || "0");
            const distance = Math.abs(pct - playerPct);
            if (distance < best) {
                best = distance;
                nearest = npc;
            }
        });
        this.dom.playerAvatar.classList.add("waving");
        if (nearest)
            nearest.classList.add("waving");
        setTimeout(() => {
            this.dom.playerAvatar.classList.remove("waving");
            if (nearest)
                nearest.classList.remove("waving");
        }, 1200);
        this.player.waveCooldownMs = 500;
        this.ui.setStatus("You waved to the nearby gardener.");
    }
    setupInputs() {
        window.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = true;
            const active = document.activeElement;
            const typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
            if ((key === " " || key === "e") && !typing) {
                event.preventDefault();
                this.growth.plantAtPlayer();
            }
            if (key === "r" && !typing) {
                event.preventDefault();
                this.growth.waterNearestPlant();
            }
            if (key === "f" && !typing) {
                event.preventDefault();
                this.waveToNearestGardener();
            }
            if (key.startsWith("arrow"))
                event.preventDefault();
        });
        window.addEventListener("keyup", (event) => {
            this.keys[event.key.toLowerCase()] = false;
        });
        this.dom.garden.addEventListener("click", (event) => {
            if (event.target.classList.contains("coin"))
                return;
            this.growth.plantAtPlayer();
        });
        this.dom.buySeedBtn.addEventListener("click", () => this.trade.userTrade("buy"));
        this.dom.sellSeedBtn.addEventListener("click", () => this.trade.userTrade("sell"));
        this.dom.waterBtn.addEventListener("click", () => this.growth.waterNearestPlant());
        this.dom.waveBtn.addEventListener("click", () => this.waveToNearestGardener());
        if (this.dom.instructionsBtn && this.dom.instructionsModal) {
            this.dom.instructionsBtn.addEventListener("click", () => {
                this.dom.instructionsModal.style.display = "flex";
            });
        }
        if (this.dom.closeInstructions && this.dom.instructionsModal) {
            this.dom.closeInstructions.addEventListener("click", () => {
                this.dom.instructionsModal.style.display = "none";
            });
            this.dom.instructionsModal.addEventListener("click", (event) => {
                if (event.target === this.dom.instructionsModal)
                    this.dom.instructionsModal.style.display = "none";
            });
        }
        if (this.dom.touchControls) {
            this.dom.touchControls.querySelectorAll("[data-touch-key]").forEach((btn) => {
                const key = btn.getAttribute("data-touch-key");
                const press = (event) => {
                    event.preventDefault();
                    this.keys[key] = true;
                };
                const release = (event) => {
                    event.preventDefault();
                    this.keys[key] = false;
                };
                btn.addEventListener("pointerdown", press);
                btn.addEventListener("pointerup", release);
                btn.addEventListener("pointercancel", release);
                btn.addEventListener("pointerleave", release);
            });
            this.dom.touchControls.querySelectorAll("[data-touch-action]").forEach((btn) => {
                btn.addEventListener("click", (event) => {
                    event.preventDefault();
                    const action = btn.getAttribute("data-touch-action");
                    if (action === "plant")
                        this.growth.plantAtPlayer();
                    if (action === "water")
                        this.growth.waterNearestPlant();
                    if (action === "wave")
                        this.waveToNearestGardener();
                    if (action === "help" && this.dom.instructionsModal)
                        this.dom.instructionsModal.style.display = "flex";
                    if (action === "home")
                        window.location.href = "../Home.html";
                });
            });
        }
        this.dom.shopBtn.addEventListener("click", () => {
            this.dom.shopModal.style.display = "flex";
            this.ui.setupShop();
        });
        this.dom.closeShop.addEventListener("click", () => {
            this.dom.shopModal.style.display = "none";
        });
        document.getElementById("resetBtn").addEventListener("click", () => {
            resetState(this.storageKey);
            location.reload();
        });
        window.addEventListener("resize", () => {
            this.scene.buildGardenScene();
        });
    }
    runLoops() {
        setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.roundStartMs) / 1000);
            if (elapsed >= this.roundSeconds) {
                this.state.level = Math.max(1, this.state.level - 1);
                this.ui.setStatus("Time up. Level reduced by 1 and round restarted.");
                this.resetRound();
            }
            this.ui.renderHUD();
        }, 400);
        setInterval(() => {
            const x = 20 + Math.random() * (this.dom.garden.clientWidth - 40);
            const y = 90 + Math.random() * 300;
            this.growth.createCoin(x, y, 1, "you");
        }, 3500);
        setInterval(() => this.growth.npcGrowCycle(), 6500);
        setInterval(() => this.trade.npcTradeCycle(), 7000);
    }
    init() {
        this.ui.setupSelectors();
        this.scene.buildGardenScene();
        this.player.x = this.scene.youPlotCenterX();
        this.scene.keepPlayerInsideOwnPlot();
        this.scene.renderPlayer();
        this.ui.setupShop();
        this.ui.renderInventory();
        this.resetRound();
        this.setupInputs();
        this.runLoops();
        requestAnimationFrame(this.updateMovement);
        this.ui.setStatus("Scalable mode active: modular systems loaded.");
    }
}
//# sourceMappingURL=FlowerGardenGame.js.map