// @ts-nocheck
const TILE = 24, WORLD_W = 300, WORLD_H = 300, STORAGE_KEY = "sandbox_civilization_state_v1", HIGH_SCORE_KEY = "sandbox_civilization_high_score_v1";
const WEATHER_TYPES = ["Sunny", "Cloudy", "Rain", "Storm", "Snow"], RAIDER_WAVE_MS = 120000, BULLET_SPEED = 0.016;
const MIN_POPULATION = 420, MAX_POPULATION = 20000;
const NAMES = ["Asha","Bren","Cato","Dina","Eryk","Faye","Gori","Hana","Ivo","Jiro","Kira","Luca","Mina","Nora","Olek","Pia","Quin","Ravi","Sana","Tari","Uma","Vik","Wren","Xara","Yuri","Zane"];

export class SandboxCivilizationGame {
  constructor() {
    this.canvas = document.getElementById("worldCanvas"); this.ctx = this.canvas?.getContext("2d");
    this.mapCanvas = document.getElementById("mapCanvas"); this.mapCtx = this.mapCanvas?.getContext("2d");
    this.raidWarningEl = document.getElementById("raidWarningSign");
    if (!this.canvas || !this.ctx) throw new Error("Game UI not found. Open Flower_Garden/index.html.");
    this.keys = {}; this.lastTs = 0; this.raiderWaveMs = 0; this.logs = []; this.worldTimeMs = 0; this.messageMs = 0; this.nextMessageMs = 12000; this.audioCtx = null; this.warTickMs = 0; this.govTickMs = 0; this.replySerial = 0; this.housingTickMs = 0;
    this.recentNpcMessages = [];
    this.sentMessageSet = new Set();
    this.highScore = this.loadHighScore();
    this.state = this.load() || this.newState(); this.ensureState();
  }

  newState() {
    const seed = Math.floor(Math.random() * 99999);
    const world = this.makeWorld(seed);
    const rivalCivilizations = this.createRivalCivilizations(world);
    return {
      worldSeed: seed, world, day: 1,
      player: { x: 20, y: 20, hp: 10, armor: 0, coins: 180, ammo: 80, facingX: 1, facingY: 0, moveTarget: null },
      weather: { type: "Sunny", tempC: 24, windKph: 8, changeMs: 45000 }, government: { type: "Democracy", taxRate: 10, lawStrictness: 50, approval: 65 },
      market: { stock: { food: 220, seeds: 150, fuel: 110, ammo: 190 }, prices: { food: 3, seeds: 4, fuel: 7, ammo: 5 }, restockMs: 0 },
      industry: { factoryMs: 0, reportMs: 0 },
      diplomacy: {
        factions: [
          { name: "North Guild", relation: 10, atWar: false, alliance: false, trade: false },
          { name: "Coast Union", relation: -5, atWar: false, alliance: false, trade: false },
          { name: "Iron Bloc", relation: -20, atWar: false, alliance: false, trade: false }
        ]
      },
      rival: {
        tickMs: 0,
        civilizations: rivalCivilizations,
        people: this.createRivalPeople(rivalCivilizations)
      },
      inventory: { wood: 60, stone: 52, food: 90, clothing: 30, metal: 35, fuel: 18, seeds: 20, science: 0 },
      villagers: this.createVillagers(MIN_POPULATION), animals: this.createAnimals(220), enemies: [], enemySpies: [],
      bullets: [], friendlyBullets: [], enemyBullets: [], explosions: [],
      comms: [{ from: "Council", text: "Welcome to Sandbox Civilization.", day: 1 }],
      command: { type: "none", raw: "", targetX: null, targetY: null, ttlMs: 0 },
      flags: { player: { color: "#2c7be5", symbol: "SC" }, raider: { color: "#b30000", symbol: "RX" } },
      raid: { active: false, wave: 0 }, social: { anger: 18 }, prison: { prisoners: [], tickMs: 0, capturedTotal: 0 }, gameOver: { active: false, reason: "", by: "" },
      buildings: [{ type: "government", x: 24, y: 24 }, { type: "house", x: 20, y: 24 }, { type: "house", x: 28, y: 24 }, { type: "shop", x: 24, y: 30 }, { type: "fort", x: 30, y: 20 }, { type: "market", x: 18, y: 28 }, { type: "shop", x: 34, y: 24 }, { type: "space_center", x: 38, y: 32 }],
      navy: { fishingBoats: [], defenseBoats: [], tradingShips: [], transportShips: [] }, space: { missions: [], explored: [], colonies: 0, satellites: 0, missileDefense: 0, moonBases: 0, prestige: 0, launchAttractMs: 0, astronaut: { active: false, x: 38, y: 32, phase: "idle", mission: "", lastReport: "" }, rocket: { active: false, x: 38, y: 32, phase: "idle", mission: "" } }
    };
  }

  ensureState() {
    if (!Array.isArray(this.state.world) || this.state.world.length !== WORLD_H) this.state.world = this.makeWorld(this.state.worldSeed || 4242);
    if (!Array.isArray(this.state.villagers)) this.state.villagers = this.createVillagers(MIN_POPULATION);
    if (!Array.isArray(this.state.animals)) this.state.animals = this.createAnimals(220);
    if (!Array.isArray(this.state.enemies)) this.state.enemies = [];
    if (!Array.isArray(this.state.enemySpies)) this.state.enemySpies = [];
    if (!Array.isArray(this.state.bullets)) this.state.bullets = [];
    if (!Array.isArray(this.state.friendlyBullets)) this.state.friendlyBullets = [];
    if (!Array.isArray(this.state.enemyBullets)) this.state.enemyBullets = [];
    if (!Array.isArray(this.state.explosions)) this.state.explosions = [];
    if (!this.state.player) this.state.player = { x: 20, y: 20, hp: 10, armor: 0, coins: 100, ammo: 30, facingX: 1, facingY: 0, moveTarget: null };
    if (!this.state.player.moveTarget || typeof this.state.player.moveTarget.x !== "number" || typeof this.state.player.moveTarget.y !== "number") this.state.player.moveTarget = null;
    if (!this.state.inventory) this.state.inventory = { wood: 0, stone: 0, food: 20, clothing: 0, metal: 0, fuel: 0, seeds: 0, science: 0 };
    if (!this.state.flags) this.state.flags = { player: { color: "#2c7be5", symbol: "SC" }, raider: { color: "#b30000", symbol: "RX" } };
    if (!this.state.command) this.state.command = { type: "none", raw: "", targetX: null, targetY: null, ttlMs: 0 };
    if (typeof this.state.command.ttlMs !== "number") this.state.command.ttlMs = 0;
    if (!this.state.government) this.state.government = { type: "Democracy", taxRate: 10, lawStrictness: 50, approval: 65 };
    if (typeof this.state.government.taxRate !== "number") this.state.government.taxRate = 10;
    if (typeof this.state.government.lawStrictness !== "number") this.state.government.lawStrictness = 50;
    if (typeof this.state.government.approval !== "number") this.state.government.approval = 65;
    if (!this.state.weather) this.state.weather = { type: "Sunny", tempC: 24, windKph: 8, changeMs: 45000 };
    if (!WEATHER_TYPES.includes(this.state.weather.type)) this.state.weather.type = "Sunny";
    if (typeof this.state.weather.tempC !== "number") this.state.weather.tempC = 24;
    if (typeof this.state.weather.windKph !== "number") this.state.weather.windKph = 8;
    if (typeof this.state.weather.changeMs !== "number") this.state.weather.changeMs = 45000;
    if (!this.state.market) this.state.market = { stock: { food: 220, seeds: 150, fuel: 110, ammo: 190 }, prices: { food: 3, seeds: 4, fuel: 7, ammo: 5 }, restockMs: 0 };
    if (!this.state.market.stock) this.state.market.stock = { food: 220, seeds: 150, fuel: 110, ammo: 190 };
    if (!this.state.market.prices) this.state.market.prices = { food: 3, seeds: 4, fuel: 7, ammo: 5 };
    if (typeof this.state.market.restockMs !== "number") this.state.market.restockMs = 0;
    if (!this.state.industry) this.state.industry = { factoryMs: 0, reportMs: 0 };
    if (typeof this.state.industry.factoryMs !== "number") this.state.industry.factoryMs = 0;
    if (typeof this.state.industry.reportMs !== "number") this.state.industry.reportMs = 0;
    if (!this.state.diplomacy || !Array.isArray(this.state.diplomacy.factions) || this.state.diplomacy.factions.length === 0) {
      this.state.diplomacy = { factions: [{ name: "North Guild", relation: 10, atWar: false, alliance: false, trade: false }, { name: "Coast Union", relation: -5, atWar: false, alliance: false, trade: false }, { name: "Iron Bloc", relation: -20, atWar: false, alliance: false, trade: false }] };
    }
    if (!this.state.rival) this.state.rival = { tickMs: 0, civilizations: this.createRivalCivilizations(), people: [] };
    if (!Array.isArray(this.state.rival.civilizations) || this.state.rival.civilizations.length === 0) this.state.rival.civilizations = this.createRivalCivilizations();
    if (!Array.isArray(this.state.rival.people)) this.state.rival.people = this.createRivalPeople(this.state.rival.civilizations);
    if (typeof this.state.rival.tickMs !== "number") this.state.rival.tickMs = 0;
    if (!this.state.raid) this.state.raid = { active: false, wave: 0 }; if (!this.state.social) this.state.social = { anger: 18 };
    if (!this.state.prison) this.state.prison = { prisoners: [], tickMs: 0, capturedTotal: 0 };
    if (!Array.isArray(this.state.prison.prisoners)) this.state.prison.prisoners = [];
    if (typeof this.state.prison.tickMs !== "number") this.state.prison.tickMs = 0;
    if (typeof this.state.prison.capturedTotal !== "number") this.state.prison.capturedTotal = 0;
    if (!this.state.comms) this.state.comms = []; if (!this.state.buildings) this.state.buildings = [];
    if (!this.state.navy) this.state.navy = { fishingBoats: [], defenseBoats: [], tradingShips: [], transportShips: [] };
    if (!Array.isArray(this.state.navy.fishingBoats)) this.state.navy.fishingBoats = [];
    if (!Array.isArray(this.state.navy.defenseBoats)) this.state.navy.defenseBoats = [];
    if (!Array.isArray(this.state.navy.tradingShips)) this.state.navy.tradingShips = [];
    if (!Array.isArray(this.state.navy.transportShips)) this.state.navy.transportShips = [];
    if (!this.state.space) this.state.space = { missions: [], explored: [], colonies: 0, satellites: 0, missileDefense: 0, moonBases: 0, prestige: 0 };
    if (!Array.isArray(this.state.space.missions)) this.state.space.missions = [];
    if (!Array.isArray(this.state.space.explored)) this.state.space.explored = [];
    if (typeof this.state.space.colonies !== "number") this.state.space.colonies = 0;
    if (typeof this.state.space.satellites !== "number") this.state.space.satellites = 0;
    if (typeof this.state.space.missileDefense !== "number") this.state.space.missileDefense = 0;
    if (typeof this.state.space.moonBases !== "number") this.state.space.moonBases = 0;
    if (typeof this.state.space.prestige !== "number") this.state.space.prestige = 0;
    if (typeof this.state.space.launchAttractMs !== "number") this.state.space.launchAttractMs = 0;
    if (!this.state.space.astronaut) this.state.space.astronaut = { active: false, x: 38, y: 32, phase: "idle", mission: "", lastReport: "" };
    if (!this.state.space.rocket) this.state.space.rocket = { active: false, x: 38, y: 32, phase: "idle", mission: "" };
    if (!this.state.buildings.some((b) => b.type === "space_center")) this.state.buildings.push({ type: "space_center", x: 38, y: 32 });
    this.state.villagers = this.state.villagers.filter((v) => v && typeof v === "object");
    this.state.animals = this.state.animals.filter((a) => a && typeof a === "object");
    this.state.enemies = this.state.enemies.filter((e) => e && typeof e === "object");
    this.state.enemySpies = this.state.enemySpies.filter((s) => s && typeof s === "object");
    this.state.bullets = this.state.bullets.filter((b) => b && typeof b === "object");
    this.state.friendlyBullets = this.state.friendlyBullets.filter((b) => b && typeof b === "object");
    this.state.enemyBullets = this.state.enemyBullets.filter((b) => b && typeof b === "object");
    this.state.explosions = this.state.explosions.filter((x) => x && typeof x === "object");
    this.state.buildings = this.state.buildings.filter((b) => b && typeof b.type === "string" && typeof b.x === "number" && typeof b.y === "number");
    this.state.comms = this.state.comms.filter((m) => m && typeof m.text === "string" && typeof m.from === "string");
    this.state.prison.prisoners = this.state.prison.prisoners.filter((p) => p && typeof p === "object");
    // Protect against legacy saves with extreme entity counts that can freeze rendering.
    if (this.state.villagers.length > MAX_POPULATION) this.state.villagers = this.state.villagers.slice(0, MAX_POPULATION);
    if (this.state.animals.length > 500) this.state.animals = this.state.animals.slice(0, 500);
    if (this.state.enemies.length > 900) this.state.enemies = this.state.enemies.slice(0, 900);
    if (this.state.enemySpies.length > 220) this.state.enemySpies = this.state.enemySpies.slice(0, 220);
    if (this.state.comms.length > 500) this.state.comms = this.state.comms.slice(-500);
    if (this.state.explosions.length > 600) this.state.explosions = this.state.explosions.slice(-600);
    this.sentMessageSet = new Set(this.state.comms.map((m) => m?.text).filter(Boolean));
    this.state.player.x = this.clamp(this.state.player.x, 10, 4, WORLD_W - 4); this.state.player.y = this.clamp(this.state.player.y, 10, 4, WORLD_H - 4);
    this.state.player.hp = this.clamp(this.state.player.hp, 10, 0, 10); this.state.player.ammo = this.clamp(this.state.player.ammo, 30, 0, 9999); this.state.player.coins = this.clamp(this.state.player.coins, 120, 0, 999999);
    if (this.state.villagers.length < MIN_POPULATION) this.state.villagers.push(...this.createVillagers(MIN_POPULATION - this.state.villagers.length));
    this.state.villagers.forEach((v, i) => { if (!v.id) v.id = `v-${Date.now()}-${i}-${Math.floor(Math.random() * 99999)}`; if (!v.name) v.name = NAMES[i % NAMES.length]; if (typeof v.x !== "number") v.x = Math.random() * WORLD_W; if (typeof v.y !== "number") v.y = Math.random() * WORLD_H; if (typeof v.vx !== "number") v.vx = Math.random() * 2 - 1; if (typeof v.vy !== "number") v.vy = Math.random() * 2 - 1; if (!v.brain) v.brain = { state: "patrol", decisionMs: 1000 + Math.random() * 2800, workMs: 600 + Math.random() * 900 }; if (typeof v.coins !== "number") v.coins = 20 + Math.floor(Math.random() * 70); if (typeof v.mood !== "number") v.mood = this.clamp(35 + Math.random() * 25, 45, 0, 100); if (typeof v.homeId !== "string") v.homeId = ""; });
    this.state.animals.forEach((a, i) => { if (!a.id) a.id = `a-${i}`; if (typeof a.x !== "number") a.x = Math.random() * WORLD_W; if (typeof a.y !== "number") a.y = Math.random() * WORLD_H; if (typeof a.vx !== "number") a.vx = Math.random() * 2 - 1; if (typeof a.vy !== "number") a.vy = Math.random() * 2 - 1; if (typeof a.harvestCooldownMs !== "number") a.harvestCooldownMs = 0; if (typeof a.yieldFood !== "number") a.yieldFood = 2; if (typeof a.yieldCloth !== "number") a.yieldCloth = 1; });
    this.state.rival.civilizations.forEach((c, i) => {
      if (!c.id) c.id = `rc-${i}`;
      if (!c.name) c.name = `Rival ${i + 1}`;
      if (typeof c.x !== "number" || typeof c.y !== "number") { const p = this.findRandomRivalBase(); c.x = p.x; c.y = p.y; }
      if (typeof c.population !== "number") c.population = 120 + Math.floor(Math.random() * 120);
      if (typeof c.military !== "number") c.military = 30 + Math.floor(Math.random() * 40);
      if (typeof c.treasury !== "number") c.treasury = 160 + Math.floor(Math.random() * 120);
      if (typeof c.relation !== "number") c.relation = -10;
      if (typeof c.atWar !== "boolean") c.atWar = false;
      if (typeof c.actionMs !== "number") c.actionMs = 6000 + Math.random() * 12000;
      if (!c.color) c.color = i % 2 ? "#c63f3f" : "#e18728";
    });
    this.state.rival.people = this.state.rival.people.filter((p) => p && typeof p === "object");
    this.state.rival.people.forEach((p, i) => {
      if (!p.id) p.id = `rp-${Date.now()}-${i}`;
      if (!p.name) p.name = `Rival${i}`;
      if (!p.civId) p.civId = this.state.rival.civilizations[0]?.id || "rc-1";
      if (typeof p.x !== "number" || typeof p.y !== "number") {
        const civ = this.state.rival.civilizations.find((c) => c.id === p.civId) || this.state.rival.civilizations[0];
        p.x = civ?.x || 20; p.y = civ?.y || 20;
      }
      if (typeof p.vx !== "number") p.vx = Math.random() * 2 - 1;
      if (typeof p.vy !== "number") p.vy = Math.random() * 2 - 1;
      if (!p.role) p.role = Math.random() < 0.2 ? "Guard" : "Worker";
      if (typeof p.workMs !== "number") p.workMs = 800 + Math.random() * 1800;
    });
    this.state.buildings.forEach((b) => { if (typeof b.entranceBlocked !== "boolean") b.entranceBlocked = false; });
    this.ensureFleet();
    this.updateHousing();
    this.syncRivalsToDiplomacy();
    this.reconcileRivalPeople();
  }
  updateHousing() {
    const houses = this.state.buildings.filter((b) => b.type === "house");
    const capacityPerHouse = 6;
    const slots = new Map(houses.map((h) => [`${h.x},${h.y}`, capacityPerHouse]));
    // Keep existing residents where possible.
    this.state.villagers.forEach((v) => {
      if (!v.homeId || !slots.has(v.homeId)) { v.homeId = ""; return; }
      const left = slots.get(v.homeId) || 0;
      if (left > 0) slots.set(v.homeId, left - 1);
      else v.homeId = "";
    });
    // Assign homeless villagers to nearest house with free slots.
    this.state.villagers.forEach((v) => {
      if (v.homeId) return;
      let bestId = "", bestD = Infinity;
      houses.forEach((h) => {
        const id = `${h.x},${h.y}`;
        const left = slots.get(id) || 0;
        if (left <= 0) return;
        const d = Math.hypot(h.x - v.x, h.y - v.y);
        if (d < bestD) { bestD = d; bestId = id; }
      });
      if (!bestId) return;
      v.homeId = bestId;
      slots.set(bestId, (slots.get(bestId) || 1) - 1);
    });
  }

