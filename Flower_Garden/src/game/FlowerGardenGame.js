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
            if (this.player.insideBarn) {
                this.player.moving = false;
                this.scene.updateNpcMotion(dt);
                requestAnimationFrame(this.updateMovement);
                return;
            }
            if (this.player.moving) {
                if (mx !== 0)
                    this.player.facing = mx > 0 ? 1 : -1;
                const previousX = this.player.x;
                const previousDepth = this.player.depth;
                const len = Math.hypot(mx, md) || 1;
                this.player.x += (mx / len) * PLAYER_SPEED_X * dt;
                this.player.depth += (md / len) * PLAYER_SPEED_DEPTH * dt;
                const blocked = this.scene.applyPlayerMovementConstraints(previousX, previousDepth);
                if (blocked && this.player.zoneWarnMs <= 0) {
                    this.ui.setStatus("You cannot enter another gardener's private zone.");
                    this.player.zoneWarnMs = 700;
                }
                this.scene.renderPlayer();
            }
            if (this.player.plantedCooldownMs > 0)
                this.player.plantedCooldownMs -= dt * 1000;
            if (this.player.waveCooldownMs > 0)
                this.player.waveCooldownMs -= dt * 1000;
            if (this.player.zoneWarnMs > 0)
                this.player.zoneWarnMs -= dt * 1000;
            this.scene.updateNpcMotion(dt);
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
        this.ensureStateSchema();
        this.roundStartMs = Date.now();
        this.roundGoal = this.getGoalForLevel(this.state.level);
        this.roundProgress = 0;
        this.plotBounds = {};
        this.keys = {};
        this.player = {
            x: 120,
            depth: 0.66,
            facing: 1,
            moving: false,
            plantedCooldownMs: 0,
            waveCooldownMs: 0,
            zoneWarnMs: 0,
            insideBarn: false
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
    ensureStateSchema() {
        this.gardenerIds.forEach((id) => {
            if (!this.state.gardeners[id]) {
                this.state.gardeners[id] = structuredClone(initialState.gardeners[id]);
            }
            if (!this.state.gardeners[id].barnSeeds)
                this.state.gardeners[id].barnSeeds = {};
            Object.keys(this.seedTypes).forEach((seed) => {
                if (typeof this.state.gardeners[id].seeds[seed] !== "number")
                    this.state.gardeners[id].seeds[seed] = 0;
                if (typeof this.state.gardeners[id].barnSeeds[seed] !== "number")
                    this.state.gardeners[id].barnSeeds[seed] = 0;
            });
        });
        this.persist();
    }
    resetRound() {
        this.roundStartMs = Date.now();
        this.roundGoal = this.getGoalForLevel(this.state.level);
        this.roundProgress = 0;
        this.ui.renderHUD();
    }
    tryEnterOwnBarn(force = false) {
        if (this.player.insideBarn)
            return;
        const barnX = this.scene.getBarnX("you");
        if (barnX == null)
            return;
        const closeEnough = Math.abs(this.player.x - barnX) < 140;
        if (!force && !closeEnough) {
            this.ui.setStatus("Move near your barn door and press B to enter.");
            return;
        }
        this.player.insideBarn = true;
        this.keys = {};
        this.dom.garden.classList.add("inside-barn");
        this.dom.playerAvatar.style.display = "none";
        this.dom.barnModal.style.display = "flex";
        this.ui.renderBarnStorage("you");
        this.ui.setStatus("Inside your barn. Collect your stored seeds.");
    }
    exitBarn() {
        if (!this.player.insideBarn)
            return;
        this.player.insideBarn = false;
        this.dom.garden.classList.remove("inside-barn");
        this.dom.playerAvatar.style.display = "";
        this.dom.barnModal.style.display = "none";
        this.scene.renderPlayer();
        this.ui.setStatus("Exited barn.");
    }
    collectBarnSeeds() {
        const you = this.state.gardeners.you;
        let moved = 0;
        Object.keys(this.seedTypes).forEach((seed) => {
            const qty = you.barnSeeds[seed] || 0;
            if (qty > 0) {
                you.seeds[seed] += qty;
                you.barnSeeds[seed] = 0;
                moved += qty;
            }
        });
        if (moved === 0) {
            this.ui.setStatus("No stored seeds in your barn.");
            return;
        }
        this.persist();
        this.ui.renderInventory();
        this.ui.renderHUD();
        this.ui.renderBarnStorage("you");
        this.ui.setStatus(`Collected ${moved} stored seed${moved > 1 ? "s" : ""} from your barn.`);
    }
    addBarnSeedDelivery(ownerId, qty = 1) {
        const seedNames = Object.keys(this.seedTypes);
        for (let i = 0; i < qty; i += 1) {
            const seed = seedNames[Math.floor(Math.random() * seedNames.length)];
            this.state.gardeners[ownerId].barnSeeds[seed] += 1;
        }
    }
    barnDeliveryCycle() {
        this.gardenerIds.forEach((id) => {
            if (Math.random() < 0.55)
                this.addBarnSeedDelivery(id, 1 + Math.floor(Math.random() * 2));
        });
        this.persist();
        this.ui.renderInventory();
        if (this.player.insideBarn)
            this.ui.renderBarnStorage("you");
        const total = Object.values(this.state.gardeners.you.barnSeeds).reduce((sum, value) => sum + value, 0);
        if (total > 0)
            this.ui.setStatus(`New seed delivery reached your barn. Stored seeds: ${total}.`);
    }
    npcBarnCollectionCycle() {
        this.npcIds.forEach((ownerId) => {
            if (this.scene.isNpcInsideBarn(ownerId))
                return;
            const gardener = this.state.gardeners[ownerId];
            const stored = Object.values(gardener.barnSeeds).reduce((sum, qty) => sum + qty, 0);
            if (stored <= 0 || Math.random() > 0.55)
                return;
            this.scene.sendNpcInsideBarn(ownerId, 1800 + Math.floor(Math.random() * 900), () => {
                let moved = 0;
                Object.keys(this.seedTypes).forEach((seed) => {
                    const qty = gardener.barnSeeds[seed] || 0;
                    if (qty > 0) {
                        gardener.seeds[seed] += qty;
                        gardener.barnSeeds[seed] = 0;
                        moved += qty;
                    }
                });
                if (moved > 0) {
                    this.persist();
                    this.ui.renderInventory();
                    this.ui.pushLog(`${this.gardenersMeta[ownerId].name} collected ${moved} seed${moved > 1 ? "s" : ""} from their barn`);
                }
            });
        });
    }
    waveToNearestGardener() {
        if (this.player.waveCooldownMs > 0)
            return;
        const npcs = Array.from(this.dom.gardenersLayer.querySelectorAll(".gardener"));
        if (!npcs.length)
            return;
        const playerPct = (this.player.x / this.scene.playWidth()) * 100;
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
                if (this.player.insideBarn)
                    return;
                this.growth.plantAtPlayer();
            }
            if (key === "r" && !typing) {
                event.preventDefault();
                if (this.player.insideBarn)
                    return;
                this.growth.waterNearestPlant();
            }
            if (key === "f" && !typing) {
                event.preventDefault();
                if (this.player.insideBarn)
                    return;
                this.waveToNearestGardener();
            }
            if (key === "b" && !typing) {
                event.preventDefault();
                if (this.player.insideBarn)
                    this.exitBarn();
                else
                    this.tryEnterOwnBarn();
            }
            if (key === "escape" && this.player.insideBarn) {
                event.preventDefault();
                this.exitBarn();
            }
            if (key.startsWith("arrow"))
                event.preventDefault();
        });
        window.addEventListener("keyup", (event) => {
            this.keys[event.key.toLowerCase()] = false;
        });
        this.dom.garden.addEventListener("click", (event) => {
            const targetEl = event.target instanceof Element ? event.target : null;
            const barn = targetEl ? targetEl.closest(".plot-barn") : null;
            if (barn) {
                const owner = barn.dataset.owner;
                if (owner === "you")
                    this.tryEnterOwnBarn(true);
                else
                    this.ui.setStatus("You can only enter your own barn.");
                return;
            }
            if (targetEl && targetEl.classList.contains("coin"))
                return;
            if (this.player.insideBarn)
                return;
            const rect = this.dom.garden.getBoundingClientRect();
            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;
            const depth = this.scene.depthFromLocalY(localY);
            this.growth.plantAtPoint(localX, depth);
        });
        this.dom.buySeedBtn.addEventListener("click", () => this.trade.userTrade("buy"));
        this.dom.sellSeedBtn.addEventListener("click", () => this.trade.userTrade("sell"));
        this.dom.waterBtn.addEventListener("click", () => {
            if (this.player.insideBarn)
                return;
            this.growth.waterNearestPlant();
        });
        this.dom.waveBtn.addEventListener("click", () => {
            if (this.player.insideBarn)
                return;
            this.waveToNearestGardener();
        });
        if (this.dom.barnBtn) {
            this.dom.barnBtn.addEventListener("click", () => {
                if (this.player.insideBarn)
                    this.exitBarn();
                else
                    this.tryEnterOwnBarn();
            });
        }
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
                    if (action === "plant" && !this.player.insideBarn)
                        this.growth.plantAtPlayer();
                    if (action === "water" && !this.player.insideBarn)
                        this.growth.waterNearestPlant();
                    if (action === "wave" && !this.player.insideBarn)
                        this.waveToNearestGardener();
                    if (action === "barn") {
                        if (this.player.insideBarn)
                            this.exitBarn();
                        else
                            this.tryEnterOwnBarn();
                    }
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
        if (this.dom.closeBarn && this.dom.barnModal) {
            this.dom.closeBarn.addEventListener("click", () => this.exitBarn());
            this.dom.barnModal.addEventListener("click", (event) => {
                if (event.target === this.dom.barnModal)
                    this.exitBarn();
            });
        }
        if (this.dom.collectBarnBtn) {
            this.dom.collectBarnBtn.addEventListener("click", () => this.collectBarnSeeds());
        }
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
            const gardenHeight = this.dom.garden.clientHeight || 700;
            const playWidth = this.scene.playWidth();
            const x = 20 + Math.random() * Math.max(40, playWidth - 40);
            const y = 90 + Math.random() * Math.max(180, gardenHeight - 300);
            this.growth.createCoin(x, y, 1, "you");
        }, 3500);
        setInterval(() => this.growth.npcGrowCycle(), 3600);
        setInterval(() => this.trade.npcTradeCycle(), 7000);
        setInterval(() => this.barnDeliveryCycle(), 6500);
        setInterval(() => this.npcBarnCollectionCycle(), 5200);
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