  createVillagers(n) {
    const list = [];
    const cols = Math.max(1, Math.floor(Math.sqrt(n * (WORLD_W / WORLD_H))));
    const rows = Math.max(1, Math.ceil(n / cols));
    const cellW = WORLD_W / cols;
    const cellH = WORLD_H / rows;
    for (let i = 0; i < n; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellW + cellW * 0.2 + Math.random() * cellW * 0.6;
      const y = row * cellH + cellH * 0.2 + Math.random() * cellH * 0.6;
      list.push({
        id: `v-${Date.now()}-${i}-${Math.floor(Math.random() * 99999)}`,
        name: `${NAMES[i % NAMES.length]}${i > NAMES.length ? i : ""}`,
        x, y,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
        mood: this.clamp(35 + Math.random() * 25, 45, 0, 100),
        role: i % 7 === 0 ? "Trader" : i % 5 === 0 ? "Guard" : "Villager",
        coins: 20 + Math.floor(Math.random() * 70),
        homeId: null,
        brain: { state: "patrol", decisionMs: 1000 + Math.random() * 2800, workMs: 600 + Math.random() * 900 }
      });
    }
    return list;
  }
  createVillagerFromTemplate(template, idx) {
    const p = this.findLowDensityPosition();
    return {
      id: `v-${Date.now()}-${idx}-${Math.floor(Math.random() * 9999)}`,
      name: `${NAMES[Math.floor(Math.random() * NAMES.length)]}${100 + idx}`,
      x: p.x,
      y: p.y,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
      mood: this.clamp((template?.mood ?? 45) + (Math.random() * 14 - 7), 45, 0, 100),
      role: template?.role || (Math.random() < 0.18 ? "Trader" : Math.random() < 0.24 ? "Guard" : "Villager"),
      coins: 15 + Math.floor(Math.random() * 80),
      homeId: null,
      brain: { state: "patrol", decisionMs: 1000 + Math.random() * 2800, workMs: 600 + Math.random() * 900 }
    };
  }
  findLowDensityPosition() {
    let best = { x: Math.random() * WORLD_W, y: Math.random() * WORLD_H };
    let bestScore = Infinity;
    const tries = 20;
    for (let i = 0; i < tries; i += 1) {
      const x = Math.random() * WORLD_W, y = Math.random() * WORLD_H;
      let near = 0;
      const checks = Math.min(90, this.state?.villagers?.length || 0);
      for (let j = 0; j < checks; j += 1) {
        const v = this.state.villagers[(Math.random() * this.state.villagers.length) | 0];
        if (!v) continue;
        if (Math.hypot(v.x - x, v.y - y) < 9) near += 1;
      }
      if (near < bestScore) { bestScore = near; best = { x, y }; }
      if (bestScore <= 2) break;
    }
    return best;
  }
  growPopulationForNewDay() {
    const current = Math.max(this.state.villagers.length, MIN_POPULATION);
    const target = Math.min(MAX_POPULATION, current * 2);
    const needed = Math.max(0, target - this.state.villagers.length);
    if (!needed) return;
    const newborns = [];
    for (let i = 0; i < needed; i += 1) {
      const parent = this.state.villagers[Math.floor(Math.random() * Math.max(1, this.state.villagers.length))];
      newborns.push(this.createVillagerFromTemplate(parent, i));
    }
    this.state.villagers.push(...newborns);
    this.log(`Population growth: ${this.state.villagers.length} villagers.`);
  }
  createAnimals(n) { const kinds = [{ type: "cow", food: 4, cloth: 2 }, { type: "sheep", food: 2, cloth: 3 }, { type: "deer", food: 3, cloth: 1 }, { type: "goat", food: 2, cloth: 2 }], list = []; for (let i = 0; i < n; i += 1) { const k = kinds[Math.floor(Math.random() * kinds.length)]; list.push({ id: `a-${i}`, type: k.type, x: Math.random() * WORLD_W, y: Math.random() * WORLD_H, vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1, yieldFood: k.food, yieldCloth: k.cloth, harvestCooldownMs: 0 }); } return list; }
  findRandomRivalBase(world = null, maxTry = 400) {
    for (let i = 0; i < maxTry; i += 1) {
      const x = Math.random() * WORLD_W, y = Math.random() * WORLD_H;
      const t = world ? this.getTileFromWorld(world, x, y) : this.getTileAt(x, y);
      if (this.isWaterType(t.type)) continue;
      if (Math.hypot(x - this.state?.player?.x || 20, y - this.state?.player?.y || 20) < 60) continue;
      return { x, y };
    }
    return { x: WORLD_W * 0.7, y: WORLD_H * 0.7 };
  }
  createRivalCivilizations(world = null) {
    const a = this.findRandomRivalBase(world);
    const b = this.findRandomRivalBase(world);
    return [
      { id: "rc-1", name: "Red Dominion", color: "#cc3d3d", x: a.x, y: a.y, population: 170, military: 44, treasury: 260, relation: -25, atWar: false, actionMs: 9000 },
      { id: "rc-2", name: "Amber League", color: "#d4902b", x: b.x, y: b.y, population: 140, military: 36, treasury: 220, relation: -10, atWar: false, actionMs: 11000 }
    ];
  }
  syncRivalsToDiplomacy() {
    this.state.rival.civilizations.forEach((c) => {
      let f = this.state.diplomacy.factions.find((x) => x.name === c.name);
      if (!f) {
        f = { name: c.name, relation: c.relation, atWar: c.atWar, alliance: false, trade: false };
        this.state.diplomacy.factions.push(f);
      } else {
        c.relation = f.relation;
        c.atWar = !!f.atWar;
      }
    });
  }
  isWaterType(type) { return type === "water" || type === "river" || type === "ocean"; }
  findRandomWaterPos(maxTry = 300) {
    for (let i = 0; i < maxTry; i += 1) {
      const x = Math.random() * WORLD_W, y = Math.random() * WORLD_H;
      if (this.isWaterType(this.getTileAt(x, y).type)) return { x, y };
    }
    return { x: WORLD_W * 0.5, y: WORLD_H * 0.5 };
  }
  createBoat(kind, idx = 0) {
    const p = this.findRandomWaterPos();
    return { id: `${kind}-${Date.now()}-${idx}-${Math.floor(Math.random() * 9999)}`, type: kind, x: p.x, y: p.y, vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1, workMs: 1200 + Math.random() * 2200 };
  }
  ensureFleet() {
    if (this.state.navy.fishingBoats.length < 3) this.state.navy.fishingBoats.push(...Array.from({ length: 3 - this.state.navy.fishingBoats.length }, (_, i) => this.createBoat("fishing", i)));
    if (this.state.navy.defenseBoats.length < 2) this.state.navy.defenseBoats.push(...Array.from({ length: 2 - this.state.navy.defenseBoats.length }, (_, i) => this.createBoat("defense", i)));
    if (this.state.navy.tradingShips.length < 2) this.state.navy.tradingShips.push(...Array.from({ length: 2 - this.state.navy.tradingShips.length }, (_, i) => this.createBoat("trading", i)));
    if (this.state.navy.transportShips.length < 1) this.state.navy.transportShips.push(this.createBoat("transport", 0));
  }
  createRivalPerson(civ, idx = 0) {
    const a = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 16;
    return {
      id: `rp-${civ.id}-${Date.now()}-${idx}-${Math.floor(Math.random() * 9999)}`,
      civId: civ.id,
      civName: civ.name,
      name: `${civ.name.split(" ")[0]} ${idx + 1}`,
      x: civ.x + Math.cos(a) * r,
      y: civ.y + Math.sin(a) * r,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
      role: Math.random() < 0.22 ? "Guard" : "Worker",
      workMs: 800 + Math.random() * 1800
    };
  }
  createRivalPeople(civs) {
    const people = [];
    (civs || []).forEach((civ) => {
      const count = Math.max(18, Math.min(140, Math.floor((civ.population || 120) / 6)));
      for (let i = 0; i < count; i += 1) people.push(this.createRivalPerson(civ, i));
    });
    return people;
  }
  reconcileRivalPeople() {
    if (!Array.isArray(this.state.rival.people)) this.state.rival.people = [];
    const keepIds = new Set(this.state.rival.civilizations.map((c) => c.id));
    this.state.rival.people = this.state.rival.people.filter((p) => keepIds.has(p.civId));
    this.state.rival.civilizations.forEach((civ) => {
      const current = this.state.rival.people.filter((p) => p.civId === civ.id);
      const target = Math.max(18, Math.min(140, Math.floor((civ.population || 120) / 6)));
      if (current.length < target) {
        const start = current.length;
        for (let i = start; i < target; i += 1) this.state.rival.people.push(this.createRivalPerson(civ, i));
      } else if (current.length > target) {
        const remove = new Set(current.slice(target).map((p) => p.id));
        this.state.rival.people = this.state.rival.people.filter((p) => !remove.has(p.id));
      }
    });
  }
  weatherMoveMul() {
    const t = this.state.weather.type;
    if (t === "Storm") return 0.72;
    if (t === "Snow") return 0.78;
    if (t === "Rain") return 0.88;
    if (t === "Cloudy") return 0.95;
    return 1;
  }
  weatherHarvestMul() {
    const t = this.state.weather.type;
    if (t === "Rain") return 1.15;
    if (t === "Sunny") return 1.08;
    if (t === "Storm") return 0.78;
    if (t === "Snow") return 0.72;
    return 0.95;
  }
  updateWeather(dt) {
    this.state.weather.changeMs -= dt;
    if (this.state.weather.changeMs > 0) return;
    const current = this.state.weather.type;
    const transitions = {
      Sunny: ["Cloudy", "Sunny", "Rain"],
      Cloudy: ["Sunny", "Rain", "Storm", "Cloudy"],
      Rain: ["Cloudy", "Storm", "Rain", "Snow"],
      Storm: ["Rain", "Cloudy", "Storm"],
      Snow: ["Cloudy", "Snow", "Sunny"]
    };
    const nextPool = transitions[current] || WEATHER_TYPES;
    let next = nextPool[Math.floor(Math.random() * nextPool.length)];
    if (next === current && Math.random() < 0.7) next = nextPool[Math.floor(Math.random() * nextPool.length)];
    this.state.weather.type = next;
    if (next === "Sunny") { this.state.weather.tempC = 22 + Math.floor(Math.random() * 11); this.state.weather.windKph = 5 + Math.floor(Math.random() * 8); }
    else if (next === "Cloudy") { this.state.weather.tempC = 16 + Math.floor(Math.random() * 10); this.state.weather.windKph = 8 + Math.floor(Math.random() * 12); }
    else if (next === "Rain") { this.state.weather.tempC = 12 + Math.floor(Math.random() * 8); this.state.weather.windKph = 10 + Math.floor(Math.random() * 14); }
    else if (next === "Storm") { this.state.weather.tempC = 10 + Math.floor(Math.random() * 7); this.state.weather.windKph = 18 + Math.floor(Math.random() * 24); }
    else { this.state.weather.tempC = -2 + Math.floor(Math.random() * 7); this.state.weather.windKph = 10 + Math.floor(Math.random() * 10); }
    this.state.weather.changeMs = 20000 + Math.random() * 18000;
    this.pushNpcMessage("Weather Station", `Weather changed to ${this.state.weather.type} (${this.state.weather.tempC}C, ${this.state.weather.windKph}kph).`);
  }
  updateShips(dt) {
    const updateOne = (boat) => {
      boat.x += boat.vx * dt * 0.0014; boat.y += boat.vy * dt * 0.0014; boat.workMs -= dt;
      if (Math.random() < 0.02) { boat.vx = Math.random() * 2 - 1; boat.vy = Math.random() * 2 - 1; }
      boat.x = ((boat.x % WORLD_W) + WORLD_W) % WORLD_W; boat.y = ((boat.y % WORLD_H) + WORLD_H) % WORLD_H;
      if (!this.isWaterType(this.getTileAt(boat.x, boat.y).type)) { const w = this.findRandomWaterPos(); boat.x = w.x; boat.y = w.y; }
      if (boat.workMs <= 0) {
        if (boat.type === "fishing") this.state.inventory.food += 1 + (Math.random() < 0.35 ? 1 : 0);
        if (boat.type === "trading") { this.state.player.coins += 2 + Math.floor(Math.random() * 3); this.state.market.stock.fuel += Math.random() < 0.25 ? 1 : 0; }
        if (boat.type === "transport") { this.state.inventory.wood += Math.random() < 0.4 ? 1 : 0; this.state.inventory.stone += Math.random() < 0.35 ? 1 : 0; }
        if (boat.type === "defense" && this.state.enemies.length > 0) {
          const e = this.findNearestEnemy(boat.x, boat.y, 9);
          if (e) this.fireGun("villager", boat.x, boat.y, e.x, e.y);
        }
        boat.workMs = 1200 + Math.random() * 2200;
      }
    };
    this.state.navy.fishingBoats.forEach(updateOne);
    this.state.navy.defenseBoats.forEach(updateOne);
    this.state.navy.tradingShips.forEach(updateOne);
    this.state.navy.transportShips.forEach(updateOne);
  }
  launchSatellite() {
    if (this.state.inventory.metal < 8 || this.state.inventory.fuel < 6) { this.pushNpcMessage("Space Center", `Launch blocked: need metal>=8 and fuel>=6, have metal=${Math.floor(this.state.inventory.metal)} fuel=${Math.floor(this.state.inventory.fuel)}.`); return; }
    this.state.inventory.metal -= 8; this.state.inventory.fuel -= 6; this.state.space.satellites += 1; this.state.space.prestige += 2;
    const launchSite = this.findNearestBuilding(this.state.player.x, this.state.player.y, ["space_center"]) || { x: 38, y: 32 };
    this.state.space.launchAttractMs = Math.max(this.state.space.launchAttractMs, 14000);
    this.state.space.astronaut = { active: true, x: launchSite.x, y: launchSite.y, phase: "launch", mission: "satellite", lastReport: "" };
    this.state.space.rocket = { active: true, x: launchSite.x, y: launchSite.y, phase: "launch", mission: "satellite" };
    this.createExplosion(launchSite.x, launchSite.y, 1.8, "255,180,80");
    this.pushNpcMessage("Space Center", `Satellite launched. satellites=${this.state.space.satellites} prestige=${this.state.space.prestige}.`);
  }
  upgradeMissileDefense() {
    if (this.state.inventory.metal < 10 || this.state.inventory.fuel < 4) { this.pushNpcMessage("Defense Command", `Missile defense upgrade blocked: need metal>=10 fuel>=4.`); return; }
    this.state.inventory.metal -= 10; this.state.inventory.fuel -= 4; this.state.space.missileDefense += 1;
    this.pushNpcMessage("Defense Command", `Missile defense upgraded to level ${this.state.space.missileDefense}.`);
  }
  startMoonBase() {
    if (this.state.space.satellites < 1 || this.state.inventory.metal < 14 || this.state.inventory.fuel < 12) { this.pushNpcMessage("Space Center", `Moon base blocked: require satellites>=1 metal>=14 fuel>=12.`); return; }
    this.state.inventory.metal -= 14; this.state.inventory.fuel -= 12; this.state.space.moonBases += 1; this.state.space.colonies += 1; this.state.space.prestige += 6;
    const launchSite = this.findNearestBuilding(this.state.player.x, this.state.player.y, ["space_center"]) || { x: 38, y: 32 };
    this.state.space.launchAttractMs = Math.max(this.state.space.launchAttractMs, 16000);
    this.state.space.astronaut = { active: true, x: launchSite.x, y: launchSite.y, phase: "launch", mission: "moon_base", lastReport: "" };
    this.state.space.rocket = { active: true, x: launchSite.x, y: launchSite.y, phase: "launch", mission: "moon_base" };
    this.createExplosion(launchSite.x, launchSite.y, 2.2, "255,160,70");
    this.pushNpcMessage("Space Center", `Moon base established. moonBases=${this.state.space.moonBases} colonies=${this.state.space.colonies}.`);
  }
  exploreSpace() {
    const dest = document.getElementById("spaceDestination")?.value || "orbit";
    const costFuel = dest === "orbit" ? 4 : dest === "moon" ? 8 : dest === "mars" ? 12 : 10;
    if (this.state.inventory.fuel < costFuel) { this.pushNpcMessage("Mission Control", `Exploration blocked for ${dest}: need fuel>=${costFuel}.`); return; }
    this.state.inventory.fuel -= costFuel;
    const duration = 12000 + Math.random() * 18000;
    this.state.space.missions.push({ id: `m-${Date.now()}-${dest}`, destination: dest, etaMs: duration, startedDay: this.state.day });
    const launchSite = this.findNearestBuilding(this.state.player.x, this.state.player.y, ["space_center"]) || { x: 38, y: 32 };
    this.state.space.launchAttractMs = Math.max(this.state.space.launchAttractMs, 12000);
    this.state.space.astronaut = { active: true, x: launchSite.x, y: launchSite.y, phase: "launch", mission: dest, lastReport: "" };
    this.state.space.rocket = { active: true, x: launchSite.x, y: launchSite.y, phase: "launch", mission: dest };
    this.createExplosion(launchSite.x, launchSite.y, 1.6, "255,170,80");
    this.pushNpcMessage("Mission Control", `Mission launched to ${dest}. ETA ${Math.floor(duration / 1000)}s.`);
  }
  updateSpaceAndMissiles(dt) {
    this.state.space.launchAttractMs = Math.max(0, (this.state.space.launchAttractMs || 0) - dt);
    const launchSite = this.findNearestBuilding(this.state.player.x, this.state.player.y, ["space_center"]) || { x: 38, y: 32 };
    const astro = this.state.space.astronaut;
    const rocket = this.state.space.rocket;
    const reportByMission = {
      satellite: "We can see the world grid clearly. Satellite is deploying communication arrays.",
      moon_base: "Lunar surface is visible with crater fields. Base module telemetry is stable.",
      orbit: "Cloud bands and coastlines are visible from low orbit.",
      moon: "Moon approach confirmed. Surface shadows and ridges are in view.",
      mars: "Mars horizon is red-orange with major canyon structures visible.",
      asteroid: "Multiple asteroids detected with high-metal signatures.",
      europa: "Europa ice shell patterns are visible with possible fracture lines."
    };
    if (astro?.active) {
      astro.phase = this.state.space.launchAttractMs > 9000 ? "prep" : this.state.space.launchAttractMs > 3500 ? "launch" : "orbit";
      if (astro.lastReport !== astro.phase) {
        if (astro.phase === "prep") this.pushNpcMessage("Astronaut", "Pre-launch checks complete. Guidance, fuel, and life support are green.");
        else if (astro.phase === "launch") this.pushNpcMessage("Astronaut", "Liftoff confirmed. Rocket is climbing through the lower atmosphere.");
        else this.pushNpcMessage("Astronaut", reportByMission[astro.mission] || "We are in space and instruments are collecting data.");
        astro.lastReport = astro.phase;
      }
      if (astro.phase === "prep") {
        astro.x += (launchSite.x - astro.x) * 0.08;
        astro.y += (launchSite.y - astro.y) * 0.08;
      } else if (astro.phase === "launch") {
        astro.y -= 0.0012 * dt;
      } else {
        astro.x += Math.sin(this.worldTimeMs * 0.0012) * 0.003 * dt;
        astro.y += Math.cos(this.worldTimeMs * 0.0015) * 0.003 * dt;
      }
      if (this.state.space.launchAttractMs <= 0) {
        astro.active = false;
        astro.phase = "idle";
        astro.lastReport = "idle";
      }
    }
    if (rocket?.active) {
      rocket.phase = this.state.space.launchAttractMs > 3500 ? "launch" : "space";
      if (rocket.phase === "launch") {
        rocket.y -= 0.0025 * dt;
      } else {
        rocket.x += Math.sin(this.worldTimeMs * 0.0018) * 0.002 * dt;
        rocket.y += Math.cos(this.worldTimeMs * 0.0014) * 0.0016 * dt;
      }
      if (this.state.space.launchAttractMs <= 0) {
        rocket.active = false;
        rocket.phase = "idle";
        rocket.x = launchSite.x;
        rocket.y = launchSite.y;
      }
    }
    for (let i = this.state.space.missions.length - 1; i >= 0; i -= 1) {
      const m = this.state.space.missions[i];
      m.etaMs -= dt;
      if (m.etaMs <= 0) {
        if (!this.state.space.explored.includes(m.destination)) this.state.space.explored.push(m.destination);
        this.state.inventory.science += 2 + (m.destination === "mars" ? 3 : 1);
        this.state.inventory.metal += m.destination === "asteroid" ? 6 : 2;
        this.state.space.prestige += 1 + (m.destination === "mars" ? 2 : 0);
        this.pushNpcMessage("Mission Control", `Mission completed: ${m.destination}. science=${Math.floor(this.state.inventory.science)} metal=${Math.floor(this.state.inventory.metal)}.`);
        if (astro?.active && astro.mission === m.destination) {
          astro.active = false;
          astro.phase = "idle";
          astro.lastReport = "idle";
          astro.x = launchSite.x;
          astro.y = launchSite.y;
        }
        if (rocket?.active && rocket.mission === m.destination) {
          rocket.active = false;
          rocket.phase = "idle";
          rocket.x = launchSite.x;
          rocket.y = launchSite.y;
        }
        this.state.space.missions.splice(i, 1);
      }
    }
    if (this.state.space.missileDefense > 0 && this.state.enemies.length > 0 && Math.random() < 0.028 * this.state.space.missileDefense) {
      const target = this.state.enemies[Math.floor(Math.random() * this.state.enemies.length)];
      if (!target) return;
      const blastRadius = 1.8 + this.state.space.missileDefense * 0.35;
      let kills = 0;
      for (let i = this.state.enemies.length - 1; i >= 0; i -= 1) {
        const e = this.state.enemies[i];
        const d = Math.hypot(e.x - target.x, e.y - target.y);
        if (d <= blastRadius) {
          kills += 1;
          this.createExplosion(e.x, e.y, e.boss ? 2.3 : 1.6, "255,70,50");
          this.state.enemies.splice(i, 1);
        }
      }
      if (kills > 0) {
        this.playExplosionSound();
        this.pushNpcMessage("Defense Command", `Missile strike destroyed ${kills} hostile units.`);
      }
    }
  }
  clamp(v, fb, min, max) { const n = typeof v === "number" && !Number.isNaN(v) ? v : fb; return Math.min(max, Math.max(min, n)); }
  noise(x, y, seed) { const s = Math.sin((x * 12.9898 + y * 78.233 + seed * 0.019) * 0.17) * 43758.5453; return s - Math.floor(s); }
  makeWorld(seed) {
    const world = [];
    for (let y = 0; y < WORLD_H; y += 1) {
      const row = [];
      for (let x = 0; x < WORLD_W; x += 1) {
        const n = this.noise(x, y, seed);
        const n2 = this.noise(x * 0.45, y * 0.45, seed + 23);
        const edgeDist = Math.min(x, y, WORLD_W - 1 - x, WORLD_H - 1 - y);
        const oceanBand = edgeDist < 26;
        const deepOceanBand = edgeDist < 15;

        const riverY = WORLD_H * 0.5 + Math.sin((x + seed * 0.07) * 0.04) * 22 + Math.sin((x + seed * 0.13) * 0.012) * 12;
        const riverWidth = 0.85 + (this.noise(x * 0.8, 11, seed + 71) * 0.8);
        const riverContinuity = this.noise(x * 0.12, y * 0.12, seed + 177);
        const inRiver = Math.abs(y - riverY) < riverWidth && riverContinuity < 0.52;

        let type = "land";
        if (deepOceanBand && n2 < 0.74) type = "ocean";
        else if (oceanBand && n2 < 0.5) type = "ocean";
        else if (inRiver) type = "river";
        else if (n < 0.06) type = "water";
        else if (n < 0.28) type = "forest";
        else if (n < 0.36) type = "fruit";
        else if (n < 0.43) type = "hill";
        else if (n < 0.48) type = "ore";

        row.push({ type, regrow: 0 });
      }
      world.push(row);
    }
    return world;
  }
  getTileFromWorld(world, x, y) {
    const ix = ((Math.floor(x) % WORLD_W) + WORLD_W) % WORLD_W;
    const iy = ((Math.floor(y) % WORLD_H) + WORLD_H) % WORLD_H;
    const t = world?.[iy]?.[ix];
    return t && t.type ? t : { type: "land", regrow: 0 };
  }
  getTileAt(x, y) {
    if (!this.state?.world) return { type: "land", regrow: 0 };
    return this.getTileFromWorld(this.state.world, x, y);
  }
  getTileRefAt(x, y) {
    if (!this.state?.world) return null;
    const ix = ((Math.floor(x) % WORLD_W) + WORLD_W) % WORLD_W;
    const iy = ((Math.floor(y) % WORLD_H) + WORLD_H) % WORLD_H;
    return this.state.world?.[iy]?.[ix] || null;
  }

  load() { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return null; return JSON.parse(raw); } catch { return null; } }
  save() {
    this.updateHighScore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    this.saveHighScore();
    this.log("Progress saved.");
  }
  reset() { localStorage.removeItem(STORAGE_KEY); this.state = this.newState(); this.log("World reset."); }
  loadHighScore() {
    try {
      const raw = localStorage.getItem(HIGH_SCORE_KEY);
      if (!raw) return { day: 1, population: MIN_POPULATION, coins: 0, score: 0 };
      const hs = JSON.parse(raw);
      return {
        day: Math.max(1, Math.floor(hs.day || 1)),
        population: Math.max(MIN_POPULATION, Math.floor(hs.population || MIN_POPULATION)),
        coins: Math.max(0, Math.floor(hs.coins || 0)),
        score: Math.max(0, Math.floor(hs.score || 0))
      };
    } catch {
      return { day: 1, population: MIN_POPULATION, coins: 0, score: 0 };
    }
  }
  saveHighScore() { localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(this.highScore)); }
  saveHighScoreNow() {
    this.updateHighScore();
    this.saveHighScore();
    this.log(`High score saved: ${this.highScore.score}`);
  }
  reloadHighScore() {
    this.highScore = this.loadHighScore();
    this.log(`High score loaded: ${this.highScore.score}`);
  }
  computeScore() {
    return Math.floor(this.state.day * 120 + this.state.villagers.length * 0.7 + this.state.player.coins * 0.35 + this.state.space.prestige * 20);
  }
  updateHighScore() {
    const score = this.computeScore();
    const improved = score > (this.highScore?.score || 0);
    if (!improved) return;
    this.highScore = {
      day: Math.max(this.highScore.day || 1, this.state.day),
      population: Math.max(this.highScore.population || MIN_POPULATION, this.state.villagers.length),
      coins: Math.max(this.highScore.coins || 0, Math.floor(this.state.player.coins || 0)),
      score
    };
    this.saveHighScore();
    if (score % 2500 < 120) this.pushNpcMessage("Council", `New high score: ${score}.`);
  }

  init() {
    this.bindUi(); this.resizeCanvas();
    this.canvas.tabIndex = 0;
    this.canvas.focus();
    window.addEventListener("resize", () => this.resizeCanvas());
    const onKeyDown = (e) => {
      const k = String(e.key || "").toLowerCase();
      const c = String(e.code || "").toLowerCase();
      const tag = String(e.target?.tagName || "").toLowerCase();
      const inputType = String(e.target?.type || "").toLowerCase();
      const isTextInput = tag === "textarea" || (tag === "input" && ["text", "search", "email", "password", "url", "tel", "number"].includes(inputType));
      const isTyping = isTextInput || e.target?.id === "messageInput";
      const actionKey = k === "h" || c === "keyh" || k === "j" || c === "keyj" || k === "c" || c === "keyc" || k === "q" || c === "keyq" || k === "t" || c === "keyt";
      if (actionKey) e.preventDefault();
      if (isTyping && !actionKey && k !== "enter") return;
      if (k) this.keys[k] = true;
      if (c) this.keys[c] = true;
      if (k.startsWith("arrow") || ["w", "a", "s", "d", " "].includes(k) || ["keyw", "keya", "keys", "keyd", "space"].includes(c)) e.preventDefault();
      if (k === "h" || c === "keyh") this.harvestNearestAnimal();
      if (k === "j" || c === "keyj") this.fireGun();
      if (k === "c" || c === "keyc") this.captureNearestHostile();
      if (k === "q" || c === "keyq") this.chopNearestTree();
      if (k === "t" || c === "keyt") this.plantSeedNearPlayer();
    };
    const onKeyUp = (e) => {
      const k = String(e.key || "").toLowerCase();
      const c = String(e.code || "").toLowerCase();
      if (k) this.keys[k] = false;
      if (c) this.keys[c] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => { this.keys = {}; });
    // Fallback for environments where key events are attached to document target only.
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    this.canvas.addEventListener("click", (e) => {
      this.canvas.focus();
      const t = this.screenToWorld(e.clientX, e.clientY);
      this.state.player.moveTarget = t;
      this.log(`Moving to (${Math.floor(t.x)}, ${Math.floor(t.y)}).`);
    });
    this.canvas.addEventListener("contextmenu", (e) => { e.preventDefault(); this.fireGun(); });
    requestAnimationFrame((t) => this.loop(t));
  }

  bindUi() {
    document.querySelectorAll("button").forEach((btn) => {
      if (!btn.getAttribute("type")) btn.setAttribute("type", "button");
    });
    document.getElementById("saveBtn")?.addEventListener("click", () => this.save());
    document.getElementById("loadBtn")?.addEventListener("click", () => { const loaded = this.load(); if (loaded) { this.state = loaded; this.ensureState(); this.log("Progress loaded."); } });
    document.getElementById("saveHighScoreBtn")?.addEventListener("click", () => this.saveHighScoreNow());
    document.getElementById("loadHighScoreBtn")?.addEventListener("click", () => this.reloadHighScore());
    document.getElementById("resetBtn")?.addEventListener("click", () => this.reset());
    document.getElementById("sendMessageBtn")?.addEventListener("click", () => this.sendPlayerMessage());
    document.getElementById("messageInput")?.addEventListener("keydown", (e) => { if (e.key === "Enter") this.sendPlayerMessage(); });
    document.querySelectorAll("[data-build]").forEach((btn) => btn.addEventListener("click", (e) => this.buildAtPlayer(e.currentTarget?.dataset?.build || "")));
    document.getElementById("blockEntranceBtn")?.addEventListener("click", () => this.toggleNearestEntrance(true));
    document.getElementById("unblockEntranceBtn")?.addEventListener("click", () => this.toggleNearestEntrance(false));
    const govType = document.getElementById("govType");
    if (govType) { govType.value = this.state.government.type || "Democracy"; govType.addEventListener("change", () => { this.state.government.type = govType.value; }); }
    const taxRate = document.getElementById("taxRate");
    const taxText = document.getElementById("taxText");
    if (taxRate) {
      taxRate.value = String(Math.floor(this.state.government.taxRate));
      if (taxText) taxText.textContent = `${Math.floor(this.state.government.taxRate)}%`;
      taxRate.addEventListener("input", () => {
        this.state.government.taxRate = this.clamp(Number(taxRate.value), 10, 0, 50);
        if (taxText) taxText.textContent = `${Math.floor(this.state.government.taxRate)}%`;
      });
    }
    const lawRate = document.getElementById("lawRate");
    if (lawRate) {
      lawRate.value = String(Math.floor(this.state.government.lawStrictness));
      lawRate.addEventListener("input", () => { this.state.government.lawStrictness = this.clamp(Number(lawRate.value), 50, 0, 100); });
    }
    document.querySelectorAll("[data-shop-buy]").forEach((btn) => btn.addEventListener("click", (e) => this.buyFromShop(e.currentTarget?.dataset?.shopBuy || "")));
    document.getElementById("satelliteBtn")?.addEventListener("click", () => this.launchSatellite());
    document.getElementById("missileDefenseBtn")?.addEventListener("click", () => this.upgradeMissileDefense());
    document.getElementById("moonBaseBtn")?.addEventListener("click", () => this.startMoonBase());
    document.getElementById("exploreSpaceBtn")?.addEventListener("click", () => this.exploreSpace());
    document.getElementById("applyFlagBtn")?.addEventListener("click", () => { const c = document.getElementById("playerFlagColor")?.value || "#2c7be5"; const s = (document.getElementById("playerFlagSymbol")?.value || "SC").slice(0, 2).toUpperCase(); this.state.flags.player = { color: c, symbol: s }; });
    document.getElementById("allianceBtn")?.addEventListener("click", () => this.applyDiplomacy("alliance"));
    document.getElementById("tradeDealBtn")?.addEventListener("click", () => this.applyDiplomacy("trade"));
    document.getElementById("peaceBtn")?.addEventListener("click", () => this.applyDiplomacy("peace"));
    const warBtn = document.getElementById("warBtn");
    warBtn?.addEventListener("pointerdown", (e) => {
      e.preventDefault?.();
      e.stopPropagation?.();
      this.log("Declare War button pointerdown.");
      this.forceDeclareWar();
    });
    warBtn?.addEventListener("click", (e) => {
      e.preventDefault?.();
      e.stopPropagation?.();
      this.log("Declare War button pressed.");
      this.forceDeclareWar();
    });
    const mapDialog = document.getElementById("mapDialog");
    document.getElementById("mapBtn")?.addEventListener("click", () => { mapDialog?.showModal?.(); this.drawMap(); });
    document.getElementById("closeMapBtn")?.addEventListener("click", () => mapDialog?.close?.());
    this.mapCanvas?.addEventListener("click", (e) => {
      const rect = this.mapCanvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (this.mapCanvas.width / Math.max(1, rect.width));
      const sy = (e.clientY - rect.top) * (this.mapCanvas.height / Math.max(1, rect.height));
      const tx = this.clamp((sx / this.mapCanvas.width) * WORLD_W, this.state.player.x, 0, WORLD_W - 1);
      const ty = this.clamp((sy / this.mapCanvas.height) * WORLD_H, this.state.player.y, 0, WORLD_H - 1);
      this.state.player.x = tx;
      this.state.player.y = ty;
      this.state.player.moveTarget = null;
      this.log(`Moved to (${Math.floor(tx)}, ${Math.floor(ty)}) from map.`);
      mapDialog?.close?.();
    });
    this.refreshFactionSelect();
  }
  getBuildCost(type) {
    const costs = {
      government: { wood: 30, stone: 40, metal: 10 },
      monument: { wood: 20, stone: 50, metal: 8 },
      shop: { wood: 20, stone: 12, metal: 4 },
      house: { wood: 14, stone: 8, metal: 0 },
      fort: { wood: 25, stone: 30, metal: 6 },
      jail: { wood: 18, stone: 24, metal: 5 },
      court: { wood: 16, stone: 26, metal: 6 },
      factory: { wood: 22, stone: 22, metal: 16 },
      port: { wood: 26, stone: 14, metal: 6 },
      airbase: { wood: 24, stone: 28, metal: 14 },
      space_center: { wood: 28, stone: 34, metal: 22 }
    };
    return costs[type] || { wood: 12, stone: 10, metal: 2 };
  }
  buildAtPlayer(type) {
    if (!type) return;
    const x = Math.round(this.state.player.x), y = Math.round(this.state.player.y);
    const occupied = this.state.buildings.some((b) => Math.hypot(b.x - x, b.y - y) < 1.0);
    if (occupied) { this.pushNpcMessage("Builder", "Cannot build here: location occupied."); return; }
    // Sandbox mode: player can build anything instantly at current location.
    this.state.buildings.push({ type, x, y });
    if (type === "house") this.updateHousing();
    this.log(`Built ${type} at (${x}, ${y}).`);
    this.pushNpcMessage("Builder", `${type} built at your location (${x}, ${y}).`);
  }
  toggleNearestEntrance(blocked = true, silent = false) {
    const b = this.findNearestBuilding(this.state.player.x, this.state.player.y, null, true);
    if (!b || Math.hypot(b.x - this.state.player.x, b.y - this.state.player.y) > 4) {
      if (!silent) this.pushNpcMessage("Builder", "No nearby building entrance to change.");
      return false;
    }
    b.entranceBlocked = blocked;
    this.log(`${blocked ? "Blocked" : "Unblocked"} entrance at ${b.type} (${Math.floor(b.x)}, ${Math.floor(b.y)}).`);
    if (!silent) this.pushNpcMessage("Builder", `${b.type} entrance ${blocked ? "blocked" : "unblocked"}.`);
    return true;
  }
  captureHostileNear(x, y, range = 2.4, by = "Guard", silent = false) {
    if (!this.state.prison) this.state.prison = { prisoners: [], tickMs: 0, capturedTotal: 0 };
    if (!Array.isArray(this.state.prison.prisoners)) this.state.prison.prisoners = [];
    if (typeof this.state.prison.capturedTotal !== "number") this.state.prison.capturedTotal = 0;
    const jail = this.findNearestBuilding(x, y, ["jail"]);
    if (!jail) return false;
    const enemy = this.findNearestEnemy(x, y, range);
    let captured = null;
    if (enemy) {
      this.state.enemies = this.state.enemies.filter((e) => e.id !== enemy.id);
      captured = { id: `p-${Date.now()}-${Math.floor(Math.random() * 9999)}`, name: enemy.name, kind: "enemy", jailId: `${jail.x},${jail.y}`, capturedDay: this.state.day, custodyMs: 0 };
    } else {
      let bestSpy = null, bd = range;
      this.state.enemySpies.forEach((s) => {
        const d = Math.hypot(s.x - x, s.y - y);
        if (d < bd) { bd = d; bestSpy = s; }
      });
      if (bestSpy) {
        this.state.enemySpies = this.state.enemySpies.filter((s) => s.id !== bestSpy.id);
        captured = { id: `p-${Date.now()}-${Math.floor(Math.random() * 9999)}`, name: bestSpy.name, kind: "spy", jailId: `${jail.x},${jail.y}`, capturedDay: this.state.day, custodyMs: 0 };
      }
    }
    if (!captured) return false;
    this.state.prison.prisoners.push(captured);
    this.state.prison.capturedTotal += 1;
    this.createExplosion(x, y, 0.7, "140,220,255");
    if (!silent) this.pushNpcMessage(by, `${captured.name} captured and transferred to jail. Prisoners now ${this.state.prison.prisoners.length}.`);
    this.log(`${by} captured ${captured.kind}: ${captured.name}.`);
    return true;
  }
  captureNearestHostile() {
    let jail = this.findNearestBuilding(this.state.player.x, this.state.player.y, ["jail"]);
    if (!jail) {
      const jx = Math.round(this.state.player.x + 1);
      const jy = Math.round(this.state.player.y);
      jail = { type: "jail", x: ((jx % WORLD_W) + WORLD_W) % WORLD_W, y: ((jy % WORLD_H) + WORLD_H) % WORLD_H, entranceBlocked: false };
      this.state.buildings.push(jail);
      this.pushNpcMessage("Guard", `Emergency jail established at (${Math.floor(jail.x)}, ${Math.floor(jail.y)}).`);
    }
    if (this.captureHostileNear(this.state.player.x, this.state.player.y, 4.2, "Guard")) return;

    // Fallback: capture nearest hostile in a wider radius so capture action is reliable.
    const nearestEnemy = this.findNearestEnemy(this.state.player.x, this.state.player.y, 40);
    if (nearestEnemy) {
      this.state.enemies = this.state.enemies.filter((e) => e.id !== nearestEnemy.id);
      this.state.prison.prisoners.push({
        id: `p-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        name: nearestEnemy.name,
        kind: "enemy",
        jailId: `${jail.x},${jail.y}`,
        capturedDay: this.state.day,
        custodyMs: 0
      });
      this.state.prison.capturedTotal += 1;
      this.createExplosion(nearestEnemy.x, nearestEnemy.y, 0.7, "140,220,255");
      this.pushNpcMessage("Guard", `${nearestEnemy.name} captured and transferred to jail. Prisoners now ${this.state.prison.prisoners.length}.`);
      this.log(`Guard captured enemy: ${nearestEnemy.name}.`);
      return;
    }

    let bestSpy = null, bd = 40;
    this.state.enemySpies.forEach((s) => {
      const d = Math.hypot(s.x - this.state.player.x, s.y - this.state.player.y);
      if (d < bd) { bd = d; bestSpy = s; }
    });
    if (bestSpy) {
      this.state.enemySpies = this.state.enemySpies.filter((s) => s.id !== bestSpy.id);
      this.state.prison.prisoners.push({
        id: `p-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        name: bestSpy.name,
        kind: "spy",
        jailId: `${jail.x},${jail.y}`,
        capturedDay: this.state.day,
        custodyMs: 0
      });
      this.state.prison.capturedTotal += 1;
      this.createExplosion(bestSpy.x, bestSpy.y, 0.7, "140,220,255");
      this.pushNpcMessage("Guard", `${bestSpy.name} captured and transferred to jail. Prisoners now ${this.state.prison.prisoners.length}.`);
      this.log(`Guard captured spy: ${bestSpy.name}.`);
      return;
    }

    this.pushNpcMessage("Guard", "No enemy or spy available to capture right now.");
  }
  updateJails(dt) {
    if (!this.state.prison?.prisoners?.length) return;
    const jails = this.state.buildings.filter((b) => b.type === "jail");
    if (jails.length === 0) return;
    const jailers = this.state.villagers.filter((v) => v.role === "Guard" || v.brain?.state === "fight" || v.brain?.state === "patrol");
    this.state.prison.tickMs += dt;
    const supervision = Math.max(0, jailers.length - Math.floor(this.state.prison.prisoners.length * 0.35));
    this.state.prison.prisoners.forEach((p) => { p.custodyMs = (p.custodyMs || 0) + dt; });
    if (this.state.prison.tickMs < 9000) return;
    this.state.prison.tickMs = 0;
    if (supervision > 0) {
      const intel = Math.min(4, 1 + Math.floor(this.state.prison.prisoners.length * 0.25));
      this.state.inventory.science += intel * 0.2;
      this.state.player.coins += intel;
      if (Math.random() < 0.35) this.pushNpcMessage("Jail Warden", `Jailers secured ${this.state.prison.prisoners.length} prisoners. Intelligence +${intel}.`);
    } else if (Math.random() < 0.18 && this.state.prison.prisoners.length > 0) {
      const escaped = this.state.prison.prisoners.shift();
      if (escaped.kind === "spy") this.spawnEnemySpy(this.state.player.x + (Math.random() * 8 - 4), this.state.player.y + (Math.random() * 8 - 4));
      else this.state.enemies.push({ id: `esc-${Date.now()}`, name: `${escaped.name} (Escaped)`, x: this.state.player.x + (Math.random() * 8 - 4), y: this.state.player.y + (Math.random() * 8 - 4), hp: 4, boss: false, fireMs: 800 + Math.random() * 800 });
      this.pushNpcMessage("Jail Warden", `${escaped.name} escaped due to low supervision.`);
    }
  }
  isBuildSpotFree(x, y, minDist = 1.2) {
    return !this.state.buildings.some((b) => Math.hypot(b.x - x, b.y - y) < minDist);
  }
  buildByVillager(v) {
    const maxBuildings = Math.floor(this.state.villagers.length * 0.45);
    if (this.state.buildings.length >= maxBuildings) return false;
    const choices = ["house", "house", "shop", "fort", "factory", "market"];
    const type = choices[Math.floor(Math.random() * choices.length)];
    const cost = this.getBuildCost(type);
    if ((this.state.inventory.wood || 0) < cost.wood || (this.state.inventory.stone || 0) < cost.stone || (this.state.inventory.metal || 0) < cost.metal) return false;
    const x = Math.round(v.x + (Math.random() * 4 - 2));
    const y = Math.round(v.y + (Math.random() * 4 - 2));
    if (!this.isBuildSpotFree(x, y, 1.1)) return false;
    this.state.inventory.wood -= cost.wood;
    this.state.inventory.stone -= cost.stone;
    this.state.inventory.metal -= cost.metal;
    this.state.buildings.push({ type, x: ((x % WORLD_W) + WORLD_W) % WORLD_W, y: ((y % WORLD_H) + WORLD_H) % WORLD_H });
    if (Math.random() < 0.2) this.pushNpcMessage(v.name, `${v.name} built a ${type} near (${Math.floor(v.x)}, ${Math.floor(v.y)}).`);
    return true;
  }

  resizeCanvas() { const rect = this.canvas.getBoundingClientRect(); this.canvas.width = Math.max(900, Math.floor(rect.width)); this.canvas.height = Math.max(560, Math.floor(rect.height)); }
  ensureAudio() { if (this.audioCtx) return; const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) this.audioCtx = new Ctx(); }
  playShotSound() { this.ensureAudio(); if (!this.audioCtx) return; const t = this.audioCtx.currentTime, osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain(); osc.type = "square"; osc.frequency.setValueAtTime(380, t); osc.frequency.exponentialRampToValueAtTime(150, t + 0.06); gain.gain.setValueAtTime(0.001, t); gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08); osc.connect(gain).connect(this.audioCtx.destination); osc.start(t); osc.stop(t + 0.09); }
  playExplosionSound() { this.ensureAudio(); if (!this.audioCtx) return; const t = this.audioCtx.currentTime, osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain(); osc.type = "triangle"; osc.frequency.setValueAtTime(120, t); osc.frequency.exponentialRampToValueAtTime(45, t + 0.2); gain.gain.setValueAtTime(0.001, t); gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26); osc.connect(gain).connect(this.audioCtx.destination); osc.start(t); osc.stop(t + 0.28); }
  createExplosion(x, y, size = 1, color = "255,130,40") { this.state.explosions.push({ x, y, size, life: 280, maxLife: 280, color }); }
  log(msg) { this.logs.push(`[Day ${this.state.day}] ${msg}`); if (this.logs.length > 90) this.logs.shift(); }
  refreshFactionSelect() {
    const sel = document.getElementById("factionSelect");
    if (!sel) return;
    if (!this.state.diplomacy || !Array.isArray(this.state.diplomacy.factions)) this.state.diplomacy = { factions: [] };
    if (this.state.diplomacy.factions.length === 0) this.state.diplomacy.factions.push({ name: "North Guild", relation: 10, atWar: false, alliance: false, trade: false });
    // Ensure rival civilizations are always selectable diplomacy targets.
    this.state.rival?.civilizations?.forEach((civ) => {
      if (!this.state.diplomacy.factions.some((f) => f.name === civ.name)) {
        this.state.diplomacy.factions.push({ name: civ.name, relation: civ.relation ?? -10, atWar: !!civ.atWar, alliance: false, trade: false });
      }
    });
    sel.innerHTML = this.state.diplomacy.factions.map((f, i) => `<option value="${i}">${f.name} (rel ${Math.round(f.relation)})</option>`).join("");
    if (sel.options.length > 0 && sel.selectedIndex < 0) sel.selectedIndex = 0;
  }
  getSelectedFaction() {
    const sel = document.getElementById("factionSelect");
    const idx = Math.max(0, Number(sel?.selectedIndex ?? sel?.value ?? 0));
    return this.state.diplomacy.factions[idx] || this.state.diplomacy.factions[0];
  }
  applyDiplomacy(action) {
    let f = this.getSelectedFaction();
    if (!f) {
      if (!this.state.diplomacy || !Array.isArray(this.state.diplomacy.factions)) this.state.diplomacy = { factions: [] };
      if (this.state.diplomacy.factions.length === 0) this.state.diplomacy.factions.push({ name: "North Guild", relation: 10, atWar: false, alliance: false, trade: false });
      f = this.state.diplomacy.factions[0];
    }
    if (action === "alliance") { f.alliance = true; f.atWar = false; f.relation = Math.min(100, f.relation + 20); }
    if (action === "trade") { f.trade = true; f.relation = Math.min(100, f.relation + 10); this.state.market.stock.food += 15; this.state.market.stock.fuel += 8; }
    if (action === "peace") { f.atWar = false; f.relation = Math.min(100, f.relation + 12); }
    if (action === "war") {
      f.atWar = true; f.alliance = false; f.trade = false; f.relation = Math.max(-100, f.relation - 18);
      // Always generate an immediate visible combat response.
      this.spawnFactionRaid(f.name);
      this.spawnFactionRaid(f.name);
      this.ensureWarHostiles(f.name, 10);
      this.state.raid.active = true;
      const hostileNow = this.state.enemies.length;
      this.log(`WAR DECLARED on ${f.name}. Enemy raiders deployed (${hostileNow} hostiles active).`);
      this.pushNpcMessage("War Room", `War declared on ${f.name}. Immediate enemy assault detected: ${hostileNow} hostiles.`);
    }
    const rc = this.state.rival.civilizations.find((c) => c.name === f.name);
    if (rc) { rc.relation = f.relation; rc.atWar = !!f.atWar; if (action === "alliance") rc.relation = Math.max(rc.relation, 25); }
    this.pushNpcMessage("Council", `Diplomacy update: ${f.name} -> ${action}. relation=${Math.round(f.relation)} war=${f.atWar}`);
    this.refreshFactionSelect();
  }
  forceDeclareWar() {
    const f = this.getSelectedFaction() || this.state.diplomacy?.factions?.[0] || { name: "Rival Faction", relation: -20, atWar: false, alliance: false, trade: false };
    if (!this.state.diplomacy || !Array.isArray(this.state.diplomacy.factions)) this.state.diplomacy = { factions: [] };
    if (!this.state.diplomacy.factions.some((x) => x.name === f.name)) this.state.diplomacy.factions.push(f);
    f.atWar = true;
    f.alliance = false;
    f.trade = false;
    f.relation = Math.max(-100, (f.relation ?? -10) - 20);
    this.ensureWarHostiles(f.name, 12);
    this.state.raid.active = true;
    const rc = this.state.rival.civilizations.find((c) => c.name === f.name);
    if (rc) { rc.atWar = true; rc.relation = f.relation; }
    this.pushNpcMessage("War Room", `Forced war start with ${f.name}. Hostiles active: ${this.state.enemies.length}.`);
    this.log(`Forced war start: ${f.name}, hostiles=${this.state.enemies.length}.`);
    this.refreshFactionSelect();
  }
  spawnFactionRaid(name = "Faction") {
    const count = 5 + Math.floor(Math.random() * 4);
    const sx = this.state.player.x + (Math.random() * 20 - 10);
    const sy = this.state.player.y + (Math.random() * 20 - 10);
    const leader = { id: `fl-${Date.now()}`, name: `${name} Leader`, x: sx + 0.6, y: sy + 0.6, hp: 12, boss: false, leader: true, fireMs: 520 };
    for (let i = 0; i < Math.max(1, count - 1); i += 1) {
      this.state.enemies.push({ id: `fw-${Date.now()}-${i}`, name: `${name} Raider`, x: sx + Math.random() * 6 - 3, y: sy + Math.random() * 6 - 3, hp: 5, boss: false, fireMs: 700 + Math.random() * 900 });
    }
    this.state.enemies.push(leader);
    this.spawnEnemySpy(sx, sy);
    this.state.raid.active = true;
  }
  ensureWarHostiles(name = "Faction", minHostiles = 10) {
    let guard = 0;
    while (this.state.enemies.length < minHostiles && guard < 4) {
      this.spawnFactionRaid(name);
      guard += 1;
    }
    if (this.state.enemies.length === 0) {
      const sx = this.state.player.x + (Math.random() * 10 - 5);
      const sy = this.state.player.y + (Math.random() * 10 - 5);
      this.state.enemies.push({ id: `fw-fallback-${Date.now()}`, name: `${name} Raider`, x: sx, y: sy, hp: 6, boss: false, fireMs: 650 });
    }
    this.state.raid.active = true;
  }
  spawnEnemySpy(x = null, y = null) {
    const sx = typeof x === "number" ? x : this.state.player.x + (Math.random() * 36 - 18);
    const sy = typeof y === "number" ? y : this.state.player.y + (Math.random() * 36 - 18);
    this.state.enemySpies.push({
      id: `spy-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      name: "Enemy Spy",
      x: sx + (Math.random() * 3 - 1.5),
      y: sy + (Math.random() * 3 - 1.5),
      hp: 4,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
      cooldownMs: 0,
      seenMs: 0
    });
  }
  buyFromShop(item) {
    const price = this.state.market.prices[item];
    const stock = this.state.market.stock[item];
    if (!price || stock <= 0) return;
    if (this.state.player.coins < price) { this.pushNpcMessage("Shop", `Cannot buy ${item}: need ${price} coins, you have ${Math.floor(this.state.player.coins)}.`); return; }
    this.state.player.coins -= price;
    this.state.market.stock[item] -= 1;
    if (item === "ammo") this.state.player.ammo += 3;
    else this.state.inventory[item] = (this.state.inventory[item] || 0) + 1;
    this.pushNpcMessage("Shop", `Sold 1 ${item} at ${price} coins. Stock now ${Math.floor(this.state.market.stock[item])}.`);
  }
  updateSupplyAndWar(dt) {
    this.state.market.restockMs += dt;
    if (this.state.market.restockMs > 10000) {
      this.state.market.restockMs = 0;
      const shortage = this.state.inventory.food < this.state.villagers.length * 0.8;
      const w = this.state.weather.type;
      const weatherFoodBonus = w === "Rain" ? 2 : w === "Sunny" ? 1 : w === "Storm" ? -2 : w === "Snow" ? -1 : 0;
      const weatherFuelUse = w === "Storm" ? 1 : w === "Snow" ? 1 : 0;
      this.state.market.stock.food += shortage ? 8 : 3;
      this.state.market.stock.food += weatherFoodBonus;
      this.state.market.stock.seeds += 2;
      this.state.market.stock.fuel += 1;
      this.state.market.stock.ammo += this.state.enemies.length > 8 ? 3 : 1;
      this.state.market.prices.food = this.clamp(this.state.market.prices.food + (shortage ? 0.2 : -0.1), 3, 2, 9);
      this.state.market.prices.fuel = this.clamp(this.state.market.prices.fuel + (this.state.enemies.length > 8 ? 0.15 : -0.05), 7, 4, 14);
      this.state.market.prices.ammo = this.clamp(this.state.market.prices.ammo + (this.state.enemies.length > 8 ? 0.2 : -0.08), 5, 3, 14);
      this.state.inventory.food = Math.max(0, this.state.inventory.food - Math.max(1, Math.floor(this.state.villagers.length * 0.008)));
      if (weatherFuelUse > 0) this.state.inventory.fuel = Math.max(0, this.state.inventory.fuel - weatherFuelUse);
    }
    // Raiders are controlled by the global 2-minute timer in update(), not by background war ticks.
    const factories = this.state.buildings.filter((b) => b.type === "factory").length;
    if (factories > 0) {
      this.state.industry.factoryMs += dt;
      this.state.industry.reportMs += dt;
      if (this.state.industry.factoryMs >= 9000) {
        this.state.industry.factoryMs = 0;
        const produced = factories * (1 + (this.state.enemies.length > 8 ? 1 : 0));
        this.state.market.stock.ammo += produced;
        this.state.inventory.metal = Math.max(0, this.state.inventory.metal - Math.min(this.state.inventory.metal, Math.ceil(produced * 0.5)));
      }
      if (this.state.industry.reportMs >= 18000) {
        this.state.industry.reportMs = 0;
        this.pushNpcMessage("Factory Foreman", `Ammo production active: ${factories} factory(s), shop ammo stock=${Math.floor(this.state.market.stock.ammo)}.`);
      }
    } else {
      this.state.industry.factoryMs = 0;
      this.state.industry.reportMs = 0;
    }
  }
  updateRivalCivilizations(dt) {
    this.state.rival.tickMs += dt;
    this.state.rival.civilizations.forEach((civ) => {
      civ.actionMs -= dt;
      if (civ.actionMs > 0) return;
      civ.actionMs = 14000 + Math.random() * 26000;

      civ.population += 1 + Math.floor(Math.random() * 3);
      civ.treasury += 2 + Math.floor(civ.population * 0.01);
      civ.military += Math.random() < 0.4 ? 1 : 0;

      if (Math.random() < 0.35) {
        this.state.market.stock.food += 3;
        this.state.player.coins += 2;
        this.pushNpcMessage("Trader", `Rival trade window with ${civ.name}: +3 food stock, +2 coins.`);
      } else {
        civ.relation = this.clamp(civ.relation + (Math.random() < 0.5 ? -2 : 2), civ.relation, -100, 100);
      }
    });
    this.reconcileRivalPeople();
  }
  updateRivalPeople(dt) {
    const speed = 0.0012 * dt * this.weatherMoveMul();
    this.state.rival.people.forEach((p) => {
      const civ = this.state.rival.civilizations.find((c) => c.id === p.civId);
      if (!civ) return;
      const leash = civ.atWar ? 20 : 14;
      p.workMs -= dt;
      if (p.workMs <= 0) {
        p.vx = Math.random() * 2 - 1;
        p.vy = Math.random() * 2 - 1;
        p.workMs = 900 + Math.random() * 2000;
      }
      const dx = civ.x - p.x, dy = civ.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > leash) {
        p.x += (dx / d) * speed * 1.8;
        p.y += (dy / d) * speed * 1.8;
      } else {
        p.x += p.vx * speed;
        p.y += p.vy * speed;
      }
      p.x = ((p.x % WORLD_W) + WORLD_W) % WORLD_W;
      p.y = ((p.y % WORLD_H) + WORLD_H) % WORLD_H;
    });
  }
  updateGovernment(dt) {
    this.govTickMs += dt;
    if (this.govTickMs < 6000) return;
    this.govTickMs = 0;
    const tax = this.clamp(this.state.government.taxRate, 10, 0, 50);
    const strict = this.clamp(this.state.government.lawStrictness, 50, 0, 100);
    const wars = this.state.diplomacy.factions.filter((f) => f.atWar).length;
    const weatherStress = this.state.weather.type === "Storm" ? 1.2 : this.state.weather.type === "Snow" ? 0.9 : this.state.weather.type === "Rain" ? 0.45 : 0;
    const income = Math.max(0, Math.floor(this.state.villagers.length * (tax / 100) * 0.22));
    this.state.player.coins += income;
    const angerRise = Math.max(0, tax - 18) * 0.22;
    const relief = tax <= 18 ? 0.45 : 0.1;
    this.state.social.anger = this.clamp(this.state.social.anger + angerRise + weatherStress - relief, 18, 0, 100);
    this.state.government.approval = this.clamp(
      this.state.government.approval + (income > 0 ? 0.7 : -0.3) - (tax > 30 ? 1.2 : 0.2) - (strict > 80 ? 0.8 : 0) - wars * 0.5 - (this.state.social.anger > 60 ? 1.1 : 0),
      65,
      0,
      100
    );
    if (Math.random() < 0.12) {
      this.pushNpcMessage("Council", `Gov report: type=${this.state.government.type}, tax=${Math.floor(tax)}%, strict=${Math.floor(strict)}, income=${income}, approval=${Math.floor(this.state.government.approval)}%, anger=${Math.floor(this.state.social.anger)}%.`);
    }
  }
  pushNpcMessage(from, text) {
    let finalText = String(text);
    if (this.sentMessageSet.has(finalText)) finalText = `${finalText} [d${this.state.day} t${Math.floor(this.worldTimeMs / 1000)}]`;
    this.sentMessageSet.add(finalText);
    this.state.comms.push({ from, text: finalText, day: this.state.day });
  }
  pickUniqueMessage(pool) {
    if (!Array.isArray(pool) || pool.length === 0) return "";
    const recentSet = new Set(this.recentNpcMessages);
    let choices = pool.filter((m) => !recentSet.has(m));
    if (choices.length === 0) choices = pool;
    const selected = choices[Math.floor(Math.random() * choices.length)];
    this.recentNpcMessages.push(selected);
    if (this.recentNpcMessages.length > 24) this.recentNpcMessages.shift();
    return selected;
  }
  parsePlayerOrder(text) {
    const lower = text.toLowerCase();
    let type = "custom", targetX = null, targetY = null;
    const forcedOrder = lower.startsWith("order ") || lower.startsWith("command ");
    const forcedText = forcedOrder ? lower.replace(/^(order|command)\s+/, "").trim() : lower;
    const source = forcedOrder ? forcedText : lower;
    const moveMatch = lower.match(/(?:move|go|to)\s+(-?\d+)[,\s]+(-?\d+)/);
    if (moveMatch) {
      type = "move";
      targetX = this.clamp(Number(moveMatch[1]), this.state.player.x, 0, WORLD_W - 1);
      targetY = this.clamp(Number(moveMatch[2]), this.state.player.y, 0, WORLD_H - 1);
    } else if (source.includes("harvest")) type = "harvest";
    else if (source.includes("trade") || source.includes("shop") || source.includes("supply")) type = "trade";
    else if (source.includes("fight") || source.includes("defend") || source.includes("raid") || source.includes("war")) type = "fight";
    else if (source.includes("build") || source.includes("work")) type = "work";
    else if (source.includes("block entrance")) type = "block";
    else if (source.includes("unblock entrance")) type = "unblock";
    else if (source.includes("patrol") || source.includes("guard")) type = "patrol";
    else if (source.includes("tax")) type = "tax";
    else if (source.includes("law") || source.includes("strict")) type = "law";
    else if (source.includes("space") || source.includes("satellite") || source.includes("missile")) type = "space";
    else if (source.includes("status") || source.includes("report")) type = "talk";
    return { type, raw: text, targetX, targetY };
  }

  sendPlayerMessage() {
    const input = document.getElementById("messageInput"), text = (input?.value || "").trim(); if (!text) return; if (input) input.value = "";
    const lower = text.toLowerCase();
    this.state.comms.push({ from: "You", text, day: this.state.day });
    this.pushNpcMessage("Council", `Command received: "${text}". Processing now.`);
    const parsed = this.parsePlayerOrder(text);
    if (lower.includes("declare war") || lower.startsWith("war ") || lower.includes("war on")) {
      this.forceDeclareWar();
      this.pushNpcMessage("War Room", "War command accepted from message input.");
    }
    const order = parsed.type;
    this.state.command = { type: parsed.type, raw: parsed.raw, targetX: parsed.targetX, targetY: parsed.targetY, ttlMs: 120000 };
    const forcedState = ["harvest","trade","fight","work","patrol","move"].includes(order) ? order : "work";
    this.state.villagers.forEach((v) => {
      v.brain.state = forcedState;
      v.brain.decisionMs = 7000 + Math.random() * 6000;
    });
    const villager = this.state.villagers.length > 0 ? this.state.villagers[Math.floor(Math.random() * this.state.villagers.length)] : null;
    const name = villager?.name || "Council";
    const raiders = this.state.enemies.length;
    const wars = this.state.diplomacy.factions.filter((f) => f.atWar).length;
    const angry = this.state.villagers.filter((v) => (v.mood || 0) > 80).length;
    const hasBuildMaterials = this.state.inventory.wood >= 25 && this.state.inventory.stone >= 20;
    const foodLow = this.state.inventory.food < this.state.villagers.length * 0.9;
    this.replySerial += 1;

    let reply = "";
    if (order === "fight") {
      reply = `${name}: Defense order accepted. Units are switching to combat posture now. Raiders detected=${raiders}.`;
    } else if (order === "harvest") {
      reply = `${name}: Harvest order accepted. Teams are collecting resources now. Food=${Math.floor(this.state.inventory.food)}.`;
    } else if (order === "trade") {
      reply = `${name}: Trade order accepted. Shop stock food=${Math.floor(this.state.market.stock.food)}, fuel=${Math.floor(this.state.market.stock.fuel)}, ammo=${Math.floor(this.state.market.stock.ammo)}.`;
    } else if (order === "work") {
      reply = `${name}: Work order accepted. Crews are active now (wood=${Math.floor(this.state.inventory.wood)}, stone=${Math.floor(this.state.inventory.stone)}).`;
    } else if (order === "block") {
      const ok = this.toggleNearestEntrance(true, true);
      reply = ok ? `${name}: Entrance block order accepted and executed.` : `${name}: Entrance block order accepted and queued until a building entrance is in range.`;
    } else if (order === "unblock") {
      const ok = this.toggleNearestEntrance(false, true);
      reply = ok ? `${name}: Entrance unblock order accepted and executed.` : `${name}: Entrance unblock order accepted and queued until a building entrance is in range.`;
    } else if (order === "patrol") {
      reply = `${name}: Patrol routes updated. Angry villagers=${angry}, wars=${wars}, active raiders=${raiders}.`;
    } else if (lower.includes("tax")) {
      reply = `${name}: Tax report: rate=${Math.floor(this.state.government.taxRate)}%, approval=${Math.floor(this.state.government.approval)}%, anger=${Math.floor(this.state.social.anger)}%.`;
    } else if (lower.includes("law") || lower.includes("strict")) {
      reply = `${name}: Law strictness is ${Math.floor(this.state.government.lawStrictness)}. High strictness reduces disorder but increases tension.`;
    } else if (lower.includes("space") || lower.includes("satellite") || lower.includes("missile")) {
      reply = `${name}: Space status: satellites=${this.state.space.satellites}, missileDefense=${this.state.space.missileDefense}, missions=${this.state.space.missions.length}.`;
    } else if (order === "move") {
      reply = `${name}: Move order accepted. Units are moving toward (${Math.floor(parsed.targetX)}, ${Math.floor(parsed.targetY)}).`;
    } else if (order === "talk") {
      reply = `${name}: We can talk and we can take orders. Current status: food=${Math.floor(this.state.inventory.food)}, raiders=${raiders}, approval=${Math.floor(this.state.government.approval)}%, missions=${this.state.space.missions.length}.`;
    } else {
      reply = `${name}: Order accepted: "${text}". We are executing it as a priority operation for the next 120s.`;
    }

    this.pushNpcMessage(name, reply);
  }

  findNearestEnemy(x, y, r = 999) { let best = null, bd = r; this.state.enemies.forEach((e) => { const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }); return best; }
  findNearestAnimal(x, y, r = 999) { let best = null, bd = r; this.state.animals.forEach((a) => { if (a.harvestCooldownMs > 0) return; const d = Math.hypot(a.x - x, a.y - y); if (d < bd) { bd = d; best = a; } }); return best; }
  findNearestBuilding(x, y, types, includeBlocked = false) {
    let best = null, bd = Infinity;
    this.state.buildings.forEach((b) => {
      if (types && !types.includes(b.type)) return;
      if (!includeBlocked && b.entranceBlocked) return;
      const d = Math.hypot(b.x - x, b.y - y);
      if (d < bd) { bd = d; best = b; }
    });
    return best;
  }
  updateBuildingEntranceLocks() {
    // Entrance state is manual-only: changed by Block/Unblock buttons or explicit commands.
    this.state.buildings.forEach((b) => {
      if (typeof b.entranceBlocked !== "boolean") b.entranceBlocked = false;
    });
  }
  harvestAnimal(animal, by = "Villager") {
    if (!animal || animal.harvestCooldownMs > 0) return;
    const mul = this.weatherHarvestMul();
    const foodGain = Math.max(1, Math.round(animal.yieldFood * mul));
    const clothGain = Math.max(1, Math.round(animal.yieldCloth * (mul > 1 ? 1.05 : 0.95)));
    this.state.inventory.food += foodGain;
    this.state.inventory.clothing += clothGain;
    animal.harvestCooldownMs = 10000 + Math.random() * 6000;
    animal.x = Math.random() * WORLD_W; animal.y = Math.random() * WORLD_H;
    this.createExplosion(animal.x, animal.y, 0.75, "220,205,170");
  }
  harvestNearestAnimal() { const a = this.findNearestAnimal(this.state.player.x, this.state.player.y, 2.5); if (!a) return; this.harvestAnimal(a, "You"); this.log(`Harvested ${a.type}: +${a.yieldFood} food, +${a.yieldCloth} clothing.`); }
  chopNearestTree() {
    let best = null, bd = 2.2;
    const px = this.state.player.x, py = this.state.player.y;
    for (let oy = -2; oy <= 2; oy += 1) {
      for (let ox = -2; ox <= 2; ox += 1) {
        const tx = px + ox, ty = py + oy;
        const t = this.getTileRefAt(tx, ty);
        if (!t || (t.type !== "forest" && t.type !== "fruit")) continue;
        const d = Math.hypot(tx - px, ty - py);
        if (d < bd) { bd = d; best = { tile: t, x: tx, y: ty }; }
      }
    }
    if (!best) { this.pushNpcMessage("Builder", "No tree close enough to chop."); return; }
    const fruit = best.tile.type === "fruit";
    best.tile.type = "land";
    best.tile.regrow = 45000 + Math.random() * 45000;
    this.state.inventory.wood += fruit ? 1 : 2;
    this.state.inventory.seeds += 1;
    if (fruit) this.state.inventory.food += 1;
    this.createExplosion(best.x, best.y, 0.55, "110,190,90");
    this.log(`Tree chopped: +${fruit ? 1 : 2} wood, +1 seed${fruit ? ", +1 food" : ""}.`);
  }
  plantSeedNearPlayer() {
    if ((this.state.inventory.seeds || 0) <= 0) { this.pushNpcMessage("Builder", "No seeds available to plant."); return; }
    let spot = null, bestD = Infinity;
    const px = this.state.player.x, py = this.state.player.y;
    for (let oy = -2; oy <= 2; oy += 1) {
      for (let ox = -2; ox <= 2; ox += 1) {
        const tx = px + ox, ty = py + oy;
        const t = this.getTileRefAt(tx, ty);
        if (!t) continue;
        if (["water", "river", "ocean", "ore"].includes(t.type)) continue;
        if (t.type !== "land" && t.type !== "hill") continue;
        const d = Math.hypot(tx - px, ty - py);
        if (d < bestD) { bestD = d; spot = { tile: t, x: tx, y: ty }; }
      }
    }
    if (!spot) { this.pushNpcMessage("Builder", "No valid land near you to plant seeds."); return; }
    this.state.inventory.seeds -= 1;
    spot.tile.type = Math.random() < 0.25 ? "fruit" : "forest";
    spot.tile.regrow = 0;
    this.createExplosion(spot.x, spot.y, 0.5, "120,220,110");
    this.log(`Seed planted at (${Math.floor(spot.x)}, ${Math.floor(spot.y)}).`);
  }

  fireGun(from = "player", sx = this.state.player.x, sy = this.state.player.y, tx = null, ty = null) {
    if (from === "player") { if (this.state.player.ammo <= 0) return; this.state.player.ammo -= 1; }
    if (tx === null || ty === null) { const n = this.findNearestEnemy(sx, sy, 14); if (n) { tx = n.x; ty = n.y; } else { tx = sx + this.state.player.facingX * 3; ty = sy + this.state.player.facingY * 3; } }
    const dx = tx - sx, dy = ty - sy, m = Math.hypot(dx, dy) || 1;
    const b = { x: sx, y: sy, vx: (dx / m) * BULLET_SPEED, vy: (dy / m) * BULLET_SPEED, life: 1200, owner: from };
    if (from === "enemy") this.state.enemyBullets.push(b); else if (from === "villager") this.state.friendlyBullets.push(b); else this.state.bullets.push(b);
    this.createExplosion(sx, sy, 0.4, "255,210,110"); this.playShotSound();
  }

  spawnRaidWave() {
    this.state.raid.active = true; this.state.raid.wave += 1;
    const count = 7 + this.state.raid.wave, ang = Math.random() * Math.PI * 2, sx = this.state.player.x + Math.cos(ang) * (18 + Math.random() * 12), sy = this.state.player.y + Math.sin(ang) * (18 + Math.random() * 12);
    const leader = { id: `lead-${Date.now()}`, name: "Raider Leader", x: sx + 0.5, y: sy + 0.5, hp: 14 + this.state.raid.wave, boss: false, leader: true, fireMs: 480 };
    const boss = { id: `boss-${Date.now()}`, name: "Raider Boss", x: sx + 1, y: sy + 1, hp: 18 + this.state.raid.wave * 2, boss: true, fireMs: 500 };
    const rs = Array.from({ length: Math.max(1, count - 1) }, (_, i) => ({ id: `r-${Date.now()}-${i}`, name: `Raider ${i + 1}`, x: sx + (Math.random() * 8 - 4), y: sy + (Math.random() * 8 - 4), hp: 4 + Math.floor(this.state.raid.wave * 0.4), boss: false, fireMs: 800 + Math.random() * 1200 }));
    this.state.enemies.push(...rs, leader, boss);
    this.spawnEnemySpy(sx, sy);
    this.log("WARNING: Raiders invading with a leader, boss, and spy!");
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = (clientX - rect.left) * (this.canvas.width / Math.max(1, rect.width));
    const sy = (clientY - rect.top) * (this.canvas.height / Math.max(1, rect.height));
    const wx = this.state.player.x + (sx - this.canvas.width * 0.5) / TILE;
    const wy = this.state.player.y + (sy - this.canvas.height * 0.5) / TILE;
    return { x: ((wx % WORLD_W) + WORLD_W) % WORLD_W, y: ((wy % WORLD_H) + WORLD_H) % WORLD_H };
  }
  isFortBlockedAt(x, y, radius = 0.9) {
    return this.state.buildings.some((b) => b.type === "fort" && Math.hypot(b.x - x, b.y - y) < radius);
  }
  moveEnemyWithFortCollision(enemy, dx, dy) {
    const nx = enemy.x + dx;
    const ny = enemy.y + dy;
    if (!this.isFortBlockedAt(nx, ny)) {
      enemy.x = nx;
      enemy.y = ny;
      return;
    }
    // Slide along fort walls before giving up movement entirely.
    const tryX = enemy.x + dx;
    const tryY = enemy.y + dy;
    const canX = !this.isFortBlockedAt(tryX, enemy.y);
    const canY = !this.isFortBlockedAt(enemy.x, tryY);
    if (canX) enemy.x = tryX;
    if (canY) enemy.y = tryY;
    if (!canX && !canY) {
      enemy.vx = -(enemy.vx || 0);
      enemy.vy = -(enemy.vy || 0);
    }
  }
  updatePlayer(dt) {
    const speed = 0.01 * dt * this.weatherMoveMul(); let mx = 0, my = 0;
    if (this.keys["w"] || this.keys["keyw"] || this.keys["arrowup"]) my -= 1;
    if (this.keys["s"] || this.keys["keys"] || this.keys["arrowdown"]) my += 1;
    if (this.keys["a"] || this.keys["keya"] || this.keys["arrowleft"]) mx -= 1;
    if (this.keys["d"] || this.keys["keyd"] || this.keys["arrowright"]) mx += 1;
    if (mx || my) {
      const m = Math.hypot(mx, my) || 1;
      this.state.player.facingX = mx / m; this.state.player.facingY = my / m; this.state.player.x += (mx / m) * speed; this.state.player.y += (my / m) * speed;
      this.state.player.moveTarget = null;
    } else if (this.state.player.moveTarget) {
      const dx = this.state.player.moveTarget.x - this.state.player.x, dy = this.state.player.moveTarget.y - this.state.player.y;
      const d = Math.hypot(dx, dy) || 0;
      if (d <= speed || d < 0.2) {
        this.state.player.x = this.state.player.moveTarget.x;
        this.state.player.y = this.state.player.moveTarget.y;
        this.state.player.moveTarget = null;
      } else {
        this.state.player.facingX = dx / d; this.state.player.facingY = dy / d;
        this.state.player.x += (dx / d) * speed;
        this.state.player.y += (dy / d) * speed;
      }
    }
    this.state.player.x = ((this.state.player.x % WORLD_W) + WORLD_W) % WORLD_W; this.state.player.y = ((this.state.player.y % WORLD_H) + WORLD_H) % WORLD_H;
  }

  updateAnimals(dt) {
    const moveMul = this.weatherMoveMul();
    this.state.animals.forEach((a) => {
      a.x += a.vx * dt * 0.0014 * moveMul; a.y += a.vy * dt * 0.0014 * moveMul;
      if (Math.random() < 0.03) { a.vx = Math.random() * 2 - 1; a.vy = Math.random() * 2 - 1; }
      a.x = ((a.x % WORLD_W) + WORLD_W) % WORLD_W; a.y = ((a.y % WORLD_H) + WORLD_H) % WORLD_H; a.harvestCooldownMs = Math.max(0, a.harvestCooldownMs - dt);
    });
  }
  chooseState(v) { if (this.state.enemies.length > 0 && (v.role === "Guard" || Math.random() < 0.35)) return "fight"; if (this.state.inventory.food < this.state.villagers.length * 1.4) return "harvest"; if (v.role === "Trader") return "trade"; const r = Math.random(); if (r < 0.28) return "harvest"; if (r < 0.48) return "trade"; if (r < 0.74) return "work"; return "patrol"; }

  updateVillagerAI(dt) {
    const ms = 0.0028 * dt * this.weatherMoveMul();
    const cmd = this.state.command?.ttlMs > 0 ? this.state.command : null;
    const launchSite = this.state.space.launchAttractMs > 0 ? this.findNearestBuilding(this.state.player.x, this.state.player.y, ["space_center"]) : null;
    this.state.villagers.forEach((v) => {
      const targetMood = this.clamp(this.state.social.anger + this.state.government.taxRate * 0.72, 26, 0, 98);
      v.mood = this.clamp(v.mood + (targetMood - v.mood) * 0.014 + (Math.random() * 0.8 - 0.4), v.mood, 0, 100);
      v.brain.decisionMs -= dt; v.brain.workMs -= dt; if (!cmd && v.brain.decisionMs <= 0) { v.brain.state = this.chooseState(v); v.brain.decisionMs = 2500 + Math.random() * 5200; }
      if (cmd) {
        if (cmd.type === "move") v.brain.state = "move";
        else if (["harvest","trade","fight","work","patrol"].includes(cmd.type)) v.brain.state = cmd.type;
        else if (cmd.type === "custom") v.brain.state = v.role === "Trader" ? "trade" : "work";
      }
      if (this.state.enemies.length === 0 && v.mood > 82) v.brain.state = "protest";
      // Very angry villagers will directly chase the player while taxes stay high.
      if (v.mood > 86 && this.state.government.taxRate >= 18) v.brain.state = "angry_chase";
      // Lowering taxes calms chase behavior immediately.
      if (this.state.government.taxRate < 18 && v.brain.state === "angry_chase") {
        v.brain.state = "patrol";
        v.mood = Math.max(30, v.mood - 14);
      }
      if (launchSite && this.state.enemies.length === 0 && Math.random() < 0.2 && v.brain.state !== "angry_chase") v.brain.state = "spacewatch";
      let t = null; if (v.brain.state === "move" && cmd) t = { x: cmd.targetX, y: cmd.targetY }; else if (v.brain.state === "fight") t = this.findNearestEnemy(v.x, v.y, 14); else if (v.brain.state === "harvest") t = this.findNearestAnimal(v.x, v.y, 18); else if (v.brain.state === "trade") t = this.findNearestBuilding(v.x, v.y, ["shop", "market", "government"]); else if (v.brain.state === "work") t = this.findNearestBuilding(v.x, v.y); else if (v.brain.state === "protest") t = this.findNearestBuilding(v.x, v.y, ["government"]); else if (v.brain.state === "angry_chase") t = this.state.player;
      if (v.brain.state === "patrol" && v.homeId && !t) {
        const parts = v.homeId.split(",");
        const hx = Number(parts[0]), hy = Number(parts[1]);
        if (!Number.isNaN(hx) && !Number.isNaN(hy)) t = { x: hx, y: hy };
      }
      if (v.brain.state === "spacewatch" && launchSite) t = launchSite;
      if (t) { const dx = t.x - v.x, dy = t.y - v.y, d = Math.hypot(dx, dy) || 1; v.x += (dx / d) * ms; v.y += (dy / d) * ms; } else { v.x += v.vx * dt * 0.0016; v.y += v.vy * dt * 0.0016; if (Math.random() < 0.02) { v.vx = Math.random() * 2 - 1; v.vy = Math.random() * 2 - 1; } }
      // Light-weight anti-crowding: repel from nearby random neighbors.
      let rx = 0, ry = 0;
      const sepChecks = Math.min(8, this.state.villagers.length);
      for (let i = 0; i < sepChecks; i += 1) {
        const n = this.state.villagers[(Math.random() * this.state.villagers.length) | 0];
        if (!n || n === v) continue;
        const dxn = v.x - n.x, dyn = v.y - n.y;
        const d = Math.hypot(dxn, dyn) || 0.001;
        if (d < 2.6) {
          const w = (2.6 - d) / 2.6;
          rx += (dxn / d) * w;
          ry += (dyn / d) * w;
        }
      }
      if (rx || ry) {
        v.x += rx * dt * 0.0009;
        v.y += ry * dt * 0.0009;
      }
      if (v.brain.state === "harvest" && v.brain.workMs <= 0) { const a = this.findNearestAnimal(v.x, v.y, 1.5); if (a) { this.harvestAnimal(a, v.name); v.coins += 1; v.brain.workMs = 1400 + Math.random() * 1800; } }
      if (v.brain.state === "trade" && v.brain.workMs <= 0) { const s = this.findNearestBuilding(v.x, v.y, ["shop", "market", "government"]); if (s && Math.hypot(v.x - s.x, v.y - s.y) < 1.8) { if (this.state.inventory.food < this.state.villagers.length * 1.6 && v.coins >= 2) { this.state.inventory.food += 2; v.coins -= 2; } else if (this.state.inventory.food > this.state.villagers.length * 2.2) { this.state.inventory.food -= 1; v.coins += 1; } if (Math.random() < 0.25) this.state.player.coins += 1; v.brain.workMs = 2200 + Math.random() * 2600; } }
      if (v.brain.state === "work" && v.brain.workMs <= 0) {
        this.buildByVillager(v);
        v.brain.workMs = 2400 + Math.random() * 3400;
      }
      if (v.brain.state === "protest" && v.brain.workMs <= 0) { const g = this.findNearestBuilding(v.x, v.y, ["government"]); if (g && Math.hypot(v.x - g.x, v.y - g.y) < 2.2) { this.state.government.approval = this.clamp(this.state.government.approval - 0.8, 65, 0, 100); this.state.social.anger = this.clamp(this.state.social.anger + 0.3, 18, 0, 100); if (Math.random() < 0.12) this.pushNpcMessage(v.name, `${v.name} protests at Government HQ: mood=${Math.floor(v.mood)} approval=${Math.floor(this.state.government.approval)}.`); v.brain.workMs = 2800 + Math.random() * 2200; } }
      if (v.brain.state === "angry_chase" && v.brain.workMs <= 0) {
        const dp = Math.hypot(v.x - this.state.player.x, v.y - this.state.player.y);
        if (dp < 1.4) {
          this.state.player.hp = Math.max(0, this.state.player.hp - 0.22);
          if (Math.random() < 0.2) this.pushNpcMessage(v.name, `${v.name} is angry and chasing you over high taxes.`);
        }
        v.brain.workMs = 500 + Math.random() * 600;
      }
      if (v.brain.state === "fight" && v.brain.workMs <= 0) {
        const captured = this.captureHostileNear(v.x, v.y, 1.6, v.name, true);
        if (!captured) {
          const e = this.findNearestEnemy(v.x, v.y, 7);
          if (e) this.fireGun("villager", v.x, v.y, e.x, e.y);
        } else if (Math.random() < 0.18) this.pushNpcMessage(v.name, `${v.name} captured a hostile and sent them to jail.`);
        v.brain.workMs = 700 + Math.random() * 800;
      }
      v.x = ((v.x % WORLD_W) + WORLD_W) % WORLD_W; v.y = ((v.y % WORLD_H) + WORLD_H) % WORLD_H;
    });
  }

  updateEnemies(dt) {
    const SEE_RANGE = 13;
    const ALERT_MS = 5000;
    const leaders = this.state.enemies.filter((x) => x.leader && x.hp > 0);
    this.state.enemies.forEach((e) => {
      if (typeof e.vx !== "number") e.vx = Math.random() * 2 - 1;
      if (typeof e.vy !== "number") e.vy = Math.random() * 2 - 1;
      if (typeof e.alertMs !== "number") e.alertMs = 0;
      const dx = this.state.player.x - e.x, dy = this.state.player.y - e.y, d = Math.hypot(dx, dy) || 1;
      const seesPlayer = d < SEE_RANGE;
      if (seesPlayer) e.alertMs = ALERT_MS;
      else e.alertMs = Math.max(0, e.alertMs - dt);

      const nearLeader = !e.leader && leaders.some((l) => Math.hypot(l.x - e.x, l.y - e.y) < 8);
      const speedMul = e.boss ? 1.2 : e.leader ? 1.15 : nearLeader ? 1.1 : 1.0;
      if (e.alertMs > 0) {
        this.moveEnemyWithFortCollision(e, (dx / d) * dt * 0.0016 * speedMul, (dy / d) * dt * 0.0016 * speedMul);
      } else {
        this.moveEnemyWithFortCollision(e, e.vx * dt * 0.0010, e.vy * dt * 0.0010);
        if (Math.random() < 0.02) { e.vx = Math.random() * 2 - 1; e.vy = Math.random() * 2 - 1; }
      }

      if (e.alertMs > 0 && d < 1.0) this.state.player.hp = Math.max(0, this.state.player.hp - (e.boss ? 0.035 : 0.016) * dt * 0.1);
      e.fireMs -= dt;
      if (e.alertMs > 0 && e.fireMs <= 0 && d < 12) { this.fireGun("enemy", e.x, e.y, this.state.player.x, this.state.player.y); e.fireMs = e.boss ? 420 + Math.random() * 380 : e.leader ? 540 + Math.random() * 420 : 700 + Math.random() * 950; }
      e.x = ((e.x % WORLD_W) + WORLD_W) % WORLD_W; e.y = ((e.y % WORLD_H) + WORLD_H) % WORLD_H;
    });
  }
  updateEnemySpies(dt) {
    this.state.enemySpies.forEach((s) => {
      if (typeof s.vx !== "number") s.vx = Math.random() * 2 - 1;
      if (typeof s.vy !== "number") s.vy = Math.random() * 2 - 1;
      if (typeof s.cooldownMs !== "number") s.cooldownMs = 0;
      if (typeof s.seenMs !== "number") s.seenMs = 0;
      s.cooldownMs = Math.max(0, s.cooldownMs - dt);

      const dxp = this.state.player.x - s.x, dyp = this.state.player.y - s.y;
      const dp = Math.hypot(dxp, dyp) || 1;
      if (dp < 7.5) s.seenMs = 5000;
      else s.seenMs = Math.max(0, s.seenMs - dt);

      const target = this.findNearestBuilding(s.x, s.y, ["government", "factory", "shop", "fort"]);
      if (s.seenMs > 0) {
        s.x += (dxp / dp) * dt * 0.0014;
        s.y += (dyp / dp) * dt * 0.0014;
      } else if (target && Math.random() < 0.85) {
        const dxt = target.x - s.x, dyt = target.y - s.y, dtg = Math.hypot(dxt, dyt) || 1;
        s.x += (dxt / dtg) * dt * 0.0011;
        s.y += (dyt / dtg) * dt * 0.0011;
        if (dtg < 1.7 && s.cooldownMs <= 0) {
          this.state.market.stock.ammo = Math.max(0, this.state.market.stock.ammo - 3);
          this.state.inventory.metal = Math.max(0, this.state.inventory.metal - 1);
          this.state.social.anger = this.clamp(this.state.social.anger + 0.4, 18, 0, 100);
          this.pushNpcMessage("Counterintelligence", `Enemy spy sabotaged ${target.type}. Ammo stock reduced.`);
          s.cooldownMs = 12000;
        }
      } else {
        s.x += s.vx * dt * 0.0009;
        s.y += s.vy * dt * 0.0009;
        if (Math.random() < 0.03) { s.vx = Math.random() * 2 - 1; s.vy = Math.random() * 2 - 1; }
      }

      if (dp < 1.2 && s.cooldownMs <= 0) {
        const stolenCoins = Math.min(10, Math.floor(this.state.player.coins));
        const stolenAmmo = Math.min(2, Math.floor(this.state.player.ammo));
        if (stolenCoins > 0) this.state.player.coins -= stolenCoins;
        if (stolenAmmo > 0) this.state.player.ammo -= stolenAmmo;
        this.pushNpcMessage("Counterintelligence", `Enemy spy stole ${stolenCoins} coins and ${stolenAmmo} ammo.`);
        s.cooldownMs = 10000;
      }

      s.x = ((s.x % WORLD_W) + WORLD_W) % WORLD_W;
      s.y = ((s.y % WORLD_H) + WORLD_H) % WORLD_H;
    });
  }

  updateBullets(dt) {
    const step = (arr) => { arr.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }); return arr.filter((b) => b.life > 0); };
    this.state.bullets = step(this.state.bullets); this.state.friendlyBullets = step(this.state.friendlyBullets); this.state.enemyBullets = step(this.state.enemyBullets);
    const hit = (arr, dmg) => { arr.forEach((b) => { this.state.enemies.forEach((e) => { if (e.hp <= 0) return; if (Math.hypot(b.x - e.x, b.y - e.y) < 0.7) { e.hp -= dmg; b.life = 0; this.createExplosion(e.x, e.y, e.boss ? 1.3 : 0.95, e.boss ? "255,80,60" : "255,140,60"); if (e.hp <= 0 && e.boss) this.playExplosionSound(); } }); }); };
    const hitSpies = (arr, dmg) => { arr.forEach((b) => { this.state.enemySpies.forEach((s) => { if (s.hp <= 0) return; if (Math.hypot(b.x - s.x, b.y - s.y) < 0.65) { s.hp -= dmg; b.life = 0; this.createExplosion(s.x, s.y, 0.85, "190,90,255"); } }); }); };
    hit(this.state.bullets, 2.4); hit(this.state.friendlyBullets, 1.1);
    hitSpies(this.state.bullets, 2.2); hitSpies(this.state.friendlyBullets, 1.0);
    this.state.enemyBullets.forEach((b) => { if (Math.hypot(b.x - this.state.player.x, b.y - this.state.player.y) < 0.8) { b.life = 0; this.state.player.hp = Math.max(0, this.state.player.hp - 0.55); this.createExplosion(this.state.player.x, this.state.player.y, 0.9, "255,110,90"); } });
    this.state.enemies = this.state.enemies.filter((e) => e.hp > 0); if (this.state.enemies.length === 0) this.state.raid.active = false;
    this.state.enemySpies = this.state.enemySpies.filter((s) => s.hp > 0);
    this.state.explosions.forEach((e) => { e.life -= dt; }); this.state.explosions = this.state.explosions.filter((e) => e.life > 0);
  }

  updateMessages(dt) {
    // Strict mode: villagers respond only to player messages.
    this.messageMs += dt;
  }

  update(dt) {
    // Short day cycle: each in-game day now advances quickly.
    this.worldTimeMs += dt; if (this.worldTimeMs > 45000) { this.worldTimeMs = 0; this.state.day += 1; this.growPopulationForNewDay(); }
    this.updateWeather(dt);
    this.housingTickMs += dt;
    if (this.housingTickMs > 8000) { this.housingTickMs = 0; this.updateHousing(); }
    this.updateBuildingEntranceLocks();
    if (this.state.command?.ttlMs > 0) {
      this.state.command.ttlMs = Math.max(0, this.state.command.ttlMs - dt);
      if (this.state.command.ttlMs === 0) this.state.command.type = "none";
    }
    this.raiderWaveMs += dt; if (this.raiderWaveMs >= RAIDER_WAVE_MS) { this.raiderWaveMs = 0; this.spawnRaidWave(); }
    this.updatePlayer(dt); this.updateAnimals(dt); this.updateShips(dt); this.updateVillagerAI(dt); this.updateEnemies(dt); this.updateEnemySpies(dt); this.updateBullets(dt); this.updateJails(dt); this.updateSupplyAndWar(dt); this.updateRivalCivilizations(dt); this.updateRivalPeople(dt); this.updateSpaceAndMissiles(dt); this.updateGovernment(dt); this.updateMessages(dt); this.updateHighScore(); this.updateHud();
  }

  tileColor(t) {
    if (t === "ocean") return "#1d4f84";
    if (t === "river") return "#2f8fce";
    if (t === "water") return "#2f78b8";
    if (t === "forest") return "#2f7c3f";
    if (t === "fruit") return "#4d9444";
    if (t === "hill") return "#8f7a54";
    if (t === "ore") return "#6b6f7a";
    return "#4c8b42";
  }
  drawMap() {
    if (!this.mapCtx || !this.mapCanvas) return;
    const c = this.mapCtx, w = this.mapCanvas.width, h = this.mapCanvas.height, sx = w / WORLD_W, sy = h / WORLD_H;
    c.clearRect(0, 0, w, h);

    for (let y = 0; y < WORLD_H; y += 1) {
      for (let x = 0; x < WORLD_W; x += 1) {
        c.fillStyle = this.tileColor(this.state.world[y][x].type);
        c.fillRect(x * sx, y * sy, sx + 1, sy + 1);
      }
    }

    const cellsX = 40, cellsY = 30;
    const grid = Array.from({ length: cellsY }, () => Array(cellsX).fill(0));
    this.state.villagers.forEach((v) => {
      const gx = Math.max(0, Math.min(cellsX - 1, Math.floor((v.x / WORLD_W) * cellsX)));
      const gy = Math.max(0, Math.min(cellsY - 1, Math.floor((v.y / WORLD_H) * cellsY)));
      grid[gy][gx] += 1;
    });
    let maxPop = 0;
    for (let gy = 0; gy < cellsY; gy += 1) for (let gx = 0; gx < cellsX; gx += 1) maxPop = Math.max(maxPop, grid[gy][gx]);
    if (maxPop > 0) {
      const cw = w / cellsX, ch = h / cellsY;
      for (let gy = 0; gy < cellsY; gy += 1) {
        for (let gx = 0; gx < cellsX; gx += 1) {
          const p = grid[gy][gx];
          if (p <= 0) continue;
          const t = p / maxPop;
          const alpha = 0.12 + t * 0.5;
          c.fillStyle = `rgba(255, 70, 70, ${alpha.toFixed(3)})`;
          c.fillRect(gx * cw, gy * ch, cw, ch);
        }
      }
    }

    c.fillStyle = "#ff3d3d";
    c.fillRect(this.state.player.x * sx - 2, this.state.player.y * sy - 2, 4, 4);
    this.state.enemies.forEach((e) => {
      c.fillStyle = e.boss ? "#ff00aa" : e.leader ? "#ffd24a" : "#ff6b6b";
      c.fillRect(e.x * sx - 1.5, e.y * sy - 1.5, 3, 3);
    });
    this.state.enemySpies.forEach((s) => {
      c.fillStyle = "#b687ff";
      c.fillRect(s.x * sx - 1.2, s.y * sy - 1.2, 2.4, 2.4);
    });
    this.state.rival.civilizations.forEach((civ) => {
      c.fillStyle = civ.color || "#ff9b3d";
      c.fillRect(civ.x * sx - 3, civ.y * sy - 3, 6, 6);
    });
    this.state.rival.people.forEach((p) => {
      c.fillStyle = "#ffb04d";
      c.fillRect(p.x * sx - 1, p.y * sy - 1, 2, 2);
    });

    c.fillStyle = "rgba(0,0,0,0.55)";
    c.fillRect(8, 8, 300, 50);
    c.fillStyle = "#fff";
    c.font = "12px Trebuchet MS";
    c.fillText("Population Map (red = higher density)", 14, 22);
    c.fillText(`Villagers: ${this.state.villagers.length}`, 14, 36);
    c.fillText(`Rival capitals: ${this.state.rival.civilizations.length} | Rival people: ${this.state.rival.people.length}`, 14, 50);
    c.fillText(`Raiders: ${this.state.enemies.length} (red=raider, yellow=leader, pink=boss)`, 14, 64);
    c.fillText(`Enemy spies: ${this.state.enemySpies.length} (purple)`, 14, 78);
  }
  drawEntity(x, y, top, body, label, cam, cw, ch) { const cx = cam.x * TILE - cw / 2, cy = cam.y * TILE - ch / 2, px = x * TILE - cx, py = y * TILE - cy; this.ctx.fillStyle = body; this.ctx.fillRect(px + 5, py + 10, 14, 12); this.ctx.fillStyle = top; this.ctx.fillRect(px + 4, py + 2, 16, 10); this.ctx.fillStyle = "#eaf2ff"; this.ctx.font = "11px Trebuchet MS"; this.ctx.fillText(label, px - 4, py - 2); }
  drawAnimal(a, cam, cw, ch) { const cx = cam.x * TILE - cw / 2, cy = cam.y * TILE - ch / 2, px = a.x * TILE - cx, py = a.y * TILE - cy; const c = a.type === "cow" ? "#8d5e3b" : a.type === "sheep" ? "#d7dbe2" : a.type === "goat" ? "#bca687" : "#8f6f4f"; this.ctx.fillStyle = c; this.ctx.fillRect(px + 2, py + 10, 14, 8); this.ctx.fillStyle = "#f3f5fa"; this.ctx.fillRect(px + 11, py + 7, 7, 6); this.ctx.fillStyle = "#111"; this.ctx.fillRect(px + 13, py + 9, 1.5, 1.5); }
  drawBoat(b, cam, cw, ch) {
    const cx = cam.x * TILE - cw / 2, cy = cam.y * TILE - ch / 2, px = b.x * TILE - cx, py = b.y * TILE - cy;
    const hull = b.type === "defense" ? "#6b3f1e" : b.type === "trading" ? "#5f421f" : b.type === "transport" ? "#664a2a" : "#87502a";
    const flag = b.type === "defense" ? "#ff6b6b" : b.type === "trading" ? "#ffe28a" : b.type === "transport" ? "#b8f58f" : "#7de3ff";
    this.ctx.fillStyle = "rgba(0,0,0,0.25)"; this.ctx.fillRect(px - 2, py + 16, 18, 3);
    this.ctx.fillStyle = hull; this.ctx.fillRect(px - 3, py + 9, 18, 8);
    this.ctx.fillStyle = "#f2f2f2"; this.ctx.fillRect(px + 5, py - 1, 2, 8);
    this.ctx.fillStyle = flag; this.ctx.beginPath(); this.ctx.moveTo(px + 7, py - 1); this.ctx.lineTo(px + 13, py + 3); this.ctx.lineTo(px + 7, py + 7); this.ctx.closePath(); this.ctx.fill();
  }
  drawFlag(x, y, f, cam, cw, ch, s = 1) { const cx = cam.x * TILE - cw / 2, cy = cam.y * TILE - ch / 2, px = x * TILE - cx, py = y * TILE - cy; this.ctx.fillStyle = "#f6f6f6"; this.ctx.fillRect(px + 22, py - 20 * s, 2.2, 24 * s); this.ctx.fillStyle = "#111"; this.ctx.fillRect(px + 24, py - 20 * s, 20 * s, 11 * s); this.ctx.fillStyle = f?.color || "#2c7be5"; this.ctx.fillRect(px + 25, py - 19 * s, 18 * s, 9 * s); this.ctx.fillStyle = "#fff"; this.ctx.font = `${Math.max(9, Math.floor(8 * s))}px Trebuchet MS`; this.ctx.fillText((f?.symbol || "SC").slice(0, 2).toUpperCase(), px + 28, py - 12 * s); }
  drawAstronaut(a, cam, cw, ch) {
    const cx = cam.x * TILE - cw / 2, cy = cam.y * TILE - ch / 2, px = a.x * TILE - cx, py = a.y * TILE - cy;
    this.ctx.fillStyle = "#f4f8ff";
    this.ctx.fillRect(px + 5, py + 10, 13, 12);
    this.ctx.fillStyle = "#87b8ff";
    this.ctx.fillRect(px + 4, py + 2, 15, 9);
    this.ctx.fillStyle = "#e9f4ff";
    this.ctx.fillRect(px + 7, py + 5, 8, 4);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "11px Trebuchet MS";
    this.ctx.fillText(`Astronaut ${a.phase}`, px - 10, py - 2);
  }
  drawRocket(r, cam, cw, ch) {
    const cx = cam.x * TILE - cw / 2, cy = cam.y * TILE - ch / 2, px = r.x * TILE - cx, py = r.y * TILE - cy;
    this.ctx.fillStyle = "#f6f6f6";
    this.ctx.fillRect(px + 7, py + 2, 8, 20);
    this.ctx.fillStyle = "#ff6b6b";
    this.ctx.fillRect(px + 8, py, 6, 4);
    this.ctx.fillStyle = "#7ec8ff";
    this.ctx.fillRect(px + 9, py + 7, 4, 5);
    if (r.phase === "launch") {
      this.ctx.fillStyle = "rgba(255,180,80,0.9)";
      this.ctx.fillRect(px + 9, py + 22, 4, 6);
    }
  }

  render() {
    const c = this.ctx, cw = this.canvas.width, ch = this.canvas.height; c.clearRect(0, 0, cw, ch);
    const cam = { x: this.state.player.x, y: this.state.player.y }, r = 22, cx = cam.x * TILE - cw / 2, cy = cam.y * TILE - ch / 2;
    for (let y = Math.floor(cam.y - r); y < Math.floor(cam.y + r); y += 1) for (let x = Math.floor(cam.x - r); x < Math.floor(cam.x + r); x += 1) { const t = this.getTileAt(x, y), px = x * TILE - cx, py = y * TILE - cy; c.fillStyle = this.tileColor(t.type); c.fillRect(px, py, TILE, TILE); c.strokeStyle = "rgba(0,0,0,0.15)"; c.strokeRect(px, py, TILE, TILE); }
    if (this.state.weather.type === "Rain" || this.state.weather.type === "Storm") {
      const drops = this.state.weather.type === "Storm" ? 220 : 140;
      c.strokeStyle = this.state.weather.type === "Storm" ? "rgba(180,220,255,0.32)" : "rgba(180,220,255,0.24)";
      c.lineWidth = 1;
      for (let i = 0; i < drops; i += 1) {
        const rx = (i * 73 + this.worldTimeMs * 0.45) % cw;
        const ry = (i * 41 + this.worldTimeMs * 0.9) % ch;
        c.beginPath();
        c.moveTo(rx, ry);
        c.lineTo(rx - 3, ry + 8);
        c.stroke();
      }
    }
    if (this.state.weather.type === "Snow") {
      c.fillStyle = "rgba(240,248,255,0.45)";
      for (let i = 0; i < 120; i += 1) {
        const sx = (i * 61 + this.worldTimeMs * 0.12) % cw;
        const sy = (i * 37 + this.worldTimeMs * 0.25) % ch;
        c.fillRect(sx, sy, 2, 2);
      }
    }
    if (this.state.weather.type === "Storm") {
      c.fillStyle = "rgba(40,40,55,0.18)";
      c.fillRect(0, 0, cw, ch);
      if ((this.worldTimeMs % 2600) < 120) {
        c.fillStyle = "rgba(230,240,255,0.16)";
        c.fillRect(0, 0, cw, ch);
      }
    }
    if (this.state.raid.active) { c.fillStyle = "rgba(180,0,0,0.16)"; c.fillRect(0, 0, cw, ch); }
    this.state.buildings.forEach((b) => {
      this.drawEntity(b.x, b.y, "#c8ad7f", "#8f6f44", b.type, cam, cw, ch);
      if (b.entranceBlocked) {
        const px = b.x * TILE - cx, py = b.y * TILE - cy;
        c.fillStyle = "#ff5858";
        c.fillRect(px + 6, py + 21, 13, 3);
        c.fillStyle = "#1b0e0e";
        c.fillRect(px + 6, py + 18, 3, 3);
        c.fillRect(px + 16, py + 18, 3, 3);
      }
    });
    this.state.rival.civilizations.forEach((civ) => {
      this.drawEntity(civ.x, civ.y, civ.color, "#2a1d1d", civ.name, cam, cw, ch);
      this.drawFlag(civ.x, civ.y, { color: civ.color, symbol: civ.name.slice(0, 2).toUpperCase() }, cam, cw, ch, 1.25);
    });
    this.state.rival.people.forEach((p) => {
      const civ = this.state.rival.civilizations.find((x) => x.id === p.civId);
      const top = civ?.color || "#e38b3d";
      this.drawEntity(p.x, p.y, top, "#3a2a1d", p.name, cam, cw, ch);
    });
    this.state.navy.fishingBoats.forEach((b) => this.drawBoat(b, cam, cw, ch));
    this.state.navy.defenseBoats.forEach((b) => this.drawBoat(b, cam, cw, ch));
    this.state.navy.tradingShips.forEach((b) => this.drawBoat(b, cam, cw, ch));
    this.state.navy.transportShips.forEach((b) => this.drawBoat(b, cam, cw, ch));
    if (this.state.space.rocket?.active) this.drawRocket(this.state.space.rocket, cam, cw, ch);
    if (this.state.space.astronaut?.active) this.drawAstronaut(this.state.space.astronaut, cam, cw, ch);
    this.state.animals.forEach((a) => this.drawAnimal(a, cam, cw, ch));
    this.state.villagers.forEach((v) => { const top = (v.mood || 0) > 82 ? "#ff6b6b" : v.role === "Trader" ? "#f0ad4e" : v.role === "Guard" ? "#78a8ff" : "#66d98f"; this.drawEntity(v.x, v.y, top, "#2a2a2a", v.name, cam, cw, ch); });
    this.state.enemies.forEach((e) => {
      const top = e.boss ? "#8d1c1c" : e.leader ? "#f4b942" : "#df5757";
      const body = e.boss ? "#3f0e0e" : e.leader ? "#6c4e12" : "#631f1f";
      this.drawEntity(e.x, e.y, top, body, e.name, cam, cw, ch);
      this.drawFlag(e.x, e.y, this.state.flags.raider, cam, cw, ch, e.boss ? 1.5 : e.leader ? 1.35 : 1.2);
    });
    this.state.enemySpies.forEach((s) => this.drawEntity(s.x, s.y, "#b687ff", "#3a245f", s.name, cam, cw, ch));
    this.drawEntity(this.state.player.x, this.state.player.y, "#78d1ff", "#244861", "Player", cam, cw, ch); this.drawFlag(this.state.player.x, this.state.player.y, this.state.flags.player, cam, cw, ch, 1.6);
    c.fillStyle = "#ffd447"; this.state.bullets.forEach((b) => { c.fillRect(b.x * TILE - cx + 8, b.y * TILE - cy + 10, 6, 3); });
    c.fillStyle = "#8bff8b"; this.state.friendlyBullets.forEach((b) => { c.fillRect(b.x * TILE - cx + 8, b.y * TILE - cy + 10, 6, 3); });
    c.fillStyle = "#ff8e8e"; this.state.enemyBullets.forEach((b) => { c.fillRect(b.x * TILE - cx + 8, b.y * TILE - cy + 10, 6, 3); });
    this.state.explosions.forEach((e) => { const px = e.x * TILE - cx + 12, py = e.y * TILE - cy + 12, t = e.life / e.maxLife, rad = (8 + 12 * (1 - t)) * e.size; c.fillStyle = `rgba(${e.color},${Math.max(0.1, t).toFixed(3)})`; c.beginPath(); c.arc(px, py, rad, 0, Math.PI * 2); c.fill(); c.fillStyle = `rgba(255,230,170,${Math.max(0.06, t * 0.7).toFixed(3)})`; c.beginPath(); c.arc(px, py, rad * 0.5, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(0, 0, cw, 28); c.fillStyle = "#fff"; c.font = "14px Trebuchet MS"; c.fillText(`Day ${this.state.day} | ${this.state.weather.type} ${this.state.weather.tempC}C | Next Raid ${Math.max(0, Math.ceil((RAIDER_WAVE_MS - this.raiderWaveMs) / 1000))}s`, 10, 19);
    if (this.state.space.launchAttractMs > 0 && this.state.space.astronaut?.active) {
      c.fillStyle = "rgba(16,20,36,0.72)";
      c.fillRect(cw - 330, 6, 322, 22);
      c.fillStyle = "#cde8ff";
      c.font = "13px Trebuchet MS";
      c.fillText(`Launch Event Live: ${Math.ceil(this.state.space.launchAttractMs / 1000)}s`, cw - 320, 21);
    }
  }

  updateHud() {
    const e = (id) => document.getElementById(id);
    const setText = (id, v) => { const el = e(id); if (el) el.textContent = v; };
    const setHtml = (id, v) => { const el = e(id); if (el) el.innerHTML = v; };
    setText("healthText", `${Math.round(this.state.player.hp)}/10`); setText("armorText", String(Math.floor(this.state.player.armor || 0))); setText("coinsText", String(Math.floor(this.state.player.coins || 0)));
    const wars = this.state.diplomacy.factions.filter((f) => f.atWar).length;
    setText("weatherText", `${this.state.weather.type} ${this.state.weather.tempC}C, ${this.state.weather.windKph}kph`); setText("governmentText", `${this.state.government.type} A:${Math.round(this.state.government.approval)}% T:${Math.floor(this.state.government.taxRate)}% L:${Math.floor(this.state.government.lawStrictness)} W:${wars}`);
    if (this.raidWarningEl) this.raidWarningEl.style.display = this.state.raid.active ? "block" : "none";
    const rivalWar = this.state.rival.civilizations.filter((c) => c.atWar).length;
    const rivalPower = this.state.rival.civilizations.reduce((a, c) => a + Math.floor(c.military), 0);
    setHtml("inventoryView", [`Wood: ${Math.floor(this.state.inventory.wood)}`, `Stone: ${Math.floor(this.state.inventory.stone)}`, `Food: ${Math.floor(this.state.inventory.food)}`, `Clothing: ${Math.floor(this.state.inventory.clothing)}`, `Metal: ${Math.floor(this.state.inventory.metal)}`, `Fuel: ${Math.floor(this.state.inventory.fuel)}`, `Seeds: ${Math.floor(this.state.inventory.seeds)}`, `Science: ${Math.floor(this.state.inventory.science)}`, `Ammo: ${Math.floor(this.state.player.ammo)}`, `Animals: ${this.state.animals.length}`, `Villagers: ${this.state.villagers.length}`, `Housed: ${this.state.villagers.filter((v) => !!v.homeId).length}`, `Blocked Entrances: ${this.state.buildings.filter((b) => b.entranceBlocked).length}`, `Jailers: ${this.state.villagers.filter((v) => v.role === "Guard" || v.brain?.state === "patrol" || v.brain?.state === "fight").length}`, `Prisoners: ${this.state.prison?.prisoners?.length || 0} | Captured Total: ${this.state.prison?.capturedTotal || 0}`, `Angry Villagers: ${this.state.villagers.filter((v) => (v.mood || 0) > 80).length}`, `Raiders: ${this.state.enemies.length}`, `Enemy Leaders: ${this.state.enemies.filter((x) => x.leader).length}`, `Enemy Spies: ${this.state.enemySpies.length}`, `Rival Civs: ${this.state.rival.civilizations.length} | Rival People: ${this.state.rival.people.length} | At War: ${rivalWar} | Rival Military: ${rivalPower}`, `Ships F/D/T/Tr: ${this.state.navy.fishingBoats.length}/${this.state.navy.defenseBoats.length}/${this.state.navy.tradingShips.length}/${this.state.navy.transportShips.length}`, `Satellites: ${this.state.space.satellites} | MissileDef: ${this.state.space.missileDefense}`, `Moon Bases: ${this.state.space.moonBases} | Colonies: ${this.state.space.colonies}`, `Space Missions: ${this.state.space.missions.length} | Explored: ${this.state.space.explored.length}`, `Astronaut: ${this.state.space.astronaut?.active ? `${this.state.space.astronaut.phase} (${this.state.space.astronaut.mission || "mission"})` : "Idle"}`, `Launch Attraction: ${Math.ceil((this.state.space.launchAttractMs || 0) / 1000)}s`, `High Score: ${this.highScore.score} (Day ${this.highScore.day}, Pop ${this.highScore.population}, Coins ${this.highScore.coins})`, `Anger: ${Math.floor(this.state.social.anger)}%`, `Bullets: ${this.state.bullets.length + this.state.friendlyBullets.length + this.state.enemyBullets.length}`].join("<br>"));
    setHtml("messageHistory", this.state.comms.slice(-10).map((m) => `<div><b>${m.from}:</b> ${m.text}</div>`).join(""));
    setHtml("statusFeed", this.logs.slice(-10).map((l) => `<div>${l}</div>`).join(""));
    setHtml("shopStock", `Food: ${Math.floor(this.state.market.stock.food)} @${this.state.market.prices.food.toFixed(1)}<br>Seeds: ${Math.floor(this.state.market.stock.seeds)} @${this.state.market.prices.seeds.toFixed(1)}<br>Fuel: ${Math.floor(this.state.market.stock.fuel)} @${this.state.market.prices.fuel.toFixed(1)}<br>Ammo: ${Math.floor(this.state.market.stock.ammo)} @${this.state.market.prices.ammo.toFixed(1)}`);
  }

  renderFatal(err) {
    const c = this.ctx, cw = this.canvas.width, ch = this.canvas.height;
    c.clearRect(0, 0, cw, ch);
    c.fillStyle = "#0f1117"; c.fillRect(0, 0, cw, ch);
    c.fillStyle = "#ff6f6f"; c.font = "bold 18px Trebuchet MS";
    c.fillText("Runtime Error", 20, 36);
    c.fillStyle = "#f2f6ff"; c.font = "14px Trebuchet MS";
    c.fillText(String(err?.message || err || "Unknown error"), 20, 64);
    c.fillText("Click Reset in the UI or hard refresh (Ctrl+F5).", 20, 88);
  }
  loop(ts) {
    if (!this.lastTs) this.lastTs = ts;
    const dt = Math.min(50, ts - this.lastTs);
    this.lastTs = ts;
    try {
      this.update(dt);
      this.render();
    } catch (err) {
      console.error(err);
      this.renderFatal(err);
      return;
    }
    requestAnimationFrame((t) => this.loop(t));
  }
}
