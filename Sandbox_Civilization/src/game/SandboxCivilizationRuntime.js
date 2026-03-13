// @ts-nocheck
const STORAGE_KEY = "sandbox_block_world_v4";
const TILE_W = 54;
const TILE_H = 28;
const BLOCK_H = 26;
const RENDER_RADIUS = 28;
const VIEW_RADIUS = 12;
const MIN_Z = -10;
const MAX_Z = 40;
const SEA_LEVEL = 4;
const PEOPLE_PER_WORLD = 20;
const INTERACT_DISTANCE = 4.4;
const EYE_HEIGHT = 0.72;
const STEP_HEIGHT = 1.15;
const GROUND_CONTACT_EPS = 0.18;
const PLAYER_RUN_SPEED = 8;
const PLAYER_SPRINT_SPEED = 12.5;
const PLAYER_SWIM_SPEED = 6.5;
const PLAYER_JUMP_SPEED = 13.5;
const PLAYER_GROUND_ACCEL = 40;
const PLAYER_GROUND_DRAG = 3.4;
const PLAYER_SWIM_ACCEL = 18;
const PLAYER_SWIM_DRAG = 2.8;
const PLAYER_AIR_ACCEL = 22;
const PLAYER_AIR_DRAG = 1.8;
const CAMERA_SMOOTHING = 5;
const WILDLIFE_TARGET_BASE = 34;

const ANIMAL_SPECIES = {
  grass: [
    { id: "deer", label: "Deer", shape: "grazer", scale: 1.02, speed: 1.45, depthBias: 0, palette: { body: "#9d7652", head: "#b28a63", limb: "#5f4531", accent: "#f7f2ea" } },
    { id: "boar", label: "Boar", shape: "grazer", scale: 0.92, speed: 1.2, depthBias: 0, palette: { body: "#6c5442", head: "#846854", limb: "#412f24", accent: "#efe3d4" } },
    { id: "hare", label: "Hare", shape: "grazer", scale: 0.64, speed: 1.8, depthBias: 0, palette: { body: "#bca58a", head: "#ceb89c", limb: "#745f4a", accent: "#fff7ef" } }
  ],
  sand: [
    { id: "camel", label: "Camel", shape: "grazer", scale: 1.12, speed: 1.15, depthBias: 0, palette: { body: "#caa26a", head: "#d9b57c", limb: "#8b6a41", accent: "#f7edda" } },
    { id: "lizard", label: "Lizard", shape: "grazer", scale: 0.52, speed: 1.7, depthBias: 0, palette: { body: "#9b9050", head: "#b1a664", limb: "#5d5732", accent: "#ebdf9a" } },
    { id: "crab", label: "Crab", shape: "crab", scale: 0.56, speed: 1.35, depthBias: 0, palette: { body: "#ce694d", head: "#e28363", limb: "#8f3f2d", accent: "#fff1ea" } }
  ],
  snow: [
    { id: "yak", label: "Yak", shape: "grazer", scale: 1.08, speed: 1.05, depthBias: 0, palette: { body: "#d7e1ea", head: "#eef5fb", limb: "#72808d", accent: "#1f2630" } },
    { id: "fox", label: "Fox", shape: "grazer", scale: 0.72, speed: 1.65, depthBias: 0, palette: { body: "#d76f3c", head: "#ef8c54", limb: "#7a351e", accent: "#fff6f1" } },
    { id: "snow-hare", label: "Snow Hare", shape: "grazer", scale: 0.66, speed: 1.78, depthBias: 0, palette: { body: "#eef5fb", head: "#f9fdff", limb: "#a4b3c0", accent: "#24303c" } }
  ],
  ocean: [
    { id: "reef-fish", label: "Reef Fish", shape: "fish", scale: 0.72, speed: 1.7, depthBias: 0.9, palette: { body: "#58c6ff", head: "#89dcff", limb: "#2387c0", accent: "#fff7db" } },
    { id: "sea-turtle", label: "Sea Turtle", shape: "turtle", scale: 0.94, speed: 1.0, depthBias: 1.1, palette: { body: "#5f9968", head: "#87bb7f", limb: "#396442", accent: "#d9e9b2" } },
    { id: "jellyfish", label: "Jellyfish", shape: "jelly", scale: 0.8, speed: 0.82, depthBias: 0.45, palette: { body: "#f0a8ff", head: "#ffd0ff", limb: "#b65fc4", accent: "#fff4ff" } }
  ]
};

const PERSON_NAMES = [
  "Asha", "Bren", "Cato", "Dina", "Eryk", "Faye", "Gori", "Hana", "Ivo", "Jiro",
  "Kira", "Luca", "Mina", "Nora", "Olek", "Pia", "Quin", "Ravi", "Sana", "Tari"
];

const BLOCK_LABELS = {
  wood: "Wood Block",
  stone: "Stone Block",
  metal: "Metal Block",
  tnt: "TNT",
  fire: "Fire",
  destroy: "Destroy Tool"
};

const WORLD_PROFILES = [
  { name: "Amber Wilds", ore: "amber_ore", oreChance: 0.12, treeBias: 0.01, oceanBias: 0.18, mountainBias: 0.18, waterfallBias: 0.08, zombieScale: 0.9, plainHeight: 4.4 },
  { name: "Crystal Reef", ore: "crystal_ore", oreChance: 0.11, treeBias: -0.008, oceanBias: 0.54, mountainBias: 0.08, waterfallBias: 0.18, zombieScale: 1.05, plainHeight: 4.0 },
  { name: "Sulfur Rift", ore: "sulfur_ore", oreChance: 0.14, treeBias: -0.014, oceanBias: 0.12, mountainBias: 0.34, waterfallBias: 0.04, zombieScale: 1.25, plainHeight: 4.1 },
  { name: "Pearl Deep", ore: "pearl_ore", oreChance: 0.1, treeBias: -0.01, oceanBias: 0.68, mountainBias: 0.12, waterfallBias: 0.22, zombieScale: 1.15, plainHeight: 3.8 },
  { name: "Iron Expanse", ore: "metal_ore", oreChance: 0.17, treeBias: -0.004, oceanBias: 0.22, mountainBias: 0.24, waterfallBias: 0.03, zombieScale: 1.0, plainHeight: 4.2 }
];

const RESOURCE_LABELS = {
  amber: "Amber",
  crystal: "Crystal",
  metal: "Metal",
  sulfur: "Sulfur",
  pearl: "Pearls"
};

const BIOME_LABELS = {
  grass: "Meadow",
  sand: "Dune Coast",
  snow: "Frost Ridge"
};

const STALL_COLORS = {
  wood: "#cf8a4a",
  stone: "#9aa4b0",
  metal: "#cfd7e2",
  tnt: "#c85858",
  amber: "#d89b45",
  crystal: "#69d8ef",
  sulfur: "#d9c24b",
  pearl: "#eef6ff"
};

const SHOP_CATALOG = [
  {
    id: "timber-bundle",
    reward: { bag: "inventory", key: "wood", amount: 10 },
    cost: { bag: "inventory", key: "stone", amount: 5 },
    tags: ["wood", "grass"]
  },
  {
    id: "mason-stock",
    reward: { bag: "inventory", key: "stone", amount: 10 },
    cost: { bag: "inventory", key: "wood", amount: 5 },
    tags: ["stone", "grass", "snow"]
  },
  {
    id: "forge-bars",
    reward: { bag: "inventory", key: "metal", amount: 3 },
    cost: { bag: "resources", key: "amber", amount: 2 },
    tags: ["metal", "amber", "grass"]
  },
  {
    id: "blast-kit",
    reward: { bag: "inventory", key: "tnt", amount: 2 },
    cost: { bag: "inventory", key: "metal", amount: 4 },
    tags: ["tnt", "sulfur"]
  },
  {
    id: "amber-cache",
    reward: { bag: "resources", key: "amber", amount: 2 },
    cost: { bag: "inventory", key: "stone", amount: 6 },
    tags: ["amber", "grass"]
  },
  {
    id: "crystal-cache",
    reward: { bag: "resources", key: "crystal", amount: 2 },
    cost: { bag: "inventory", key: "metal", amount: 3 },
    tags: ["crystal", "snow"]
  },
  {
    id: "sulfur-sacks",
    reward: { bag: "resources", key: "sulfur", amount: 2 },
    cost: { bag: "inventory", key: "stone", amount: 5 },
    tags: ["sulfur", "sand"]
  },
  {
    id: "pearl-basket",
    reward: { bag: "resources", key: "pearl", amount: 2 },
    cost: { bag: "inventory", key: "wood", amount: 6 },
    tags: ["pearl", "sand"]
  },
  {
    id: "builder-crate",
    reward: { bag: "inventory", key: "wood", amount: 6 },
    cost: { bag: "resources", key: "crystal", amount: 1 },
    tags: ["wood", "crystal", "snow"]
  },
  {
    id: "smelter-deal",
    reward: { bag: "inventory", key: "metal", amount: 2 },
    cost: { bag: "resources", key: "sulfur", amount: 1 },
    tags: ["metal", "sulfur", "sand"]
  },
  {
    id: "pearl-fuse",
    reward: { bag: "inventory", key: "tnt", amount: 1 },
    cost: { bag: "resources", key: "pearl", amount: 1 },
    tags: ["tnt", "pearl", "sand"]
  }
];

export class SandboxCivilizationGame {
  constructor() {
    this.canvas = document.getElementById("worldCanvas");
    this.ctx = this.canvas?.getContext("2d");
    if (!this.canvas || !this.ctx) throw new Error("Missing #worldCanvas");

    this.ui = {
      worldText: document.getElementById("worldText"),
      peopleText: document.getElementById("peopleText"),
      zombieText: document.getElementById("zombieText"),
      selectedText: document.getElementById("selectedText"),
      inventoryPanel: document.getElementById("inventoryPanel"),
      blockSelect: document.getElementById("blockSelect"),
      inventoryItems: document.getElementById("inventoryItems"),
      inventoryStats: document.getElementById("inventoryStats"),
      convertImportedBtn: document.getElementById("convertImportedBtn"),
      inventoryToggleBtn: document.getElementById("inventoryToggleBtn"),
      fullscreenBtn: document.getElementById("fullscreenBtn"),
      resetWorldBtn: document.getElementById("resetWorldBtn")
    };

    this.keys = {};
    this.mouse = { x: 0, y: 0 };
    this.lastTs = 0;
    this.ambientMs = 0;
    this.message = "";
    this.messageMs = 0;
    this.jumpQueued = false;
    this.inventoryButtonMap = {};
    this.lastDamageCause = "";
    this.cameraPoint = null;

    const saved = this.load();
    this.state = saved || this.newState();
    this.ensureState();
  }

  getWorldProfile(seed = (this.state?.seed || 1)) {
    const idx = Math.abs(Math.floor(seed)) % WORLD_PROFILES.length;
    return WORLD_PROFILES[idx];
  }

  getProfileResourceKey(profile = this.getWorldProfile()) {
    switch (profile.ore) {
      case "amber_ore": return "amber";
      case "crystal_ore": return "crystal";
      case "metal_ore": return "metal";
      case "sulfur_ore": return "sulfur";
      case "pearl_ore": return "pearl";
      default: return "";
    }
  }

  getProfileResourceLabel(profile = this.getWorldProfile()) {
    const key = this.getProfileResourceKey(profile);
    return RESOURCE_LABELS[key] || "Metal";
  }

  getTerrainSlope(x, y, h = this.terrainHeight(x, y)) {
    return Math.max(
      Math.abs(h - this.terrainHeight(x + 1, y)),
      Math.abs(h - this.terrainHeight(x - 1, y)),
      Math.abs(h - this.terrainHeight(x, y + 1)),
      Math.abs(h - this.terrainHeight(x, y - 1))
    );
  }

  getProfileOreAt(x, y, z, h, profile = this.getWorldProfile(this.state.seed)) {
    const seed = this.state.seed || 1;
    const depth = h - z;
    if (depth < 2) return "";

    const oreRoll = this.hash01(seed * 1.91 + x * 173 + y * 311 + z * 941);
    if (profile.ore === "pearl_ore") {
      if (h <= SEA_LEVEL + 1 && depth <= 3 && oreRoll > 0.82) return "pearl_ore";
    } else if (oreRoll > 1 - profile.oreChance) {
      return profile.ore;
    }

    const metalRoll = this.hash01(seed * 2.37 + x * 271 + y * 167 + z * 673);
    if (depth >= 3 && metalRoll > 0.94) return "metal_ore";
    return "";
  }

  getWaterfallInfo(x, y, h = this.terrainHeight(x, y)) {
    if (h < SEA_LEVEL + 1 || h >= MAX_Z - 3) return null;

    const seed = this.state.seed || 1;
    const profile = this.getWorldProfile(seed);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let bestTop = -Infinity;

    for (const [dx, dy] of dirs) {
      const sx = x + dx;
      const sy = y + dy;
      const sourceH = this.terrainHeight(sx, sy);
      const drop = sourceH - h;
      if (drop < 4) continue;
      if (this.biomeAt(sx, sy, sourceH) === "sand") continue;

      const wet = Math.sin((sx + seed * 0.17) * 0.045) + Math.cos((sy - seed * 0.11) * 0.042);
      const gate = this.hash01(seed * 1.13 + sx * 313 + sy * 733);
      if (wet + profile.waterfallBias < 1.08 || gate < 0.78) continue;

      bestTop = Math.max(bestTop, Math.min(MAX_Z, sourceH + 1));
    }

    if (bestTop < h + 3) return null;
    return { bottom: h + 1, top: bestTop };
  }

  createWeatherState(seed = (this.state?.seed || 1)) {
    const px = Math.floor(this.state?.player?.x || 0);
    const py = Math.floor(this.state?.player?.y || 0);
    let biome = "grass";
    if (this.state && typeof this.state.seed === "number") {
      biome = this.biomeAt(px, py, this.terrainHeight(px, py));
    }
    const roll = this.hash01(seed * 0.47 + Math.floor(this.ambientMs / 12000) * 13.1 + px * 0.07 + py * 0.05);
    let type = "clear";
    if (biome === "snow" && roll > 0.56) type = "snow";
    else if (roll > 0.87) type = "storm";
    else if (roll > 0.7) type = "rain";
    else if (roll > 0.44) type = "cloudy";
    return {
      type,
      timerMs: 50000 + Math.floor(this.hash01(seed * 0.91 + roll * 997) * 40000)
    };
  }

  getWeatherLabel(type = this.state?.weather?.type || "clear") {
    switch (type) {
      case "cloudy": return "Cloudy";
      case "rain": return "Rain";
      case "storm": return "Storm";
      case "snow": return "Snow";
      default: return "Clear";
    }
  }

  getBiomeLabel(biome) {
    return BIOME_LABELS[biome] || "Wilds";
  }

  getTradeBag(bag) {
    return bag === "resources" ? this.state.resources : this.state.inventory;
  }

  getTradeItemLabel(bag, key) {
    if (bag === "inventory") {
      switch (key) {
        case "wood": return "Wood";
        case "stone": return "Stone";
        case "metal": return "Metal";
        case "tnt": return "TNT";
        case "fire": return "Fire";
        default: return BLOCK_LABELS[key] || key;
      }
    }
    return RESOURCE_LABELS[key] || key;
  }

  formatTradeStack(item) {
    return `${item.amount} ${this.getTradeItemLabel(item.bag, item.key)}`;
  }

  describeShopOffer(offer) {
    if (!offer) return "";
    return `${offer.sale ? "Sale: " : ""}${this.formatTradeStack(offer.reward)} for ${this.formatTradeStack(offer.cost)}`;
  }

  getMerchantOffer(merchant) {
    const offers = merchant?.shop?.offers || [];
    if (!offers.length) return null;
    const idx = this.clamp(merchant.shop.cursor, 0, 0, offers.length - 1);
    merchant.shop.cursor = idx;
    return offers[idx];
  }

  isMerchant(person) {
    return Boolean(person && person.role === "merchant" && person.shop && person.stall);
  }

  getNearbyMerchant(maxDist = 3.2) {
    let best = null;
    let bestD = maxDist;
    for (const person of this.state.people) {
      if (!this.isMerchant(person)) continue;
      const tx = person.stall?.clerkX ?? person.x;
      const ty = person.stall?.clerkY ?? person.y;
      const d = Math.hypot(this.state.player.x - tx, this.state.player.y - ty);
      if (d < bestD && Math.abs(this.state.player.z - person.z) < 2.8) {
        bestD = d;
        best = person;
      }
    }
    return best;
  }

  cycleNearbyMerchantOffer() {
    const merchant = this.getNearbyMerchant();
    if (!merchant) {
      this.say("Move up to a villager stall to browse offers.");
      return;
    }
    const offers = merchant.shop?.offers || [];
    if (!offers.length) return;
    merchant.shop.cursor = (this.clamp(merchant.shop.cursor, 0, 0, offers.length - 1) + 1) % offers.length;
    this.say(`${merchant.name} now offers ${this.describeShopOffer(this.getMerchantOffer(merchant))}.`);
  }

  buyNearbyMerchantOffer() {
    const merchant = this.getNearbyMerchant();
    if (!merchant) {
      this.say("No stall close enough to trade.");
      return;
    }
    const offer = this.getMerchantOffer(merchant);
    if (!offer) return;

    const costBag = this.getTradeBag(offer.cost.bag);
    const rewardBag = this.getTradeBag(offer.reward.bag);
    if ((costBag[offer.cost.key] || 0) < offer.cost.amount) {
      this.say(`Need ${this.formatTradeStack(offer.cost)} for ${merchant.name}'s stall.`);
      return;
    }

    costBag[offer.cost.key] -= offer.cost.amount;
    rewardBag[offer.reward.key] = (rewardBag[offer.reward.key] || 0) + offer.reward.amount;
    merchant.shop.cursor = (merchant.shop.cursor + 1) % Math.max(1, merchant.shop.offers.length);
    this.say(`Bought ${this.formatTradeStack(offer.reward)} from ${merchant.name}.`);
    this.syncUi();
  }

  pickMerchantSpecialty(slot, biome) {
    const biomePool = biome === "sand"
      ? ["sulfur", "pearl", "tnt", "wood"]
      : biome === "snow"
        ? ["crystal", "stone", "metal", "wood"]
        : ["wood", "stone", "amber", "metal"];
    const fullPool = [...new Set([...biomePool, "wood", "stone", "metal", "tnt", "amber", "crystal", "sulfur", "pearl"])];
    const idx = Math.abs(Math.floor((this.state.seed || 1) * 0.13) + slot * 3) % fullPool.length;
    return fullPool[idx];
  }

  createShopOffers(seed, slot, specialty, biome) {
    const offers = SHOP_CATALOG
      .map((offer, i) => {
        let score = this.hash01(seed * 0.51 + slot * 73 + i * 19) * 6;
        if (offer.tags.includes(specialty)) score += 50;
        if (offer.tags.includes(biome)) score += 20;
        return {
          offer: {
            ...offer,
            reward: { ...offer.reward },
            cost: { ...offer.cost }
          },
          score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.offer);
    const saleIndex = Math.abs(Math.floor(seed * 0.17) + slot) % Math.max(1, offers.length);
    return offers.map((offer, i) => {
      if (i !== saleIndex) return offer;
      const costAmount = Math.max(1, offer.cost.amount - 1);
      return {
        ...offer,
        sale: true,
        cost: { ...offer.cost, amount: costAmount }
      };
    });
  }

  findLocalFlatSpot(cx, cy, radius = 2, preferredBiome = "") {
    let best = null;
    let bestScore = -Infinity;
    const baseX = Math.floor(cx);
    const baseY = Math.floor(cy);

    for (let x = baseX - radius; x <= baseX + radius; x += 1) {
      for (let y = baseY - radius; y <= baseY + radius; y += 1) {
        const h = this.terrainHeight(x, y);
        if (h <= SEA_LEVEL + 1) continue;
        const biome = this.biomeAt(x, y, h);
        if (preferredBiome && biome !== preferredBiome) continue;
        const dist = Math.hypot(x - cx, y - cy);
        const slope = this.getTerrainSlope(x, y, h);
        const score = 20 - dist * 2.6 - slope * 8 + this.hash01(this.state.seed * 0.79 + x * 31 + y * 47);
        if (score > bestScore) {
          bestScore = score;
          best = {
            x: x + 0.5,
            y: y + 0.5,
            z: this.getTopSolidZ(x, y) + 1,
            biome
          };
        }
      }
    }

    return best || {
      x: Math.floor(cx) + 0.5,
      y: Math.floor(cy) + 0.5,
      z: this.getTopSolidZ(Math.floor(cx), Math.floor(cy)) + 1,
      biome: this.biomeAt(Math.floor(cx), Math.floor(cy))
    };
  }

  ensureMerchants() {
    const wanted = Math.max(3, Math.min(5, Math.floor(this.state.people.length / 5)));
    const merchants = this.state.people.filter((person) => person && person.role === "merchant");

    merchants.forEach((person, slot) => {
      const spot = this.findLocalFlatSpot(person.homeX, person.homeY, 2, person.stall?.biome || "");
      const specialty = person.shop?.specialty || this.pickMerchantSpecialty(slot, spot.biome);
      const offers = Array.isArray(person.shop?.offers) && person.shop.offers.length >= 3
        ? person.shop.offers
        : this.createShopOffers(this.state.seed, slot, specialty, spot.biome);
      person.role = "merchant";
      person.merchantSlot = slot;
      person.shop = {
        specialty,
        title: `${this.getTradeItemLabel(["amber", "crystal", "sulfur", "pearl"].includes(specialty) ? "resources" : "inventory", specialty)} Stall`,
        cursor: this.clamp(person.shop?.cursor, 0, 0, Math.max(0, offers.length - 1)),
        offers,
        open: true
      };
      person.stall = {
        x: spot.x,
        y: spot.y,
        z: spot.z,
        biome: spot.biome,
        clerkX: spot.x,
        clerkY: spot.y + 0.82,
        color: STALL_COLORS[specialty] || "#d6934f",
        privateZoneRadius: 2.4
      };
      if (!Number.isFinite(person.x) || !Number.isFinite(person.y) || Math.hypot(person.x - person.stall.x, person.y - person.stall.y) > 12) {
        person.x = person.stall.clerkX;
        person.y = person.stall.clerkY;
      }
      person.z = this.getTopSolidZ(Math.floor(person.x), Math.floor(person.y)) + 1;
    });

    if (merchants.length >= wanted) return;

    for (const person of this.state.people) {
      if (merchants.length >= wanted) break;
      if (!person || person.role === "merchant") continue;
      person.role = "merchant";
      person.shop = null;
      person.stall = null;
      merchants.push(person);
    }

    merchants.forEach((person, slot) => {
      if (person.shop && person.stall) return;
      const spot = this.findLocalFlatSpot(person.homeX, person.homeY, 2);
      const specialty = this.pickMerchantSpecialty(slot, spot.biome);
      person.merchantSlot = slot;
      person.shop = {
        specialty,
        title: `${this.getTradeItemLabel(["amber", "crystal", "sulfur", "pearl"].includes(specialty) ? "resources" : "inventory", specialty)} Stall`,
        cursor: 0,
        offers: this.createShopOffers(this.state.seed, slot, specialty, spot.biome),
        open: true
      };
      person.stall = {
        x: spot.x,
        y: spot.y,
        z: spot.z,
        biome: spot.biome,
        clerkX: spot.x,
        clerkY: spot.y + 0.82,
        color: STALL_COLORS[specialty] || "#d6934f",
        privateZoneRadius: 2.4
      };
      person.x = person.stall.clerkX;
      person.y = person.stall.clerkY;
      person.z = this.getTopSolidZ(Math.floor(person.x), Math.floor(person.y)) + 1;
      person.turnMs = 0.6 + this.hash01(this.state.seed + slot * 41) * 2;
      person.actionMs = 5 + this.hash01(this.state.seed + slot * 67) * 5;
    });
  }

  newState() {
    const seed = Math.floor(Math.random() * 9999999);
    const inventory = { wood: 24, stone: 32, metal: 18, tnt: 6, fire: 999 };
    const imported = { wood: 0, stone: 0, metal: 0, tnt: 0 };
    const resources = { amber: 0, crystal: 0, sulfur: 0, pearl: 0, metal: 0 };
    const player = { x: 0, y: 0, z: 2, facing: 0, pitch: -0.12, velX: 0, velY: 0, velZ: 0, hp: 10, flyMode: false };
    const profile = this.getWorldProfile(seed);
    const nextState = {
      worldIndex: 1,
      seed,
      player,
      selectedBlock: "wood",
      inventoryOpen: true,
      inventory,
      imported,
      resources,
      worldMods: {},
      burning: {},
      people: [],
      animals: [],
      zombies: [],
      explosions: [],
      animalSpawnMs: 2000,
      zombieSpawnMs: 5000,
      importTimerMs: 60000,
      weather: this.createWeatherState(seed),
      worldName: `${profile.name}-${(seed % 9000) + 1000}`,
      portalTravelCount: 0,
      worldSpawn: null,
      recentSpawns: [],
      personSerial: 0,
      animalSerial: 0,
      zombieSerial: 0
    };
    this.state = nextState;
    const spawn = this.findFreshSpawn({
      seed,
      salt: 1,
      minRadius: 16 + Math.floor(this.hash01(seed * 0.73) * 28)
    });
    nextState.player.x = spawn.x;
    nextState.player.y = spawn.y;
    nextState.player.z = this.getTopSolidZ(Math.floor(spawn.x), Math.floor(spawn.y)) + 1;
    nextState.worldSpawn = {
      x: spawn.x,
      y: spawn.y,
      z: nextState.player.z,
      biome: spawn.biome || this.biomeAt(Math.floor(spawn.x), Math.floor(spawn.y))
    };
    this.rememberSpawnPoint(spawn, seed);
    nextState.people = this.createPeople(seed, spawn);
    this.seedWorldAnimals();
    this.seedWorldZombies(8);
    this.ensureMerchants();
    return nextState;
  }

  ensureState() {
    const s = this.state;
    if (typeof s.worldIndex !== "number") s.worldIndex = 1;
    if (typeof s.seed !== "number") s.seed = Math.floor(Math.random() * 9999999);
    if (!s.player) s.player = { x: 0, y: 0, z: 2, facing: 0, pitch: -0.12, velX: 0, velY: 0, velZ: 0, hp: 10, flyMode: false };
    if (typeof s.player.x !== "number") s.player.x = 0;
    if (typeof s.player.y !== "number") s.player.y = 0;
    if (typeof s.player.z !== "number") s.player.z = this.getTopSolidZ(0, 0) + 1;
    if (typeof s.player.facing !== "number") s.player.facing = 0;
    if (typeof s.player.pitch !== "number") s.player.pitch = -0.12;
    if (typeof s.player.velX !== "number") s.player.velX = 0;
    if (typeof s.player.velY !== "number") s.player.velY = 0;
    if (typeof s.player.velZ !== "number") s.player.velZ = 0;
    if (typeof s.player.hp !== "number") s.player.hp = 10;
    if (typeof s.player.flyMode !== "boolean") s.player.flyMode = false;
    s.player.flyMode = false;
    if (typeof s.portalTravelCount !== "number") s.portalTravelCount = 0;
    if (typeof s.personSerial !== "number") s.personSerial = 0;
    if (typeof s.animalSerial !== "number") s.animalSerial = 0;
    if (typeof s.zombieSerial !== "number") s.zombieSerial = 0;
    if (!s.inventory) s.inventory = { wood: 24, stone: 32, metal: 18, tnt: 6, fire: 999 };
    if (typeof s.inventory.wood !== "number") s.inventory.wood = 0;
    if (typeof s.inventory.stone !== "number") s.inventory.stone = 0;
    if (typeof s.inventory.metal !== "number") s.inventory.metal = 0;
    if (typeof s.inventory.tnt !== "number") s.inventory.tnt = 0;
    if (typeof s.inventory.fire !== "number") s.inventory.fire = 999;
    if (!s.imported) s.imported = { wood: 0, stone: 0, metal: 0, tnt: 0 };
    if (typeof s.imported.wood !== "number") s.imported.wood = 0;
    if (typeof s.imported.stone !== "number") s.imported.stone = 0;
    if (typeof s.imported.metal !== "number") s.imported.metal = 0;
    if (typeof s.imported.tnt !== "number") s.imported.tnt = 0;
    if (!s.resources || typeof s.resources !== "object") s.resources = { amber: 0, crystal: 0, sulfur: 0, pearl: 0, metal: 0 };
    if (typeof s.resources.amber !== "number") s.resources.amber = 0;
    if (typeof s.resources.crystal !== "number") s.resources.crystal = 0;
    if (typeof s.resources.metal !== "number") s.resources.metal = 0;
    if (typeof s.resources.sulfur !== "number") s.resources.sulfur = 0;
    if (typeof s.resources.pearl !== "number") s.resources.pearl = 0;
    if (!BLOCK_LABELS[s.selectedBlock]) s.selectedBlock = "wood";
    if (!s.worldMods || typeof s.worldMods !== "object") s.worldMods = {};
    if (!s.burning || typeof s.burning !== "object") s.burning = {};
    if (!Array.isArray(s.people)) s.people = this.createPeople(s.seed);
    if (s.people.length > PEOPLE_PER_WORLD) s.people = s.people.slice(0, PEOPLE_PER_WORLD);
    s.people.forEach((person, i) => {
      if (!person || typeof person !== "object") return;
      if (typeof person.id !== "string" || !person.id) person.id = `p-${i}-${s.seed}`;
      if (typeof person.name !== "string" || !person.name) person.name = PERSON_NAMES[i % PERSON_NAMES.length];
      if (typeof person.x !== "number") person.x = 0;
      if (typeof person.y !== "number") person.y = 0;
      if (typeof person.homeX !== "number") person.homeX = person.x;
      if (typeof person.homeY !== "number") person.homeY = person.y;
      if (typeof person.z !== "number") person.z = this.getTopSolidZ(Math.floor(person.x), Math.floor(person.y)) + 1;
      if (typeof person.dir !== "number") person.dir = this.hash01(s.seed + i * 11) * Math.PI * 2;
      if (typeof person.turnMs !== "number") person.turnMs = 1 + this.hash01(s.seed + i * 19) * 2;
      if (typeof person.actionMs !== "number") person.actionMs = 0.8 + this.hash01(s.seed + i * 47) * 2.1;
      if (typeof person.walkCycle !== "number") person.walkCycle = this.hash01(s.seed + i * 13) * Math.PI * 2;
      if (!person.inventory || typeof person.inventory !== "object") person.inventory = { wood: 2, stone: 3, metal: 1, tnt: 0 };
      if (!person.resources || typeof person.resources !== "object") person.resources = { amber: 0, crystal: 0, metal: 0, sulfur: 0, pearl: 0 };
      if (typeof person.role !== "string") person.role = "villager";
      if (typeof person.inventory.wood !== "number") person.inventory.wood = 0;
      if (typeof person.inventory.stone !== "number") person.inventory.stone = 0;
      if (typeof person.inventory.metal !== "number") person.inventory.metal = 0;
      if (typeof person.inventory.tnt !== "number") person.inventory.tnt = 0;
      if (typeof person.resources.amber !== "number") person.resources.amber = 0;
      if (typeof person.resources.crystal !== "number") person.resources.crystal = 0;
      if (typeof person.resources.metal !== "number") person.resources.metal = 0;
      if (typeof person.resources.sulfur !== "number") person.resources.sulfur = 0;
      if (typeof person.resources.pearl !== "number") person.resources.pearl = 0;
    });
    if (s.personSerial < s.people.length) s.personSerial = s.people.length;
    if (!Array.isArray(s.animals)) s.animals = [];
    s.animals.forEach((animal, i) => {
      if (!animal || typeof animal !== "object") return;
      if (typeof animal.id !== "string" || !animal.id) animal.id = `a-${s.seed}-${i}`;
      const species = this.getAnimalSpeciesDefinition(animal.species, animal.habitat);
      if (typeof animal.habitat !== "string") animal.habitat = species.habitat;
      if (typeof animal.species !== "string" || !animal.species) animal.species = species.id;
      if (typeof animal.label !== "string" || !animal.label) animal.label = species.label;
      if (typeof animal.shape !== "string" || !animal.shape) animal.shape = species.shape;
      if (!animal.palette || typeof animal.palette !== "object") animal.palette = { ...species.palette };
      if (typeof animal.scale !== "number") animal.scale = species.scale;
      if (typeof animal.speed !== "number") animal.speed = species.speed;
      if (typeof animal.depthBias !== "number") animal.depthBias = species.depthBias;
      if (typeof animal.x !== "number") animal.x = s.player.x;
      if (typeof animal.y !== "number") animal.y = s.player.y;
      if (typeof animal.z !== "number") animal.z = animal.habitat === "ocean"
        ? Math.max(this.getTopSolidZ(Math.floor(animal.x), Math.floor(animal.y)) + 0.8, this.getWaterTopZ(Math.floor(animal.x), Math.floor(animal.y)) - animal.depthBias)
        : this.getTopSolidZ(Math.floor(animal.x), Math.floor(animal.y)) + 1;
      if (typeof animal.dir !== "number") animal.dir = this.hash01(s.seed + i * 59) * Math.PI * 2;
      if (typeof animal.turnMs !== "number") animal.turnMs = 0.6 + this.hash01(s.seed + i * 41) * 2.2;
      if (typeof animal.walkCycle !== "number") animal.walkCycle = this.hash01(s.seed + i * 31) * Math.PI * 2;
      if (typeof animal.bobPhase !== "number") animal.bobPhase = this.hash01(s.seed + i * 23) * Math.PI * 2;
    });
    if (s.animalSerial < s.animals.length) s.animalSerial = s.animals.length;
    if (!Array.isArray(s.zombies)) s.zombies = [];
    s.zombies.forEach((zombie, i) => {
      if (!zombie || typeof zombie !== "object") return;
      if (typeof zombie.id !== "string" || !zombie.id) zombie.id = `z-${s.seed}-${i}`;
      if (typeof zombie.dir !== "number") zombie.dir = this.hash01(s.seed + i * 71) * Math.PI * 2;
      if (typeof zombie.turnMs !== "number") zombie.turnMs = 0.8 + this.hash01(s.seed + i * 53) * 1.6;
      if (typeof zombie.walkCycle !== "number") zombie.walkCycle = this.hash01(s.seed + i * 31) * Math.PI * 2;
      if (typeof zombie.z !== "number") zombie.z = this.getTopSolidZ(Math.floor(zombie.x || 0), Math.floor(zombie.y || 0)) + 1;
    });
    if (s.zombieSerial < s.zombies.length) s.zombieSerial = s.zombies.length;
    if (!Array.isArray(s.explosions)) s.explosions = [];
    if (typeof s.animalSpawnMs !== "number") s.animalSpawnMs = 2000;
    if (typeof s.zombieSpawnMs !== "number") s.zombieSpawnMs = 5000;
    if (typeof s.importTimerMs !== "number") s.importTimerMs = 60000;
    if (!s.weather || typeof s.weather !== "object") s.weather = this.createWeatherState(s.seed);
    if (typeof s.weather.type !== "string") s.weather.type = "clear";
    if (typeof s.weather.timerMs !== "number") s.weather.timerMs = 60000;
    if (typeof s.worldName !== "string" || !s.worldName) s.worldName = `${this.getWorldProfile(s.seed).name}-${(s.seed % 9000) + 1000}`;
    if (!s.worldSpawn || typeof s.worldSpawn !== "object") {
      s.worldSpawn = { x: s.player.x, y: s.player.y, z: s.player.z, biome: this.biomeAt(Math.floor(s.player.x), Math.floor(s.player.y)) };
    }
    if (!Array.isArray(s.recentSpawns)) s.recentSpawns = [];
    if (typeof s.worldSpawn.x !== "number") s.worldSpawn.x = s.player.x;
    if (typeof s.worldSpawn.y !== "number") s.worldSpawn.y = s.player.y;
    if (typeof s.worldSpawn.z !== "number") s.worldSpawn.z = s.player.z;
    if (typeof s.worldSpawn.biome !== "string") s.worldSpawn.biome = this.biomeAt(Math.floor(s.worldSpawn.x), Math.floor(s.worldSpawn.y));
    if (typeof s.inventoryOpen !== "boolean") s.inventoryOpen = true;
    this.repairSpawnStateIfNeeded();
    if (!s.animals.length) this.seedWorldAnimals();
    this.ensureMerchants();
  }

  init() {
    this.resizeCanvas();
    this.bindEvents();
    this.refreshEntityHeights();
    this.resetCameraPoint();
    this.buildInventoryButtons();
    this.syncUi();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  bindEvents() {
    const pressUi = (el, handler) => {
      if (!el) return;
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler();
      });
    };

    window.addEventListener("resize", () => this.resizeCanvas());

    window.addEventListener("keydown", (e) => {
      const k = this.normalizeKey(e);
      this.keys[k] = true;
      if (k === "space") {
        e.preventDefault();
        this.jumpQueued = true;
      }
      if (!e.repeat && k === "c") {
        e.preventDefault();
        this.destroyTargetBlock();
      }
      if (!e.repeat && k === "e") {
        this.state.inventoryOpen = !this.state.inventoryOpen;
        this.syncUi();
      }
      if (!e.repeat && k === "n") {
        e.preventDefault();
        this.cycleNearbyMerchantOffer();
      }
      if (!e.repeat && k === "b") {
        e.preventDefault();
        this.buyNearbyMerchantOffer();
      }
      if (!e.repeat && k >= "1" && k <= "6") {
        const map = ["wood", "stone", "metal", "tnt", "fire", "destroy"];
        this.state.selectedBlock = map[Number(k) - 1];
        this.syncUi();
      }
    });

    window.addEventListener("keyup", (e) => {
      const k = this.normalizeKey(e);
      this.keys[k] = false;
      if (k === "space") e.preventDefault();
    });

    this.canvas.addEventListener("click", () => {
      this.canvas.requestPointerLock?.();
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement === this.canvas) {
        this.state.player.facing += e.movementX * 0.0028;
        this.state.player.pitch = Math.max(-1.15, Math.min(1.0, this.state.player.pitch - e.movementY * 0.0022));
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    this.canvas.addEventListener("mousedown", (e) => {
      e.preventDefault();
      if (e.button === 0) this.placeOrUseSelected();
      if (e.button === 2) this.destroyTargetBlock();
    });

    pressUi(this.ui.inventoryToggleBtn, () => {
      this.state.inventoryOpen = !this.state.inventoryOpen;
      this.syncUi();
    });
    pressUi(this.ui.convertImportedBtn, () => this.convertImportedToBlocks());

    pressUi(this.ui.fullscreenBtn, () => {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.();
    });

    pressUi(this.ui.resetWorldBtn, () => {
      this.startNewWorld(1);
    });

    this.ui.inventoryItems?.addEventListener("pointerdown", (e) => {
      const btn = e.target?.closest?.("[data-block]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const next = String(btn.getAttribute("data-block") || "wood");
      if (!BLOCK_LABELS[next]) return;
      this.state.selectedBlock = next;
      this.syncUi();
    });

    this.ui.blockSelect?.addEventListener("change", (e) => {
      const next = String(e.target?.value || "wood");
      if (!BLOCK_LABELS[next]) return;
      this.state.selectedBlock = next;
      this.syncUi();
    });

    window.addEventListener("blur", () => {
      this.keys = {};
    });
  }

  normalizeKey(e) {
    const raw = String(e?.key || "").toLowerCase();
    if (e?.code === "Space" || raw === " ") return "space";
    if (e?.code === "ShiftLeft" || e?.code === "ShiftRight" || raw === "shift") return "shift";
    if (e?.code === "ControlLeft" || e?.code === "ControlRight" || raw === "control" || raw === "ctrl") return "control";
    return raw;
  }

  buildInventoryButtons() {
    if (!this.ui.inventoryItems) return;
    const order = ["wood", "stone", "metal", "tnt", "fire", "destroy"];
    if (!Object.keys(this.inventoryButtonMap).length) {
      const frag = document.createDocumentFragment();
      order.forEach((type) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "inventory-item";
        btn.setAttribute("data-block", type);
        this.inventoryButtonMap[type] = btn;
        frag.appendChild(btn);
      });
      this.ui.inventoryItems.replaceChildren(frag);
    }

    order.forEach((type) => {
      const btn = this.inventoryButtonMap[type];
      if (!btn) return;
      const amt = type === "fire" ? "inf" : (type === "destroy" ? "tool" : Math.floor(this.state.inventory[type] || 0));
      btn.classList.toggle("active", this.state.selectedBlock === type);
      btn.innerHTML = `${BLOCK_LABELS[type]}<br><small>${amt}</small>`;
    });

    if (this.ui.blockSelect) {
      if (!this.ui.blockSelect.options.length) {
        this.ui.blockSelect.innerHTML = order.map((type) => `<option value="${type}">${BLOCK_LABELS[type]}</option>`).join("");
      }
      this.ui.blockSelect.value = this.state.selectedBlock;
    }
  }

  syncUi() {
    const profile = this.getWorldProfile(this.state.seed);
    const worldResource = this.getProfileResourceLabel(profile);
    const nearbyMerchant = this.getNearbyMerchant();
    const nearbyOffer = nearbyMerchant ? this.getMerchantOffer(nearbyMerchant) : null;
    if (this.ui.worldText) this.ui.worldText.textContent = `World ${this.state.worldIndex} (${this.state.worldName})`;
    if (this.ui.peopleText) this.ui.peopleText.textContent = `People: ${this.state.people.length}/${PEOPLE_PER_WORLD}`;
    if (this.ui.zombieText) this.ui.zombieText.textContent = `Zombies: ${this.state.zombies.length}  Animals: ${this.state.animals.length}`;
    if (this.ui.selectedText) this.ui.selectedText.textContent = `Selected: ${BLOCK_LABELS[this.state.selectedBlock] || "Wood"}`;

    if (this.ui.inventoryPanel) {
      this.ui.inventoryPanel.classList.toggle("hidden", !this.state.inventoryOpen);
    }

    this.buildInventoryButtons();

    if (this.ui.inventoryStats) {
      const p = this.state.player;
      this.ui.inventoryStats.innerHTML = [
        `Wood: ${Math.floor(this.state.inventory.wood)}`,
        `Stone: ${Math.floor(this.state.inventory.stone)}`,
        `Metal: ${Math.floor(this.state.inventory.metal)}`,
        `TNT: ${Math.floor(this.state.inventory.tnt)}`,
        `Imported Wood: ${Math.floor(this.state.imported.wood)}`,
        `Imported Stone: ${Math.floor(this.state.imported.stone)}`,
        `Imported Metal: ${Math.floor(this.state.imported.metal)}`,
        `Imported TNT: ${Math.floor(this.state.imported.tnt)}`,
        `Weather: ${this.getWeatherLabel()} | Next import: ${Math.max(1, Math.ceil(this.state.importTimerMs / 1000))}s`,
        `${worldResource}: ${Math.floor(this.state.resources[this.getProfileResourceKey(profile)] || 0)}`,
        `Amber: ${Math.floor(this.state.resources.amber)} | Crystal: ${Math.floor(this.state.resources.crystal)} | Metal: ${Math.floor(this.state.resources.metal)} | Sulfur: ${Math.floor(this.state.resources.sulfur)} | Pearls: ${Math.floor(this.state.resources.pearl)}`,
        `Fire: Infinite`,
        `Health: ${Math.max(0, Math.floor(p.hp))}/10`,
        `Wildlife: ${this.state.animals.length}`,
        nearbyMerchant && nearbyOffer
          ? `Nearby Stall: ${nearbyMerchant.name} | Open | ${this.describeShopOffer(nearbyOffer)}`
          : `Nearby Stall: walk up to an awning-covered villager to trade.`,
        `Terrain: flat plains, terraced mountains, trees, and waterfalls.`,
        `Tip: click the world to lock mouse look. Q/E turn and R/F tilt when mouse is unlocked.`,
        `Tip: choose Destroy Tool in inventory if you want left click to dig instead of place.`,
        `Tip: Space jumps on land, Shift sprints, and hold Space/Ctrl to move up or down while swimming.`,
        `Tip: press N near a stall to cycle offers and B to buy the highlighted trade.`,
        `Tip: shops open immediately and the blue pad around each stall is its private zone.`,
        `Tip: stack 3 metal blocks and ignite to open a portal into a different biome.`
      ].join("<br>");
    }
  }

  convertImportedToBlocks() {
    const imp = this.state.imported;
    const moved = (imp.wood || 0) + (imp.stone || 0) + (imp.metal || 0) + (imp.tnt || 0);
    if (moved <= 0) {
      this.say("No imported materials to convert.");
      return;
    }
    this.state.inventory.wood += imp.wood || 0;
    this.state.inventory.stone += imp.stone || 0;
    this.state.inventory.metal += imp.metal || 0;
    this.state.inventory.tnt += imp.tnt || 0;
    imp.wood = 0;
    imp.stone = 0;
    imp.metal = 0;
    imp.tnt = 0;
    this.say("Imported materials converted into blocks.");
    this.syncUi();
  }

  resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  loop(ts) {
    if (!this.lastTs) this.lastTs = ts;
    const dt = Math.min(48, ts - this.lastTs);
    this.lastTs = ts;
    try {
      this.update(dt);
      this.render();
    } catch (err) {
      this.renderFatal(err);
      return;
    }
    requestAnimationFrame((next) => this.loop(next));
  }

  update(dt) {
    const dtS = dt / 1000;
    this.ambientMs += dt;

    this.ensurePopulation();
    this.updatePlayer(dtS);
    this.updateCameraPoint(dtS);
    this.updatePeople(dtS);
    this.updateAnimals(dtS, dt);
    this.updateZombies(dtS, dt);
    this.ensurePopulation();
    this.updateBurning(dt);
    this.updateExplosions(dt);
    this.updateWeather(dt);
    this.updateImports(dt);

    this.checkPortalTravel();
    this.checkEntityTnt();
    this.handlePlayerDefeat();
    this.state.player.hp = this.clamp(this.state.player.hp, 10, 0, 10);

    this.messageMs = Math.max(0, this.messageMs - dt);
    this.syncUi();
    this.save();
  }

  damagePlayer(amount, cause = "") {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.state.player.hp -= amount;
    if (cause) this.lastDamageCause = cause;
  }

  handlePlayerDefeat() {
    if ((this.state.player?.hp || 0) > 0) return false;

    const spawn = this.findFreshSpawn({
      seed: this.state.seed,
      salt: (this.state.portalTravelCount || 0) + (this.getRecentSpawnList(this.state.seed).length || 0) + 9,
      preferredBiome: this.state.worldSpawn?.biome || "",
      anchorX: this.state.worldSpawn?.x,
      anchorY: this.state.worldSpawn?.y,
      minRadius: 12,
      maxRadius: 96
    }) || this.state.worldSpawn || this.findFreshSpawn({ seed: this.state.seed, salt: 19, minRadius: 12 });
    this.state.player.hp = 10;
    this.state.player.x = spawn.x;
    this.state.player.y = spawn.y;
    this.state.player.z = this.getTopSolidZ(Math.floor(spawn.x), Math.floor(spawn.y)) + 1;
    this.state.player.velX = 0;
    this.state.player.velY = 0;
    this.state.player.velZ = 0;
    this.state.player.flyMode = false;
    this.jumpQueued = false;
    this.resetCameraPoint();
    this.state.worldSpawn = {
      x: spawn.x,
      y: spawn.y,
      z: this.state.player.z,
      biome: spawn.biome || this.biomeAt(Math.floor(spawn.x), Math.floor(spawn.y))
    };
    this.rememberSpawnPoint(spawn, this.state.seed);

    if (this.lastDamageCause === "zombie") this.say("A zombie knocked you out. You respawned.");
    else if (this.lastDamageCause === "blast") this.say("A blast knocked you out. You respawned.");
    else this.say("You blacked out and respawned.");

    this.lastDamageCause = "";
    return true;
  }

  updateWeather(dt) {
    this.state.weather.timerMs -= dt;
    if (this.state.weather.timerMs > 0) return;
    const prev = this.state.weather.type;
    this.state.weather = this.createWeatherState(this.state.seed + Math.floor(this.ambientMs / 1000));
    if (this.state.weather.type !== prev) {
      this.say(`Weather changed: ${this.getWeatherLabel(this.state.weather.type)}.`);
    }
  }

  updateImports(dt) {
    this.state.importTimerMs -= dt;
    if (this.state.importTimerMs > 0) return;

    while (this.state.importTimerMs <= 0) {
      this.state.importTimerMs += 60000;
      const profile = this.getWorldProfile(this.state.seed);
      const workers = Math.max(1, Math.floor(this.state.people.length / 8));
      this.state.imported.wood += workers;
      this.state.imported.stone += 1 + workers + (profile.mountainBias > 0.2 ? 1 : 0);
      this.state.imported.metal += profile.ore === "metal_ore" ? 2 : 1;
      if (this.state.worldIndex >= 2 && this.hash01(this.state.seed + this.ambientMs * 0.001) > 0.76) {
        this.state.imported.tnt += 1;
      }
    }

    this.say("New imports arrived.");
  }

  updatePlayer(dtS) {
    const p = this.state.player;
    p.flyMode = false;
    const inWater = this.isPlayerInWater();
    const sprinting = Boolean(this.keys["shift"] && !inWater);
    const speed = inWater ? PLAYER_SWIM_SPEED : (sprinting ? PLAYER_SPRINT_SPEED : PLAYER_RUN_SPEED);
    const currentGround = this.getTopSolidZ(Math.floor(p.x), Math.floor(p.y)) + 1;
    const onGroundNow = !inWater && p.z <= currentGround + GROUND_CONTACT_EPS;
    if (onGroundNow) {
      p.z = currentGround;
      if (p.velZ < 0) p.velZ = 0;
    }
    if (this.keys["q"]) p.facing -= 1.8 * dtS;
    if (this.keys["e"]) p.facing += 1.8 * dtS;
    if (this.keys["r"]) p.pitch = Math.min(1.0, p.pitch + 1.3 * dtS);
    if (this.keys["f"]) p.pitch = Math.max(-1.15, p.pitch - 1.3 * dtS);
    const f = { x: Math.cos(p.facing), y: Math.sin(p.facing) };
    const r = { x: -f.y, y: f.x };

    let mx = 0;
    let my = 0;
    if (this.keys["w"] || this.keys["arrowup"]) {
      mx += f.x;
      my += f.y;
    }
    if (this.keys["s"] || this.keys["arrowdown"]) {
      mx -= f.x;
      my -= f.y;
    }
    if (this.keys["a"] || this.keys["arrowleft"]) {
      mx -= r.x;
      my -= r.y;
    }
    if (this.keys["d"] || this.keys["arrowright"]) {
      mx += r.x;
      my += r.y;
    }

    const len = Math.hypot(mx, my);
    const inputX = len > 0 ? (mx / len) : 0;
    const inputY = len > 0 ? (my / len) : 0;
    if (onGroundNow && !inWater) {
      const drag = Math.exp(-PLAYER_GROUND_DRAG * dtS);
      p.velX *= drag;
      p.velY *= drag;
      if (len > 0) {
        p.velX += inputX * PLAYER_GROUND_ACCEL * dtS;
        p.velY += inputY * PLAYER_GROUND_ACCEL * dtS;
      }
    } else if (inWater) {
      const drag = Math.exp(-PLAYER_SWIM_DRAG * dtS);
      p.velX *= drag;
      p.velY *= drag;
      if (len > 0) {
        p.velX += inputX * PLAYER_SWIM_ACCEL * dtS;
        p.velY += inputY * PLAYER_SWIM_ACCEL * dtS;
      }
    } else {
      const drag = Math.exp(-PLAYER_AIR_DRAG * dtS);
      p.velX *= drag;
      p.velY *= drag;
      if (len > 0) {
        p.velX += inputX * PLAYER_AIR_ACCEL * dtS;
        p.velY += inputY * PLAYER_AIR_ACCEL * dtS;
      }
    }
    const maxHorizontalSpeed = onGroundNow && !inWater
      ? speed
      : (inWater ? speed : speed * 1.08);
    const horizontalSpeed = Math.hypot(p.velX, p.velY);
    if (horizontalSpeed > maxHorizontalSpeed) {
      const scale = maxHorizontalSpeed / horizontalSpeed;
      p.velX *= scale;
      p.velY *= scale;
    }
    if (Math.abs(p.velX) < 0.01) p.velX = 0;
    if (Math.abs(p.velY) < 0.01) p.velY = 0;
    const moveResult = this.tryMovePlayer(p.velX * dtS, p.velY * dtS);
    if (!moveResult.movedX) p.velX = 0;
    if (!moveResult.movedY) p.velY = 0;

    const gx = Math.floor(p.x);
    const gy = Math.floor(p.y);
    const ground = this.getTopSolidZ(gx, gy) + 1;
    const waterTop = this.getWaterTopZ(gx, gy) + 0.92;
    const risePressed = this.keys["space"];
    const divePressed = this.keys["control"];

    if (inWater) {
      const swimLift = risePressed ? 17.5 : 0;
      const swimDive = divePressed ? 14 : 0;
      p.velZ += (swimLift - swimDive - 0.55) * dtS;
      p.velZ *= 0.972;
      p.z += p.velZ * dtS;
      if (p.z < ground) {
        p.z = ground;
        p.velZ = 0;
      }
      if (p.z > waterTop + 0.55 && !risePressed) {
        p.z = waterTop + 0.55;
        p.velZ = Math.min(0, p.velZ);
      }
    } else {
      const onGround = p.z <= ground + GROUND_CONTACT_EPS;
      if (onGround) {
        p.z = ground;
        if (p.velZ < 0) p.velZ = 0;
      }
      if (onGround && this.jumpQueued) {
        p.velZ = PLAYER_JUMP_SPEED;
        this.jumpQueued = false;
      }
      if (!risePressed && p.velZ > 0) {
        p.velZ -= 16 * dtS;
      }
      p.velZ -= 34 * dtS;
      p.velZ = Math.max(-28, Math.min(18, p.velZ));
      p.z += p.velZ * dtS;
      if (p.z < ground) {
        p.z = ground;
        p.velZ = 0;
      }
    }
    if (!this.keys["space"] && !inWater) this.jumpQueued = false;
  }

  tryMovePlayer(stepX, stepY) {
    const p = this.state.player;
    let movedX = false;
    let movedY = false;
    const tryAxis = (nx, ny) => {
      const gx = Math.floor(nx);
      const gy = Math.floor(ny);
      const nextGround = this.getTopSolidZ(gx, gy) + 1;
      if (nextGround - p.z > STEP_HEIGHT && !this.isPlayerInWater()) return false;
      if (this.isSolid(this.getBlock(gx, gy, Math.floor(nextGround + 1))) || this.isSolid(this.getBlock(gx, gy, Math.floor(nextGround + 2)))) return false;
      p.x = nx;
      p.y = ny;
      if (!this.isPlayerInWater() && nextGround > p.z) p.z = nextGround;
      return true;
    };
    if (tryAxis(p.x + stepX, p.y)) movedX = true;
    else stepX = 0;
    if (tryAxis(p.x, p.y + stepY)) movedY = true;
    return { movedX, movedY };
  }

  moveWalker(entity, stepX, stepY, stepHeight = STEP_HEIGHT) {
    const tryAxis = (nx, ny) => {
      const gx = Math.floor(nx);
      const gy = Math.floor(ny);
      const nextGround = this.getTopSolidZ(gx, gy) + 1;
      const feet = Math.max(nextGround, entity.z || nextGround);
      if (nextGround - (entity.z || nextGround) > stepHeight) return false;
      if (this.isSolid(this.getBlock(gx, gy, Math.floor(feet + 1))) || this.isSolid(this.getBlock(gx, gy, Math.floor(feet + 2)))) return false;
      entity.x = nx;
      entity.y = ny;
      entity.z = nextGround;
      return true;
    };
    if (!tryAxis(entity.x + stepX, entity.y)) stepX = 0;
    tryAxis(entity.x, entity.y + stepY);
  }

  updatePeople(dtS) {
    const seed = this.state.seed;
    this.ensurePopulation();
    this.ensureMerchants();
    this.state.people.forEach((person, i) => {
      const nearestZombie = this.findNearestZombie(person.x, person.y, 7);
      if (this.isMerchant(person)) {
        this.updateMerchantPerson(person, nearestZombie, dtS, seed, i);
        return;
      }
      person.turnMs -= dtS;
      let desiredDir = person.dir;
      if (person.turnMs <= 0) {
        const n = this.hash01(seed + i * 33 + Math.floor(this.ambientMs / 500));
        desiredDir = n * Math.PI * 2;
        person.turnMs = 1.2 + this.hash01(seed + i * 17 + Math.floor(this.ambientMs / 700)) * 2.8;
      }
      if (nearestZombie) {
        desiredDir = Math.atan2(person.y - nearestZombie.y, person.x - nearestZombie.x);
      }
      person.dir = this.angleStep(person.dir, desiredDir, dtS * (nearestZombie ? 4.2 : 2.8));

      const drift = nearestZombie ? 2.25 : 1.05;
      this.moveWalker(person, Math.cos(person.dir) * drift * dtS, Math.sin(person.dir) * drift * dtS, 1.05);
      person.walkCycle = (person.walkCycle || 0) + drift * dtS * 7.2;

      const dx = person.x - person.homeX;
      const dy = person.y - person.homeY;
      const dist = Math.hypot(dx, dy);
      if (dist > 7.5) {
        this.moveWalker(person, -(dx / dist) * 1.8 * dtS, -(dy / dist) * 1.8 * dtS, 1.05);
      }

      person.z = this.getTopSolidZ(Math.floor(person.x), Math.floor(person.y)) + 1;
      person.actionMs -= dtS;
      if (person.actionMs <= 0) {
        this.performPersonAction(person);
        person.actionMs = 0.8 + Math.random() * 2.2;
      }
    });
  }

  updateMerchantPerson(person, nearestZombie, dtS, seed, i) {
    const stall = person.stall || {
      x: person.homeX,
      y: person.homeY,
      z: this.getTopSolidZ(Math.floor(person.homeX), Math.floor(person.homeY)) + 1,
      clerkX: person.homeX,
      clerkY: person.homeY
    };
    person.turnMs -= dtS;
    if (person.turnMs <= 0) {
      person.turnMs = 0.8 + this.hash01(seed + i * 17 + Math.floor(this.ambientMs / 800)) * 1.6;
      person.dir = this.hash01(seed + i * 33 + Math.floor(this.ambientMs / 600)) * Math.PI * 2;
    }

    if (nearestZombie) {
      const fleeDir = Math.atan2(person.y - nearestZombie.y, person.x - nearestZombie.x);
      person.dir = this.angleStep(person.dir, fleeDir, dtS * 4.8);
      this.moveWalker(person, Math.cos(person.dir) * 2.6 * dtS, Math.sin(person.dir) * 2.6 * dtS, 1.05);
      person.walkCycle = (person.walkCycle || 0) + 2.6 * dtS * 7.4;
    } else {
      const blend = Math.min(1, dtS * 3.8);
      person.x += (stall.clerkX - person.x) * blend;
      person.y += (stall.clerkY - person.y) * blend;
      person.walkCycle = (person.walkCycle || 0) + Math.hypot(stall.clerkX - person.x, stall.clerkY - person.y) * dtS * 1.2;
      const playerDx = this.state.player.x - person.x;
      const playerDy = this.state.player.y - person.y;
      if (Math.hypot(playerDx, playerDy) < 6.5) {
        person.dir = Math.atan2(playerDy, playerDx);
      }
    }

    const dx = person.x - stall.x;
    const dy = person.y - stall.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 3.4) {
      person.x -= (dx / dist) * 2.2 * dtS;
      person.y -= (dy / dist) * 2.2 * dtS;
    }

    person.z = this.getTopSolidZ(Math.floor(person.x), Math.floor(person.y)) + 1;
    person.actionMs -= dtS;
    if (person.actionMs <= 0) {
      if (Math.hypot(this.state.player.x - person.x, this.state.player.y - person.y) > 7) {
        person.shop.cursor = (person.shop.cursor + 1) % Math.max(1, person.shop.offers.length);
      }
      person.actionMs = 5 + this.hash01(seed + i * 59 + Math.floor(this.ambientMs / 1400)) * 6;
    }
  }

  performPersonAction(person) {
    if (this.isMerchant(person)) return;
    const px = Math.floor(person.x);
    const py = Math.floor(person.y);
    if (Math.hypot(this.state.player.x - person.x, this.state.player.y - person.y) < 2.4) return;

    const actionRoll = Math.random();
    const digTarget = this.findPersonDigTarget(px, py);
    if (digTarget && actionRoll < 0.18) {
      const hit = digTarget;
      if (!hit) return;
      const terrain = this.terrainHeight(hit.x, hit.y);
      if (hit.z >= terrain) return;
      this.setBlock(hit.x, hit.y, hit.z, "air");
      delete this.state.burning[this.key(hit.x, hit.y, hit.z)];
      this.collectResourceForInventory(person.inventory, hit.type, person.resources);
      if (hit.z < terrain - 2 && Math.random() < 0.14) {
        this.spawnZombieAt(hit.x + (Math.random() - 0.5), hit.y + (Math.random() - 0.5));
      }
      return;
    }

    const buildType = this.pickPersonBuildBlock(person.inventory);
    if (!buildType) return;
    const tx = px + Math.floor(Math.random() * 3) - 1;
    const ty = py + Math.floor(Math.random() * 3) - 1;
    const placeZ = this.getTopSolidZ(tx, ty) + 1;
    if (placeZ > MAX_Z) return;
    if (this.isStallFootprintCell(tx, ty)) return;
    if (this.isCellOccupied(tx, ty, placeZ)) return;
    this.setBlock(tx, ty, placeZ, buildType);
    person.inventory[buildType] -= 1;

    if (buildType === "metal" && Math.random() < 0.08) {
      const low = placeZ - 2;
      if (
        this.getBlock(tx, ty, low) === "metal" &&
        this.getBlock(tx, ty, low + 1) === "metal" &&
        this.getBlock(tx, ty, low + 2) === "metal"
      ) {
        this.ignite(tx, ty, low + 1);
      }
    }
    if (buildType === "tnt" && Math.random() < 0.18) {
      this.ignite(tx, ty, placeZ);
    }
  }

  pickPersonBuildBlock(inv) {
    const choices = [];
    if ((inv.stone || 0) > 0) choices.push("stone", "stone");
    if ((inv.wood || 0) > 0) choices.push("wood", "wood");
    if ((inv.metal || 0) > 0) choices.push("metal");
    if ((inv.tnt || 0) > 0) choices.push("tnt");
    if (choices.length === 0) return "";
    return choices[Math.floor(Math.random() * choices.length)];
  }

  isOreBlock(type) {
    return type === "metal_ore" || type === "amber_ore" || type === "crystal_ore" || type === "sulfur_ore" || type === "pearl_ore";
  }

  findPersonDigTarget(cx, cy) {
    let best = null;
    let bestScore = -Infinity;
    for (let x = cx - 2; x <= cx + 2; x += 1) {
      for (let y = cy - 2; y <= cy + 2; y += 1) {
        if (this.isStallFootprintCell(x, y)) continue;
        const terrain = this.terrainHeight(x, y);
        for (let z = terrain - 1; z >= Math.max(MIN_Z + 1, terrain - 4); z -= 1) {
          const type = this.getBlock(x, y, z);
          if (!this.isSolid(type) || type === "bedrock" || type === "portal") continue;
          const dist = Math.hypot(x - cx, y - cy);
          const score = (this.isOreBlock(type) ? 100 : type === "stone" ? 24 : type === "dirt" ? 12 : 16) - dist * 6 - (terrain - z);
          if (score > bestScore) {
            bestScore = score;
            best = { x, y, z, type };
          }
        }
      }
    }
    return best;
  }

  findTopDiggableAt(x, y) {
    for (let z = MAX_Z; z >= MIN_Z; z -= 1) {
      const t = this.getBlock(x, y, z);
      if (!this.isSolid(t)) continue;
      if (t === "bedrock" || t === "portal") return null;
      return { x, y, z, type: t };
    }
    return null;
  }

  collectResourceForInventory(inv, type, resourceBag = null) {
    if (type === "wood" || type === "leaves") inv.wood += 1;
    else if (type === "stone" || type === "dirt" || type === "grass") inv.stone += 1;
    else if (type === "metal") inv.metal += 1;
    else if (type === "metal_ore") {
      inv.metal += 1;
      if (resourceBag) resourceBag.metal += 1;
    }
    else if (type === "tnt") inv.tnt += 1;
    else if (type === "amber_ore") {
      inv.stone += 1;
      if (resourceBag) resourceBag.amber += 1;
    } else if (type === "crystal_ore") {
      inv.stone += 1;
      if (resourceBag) resourceBag.crystal += 1;
    } else if (type === "sulfur_ore") {
      inv.stone += 1;
      if (resourceBag) resourceBag.sulfur += 1;
    } else if (type === "pearl_ore") {
      inv.stone += 1;
      if (resourceBag) resourceBag.pearl += 1;
    }
  }

  isInPrivateZone(x, y) {
    const cx = x + 0.5;
    const cy = y + 0.5;
    return this.state.people.some((person) => {
      if (!this.isMerchant(person)) return false;
      const radius = person.stall?.privateZoneRadius || 1.4;
      return Math.hypot(cx - person.stall.x, cy - person.stall.y) <= radius;
    });
  }

  isStallFootprintCell(x, y) {
    return this.isInPrivateZone(x, y);
  }

  isCellOccupied(x, y, z) {
    const near = (e) => Math.abs(Math.floor(e.x) - x) < 1 && Math.abs(Math.floor(e.y) - y) < 1 && Math.abs((e.z || 0) - z) < 1.2;
    if (near(this.state.player)) return true;
    if (this.state.people.some((p) => near(p))) return true;
    if (this.state.animals.some((a) => near(a))) return true;
    if (this.state.zombies.some((q) => near(q))) return true;
    if (this.isInPrivateZone(x, y) && this.state.people.some((person) => this.isMerchant(person) && z <= person.stall.z + 2.1)) return true;
    return false;
  }

  updateZombies(dtS, dt) {
    const p = this.state.player;
    const alive = [];
    const profile = this.getWorldProfile(this.state.seed);

    for (const z of this.state.zombies) {
      const target = this.findNearestPersonOrPlayer(z.x, z.y, 18);
      if (target) {
        const dx = target.x - z.x;
        const dy = target.y - z.y;
        z.dir = this.angleStep(z.dir || 0, Math.atan2(dy, dx), dtS * 2.3);
        const speed = 1.35;
        this.moveWalker(z, Math.cos(z.dir) * speed * dtS, Math.sin(z.dir) * speed * dtS, 0.9);
        z.walkCycle = (z.walkCycle || 0) + speed * dtS * 4.8;
      } else {
        z.turnMs -= dtS;
        if (z.turnMs <= 0) {
          z.turnMs = 0.9 + this.hash01(this.state.seed + z.x * 7 + z.y * 13 + this.ambientMs * 0.001) * 1.8;
          const drift = (this.hash01(this.state.seed + z.x * 37 + z.y * 19 + this.ambientMs * 0.002) - 0.5) * 1.2;
          z.dir += drift;
        }
        const shamble = 0.72;
        this.moveWalker(z, Math.cos(z.dir || 0) * shamble * dtS, Math.sin(z.dir || 0) * shamble * dtS, 0.8);
        z.walkCycle = (z.walkCycle || 0) + shamble * dtS * 4.1;
      }

      z.z = this.getTopSolidZ(Math.floor(z.x), Math.floor(z.y)) + 1;
      z.lifeMs -= dt;
      if (z.lifeMs <= 0) continue;

      if (Math.hypot(z.x - p.x, z.y - p.y) < 0.9) {
        this.damagePlayer(2.2 * dtS, "zombie");
      }

      for (let i = this.state.people.length - 1; i >= 0; i -= 1) {
        const person = this.state.people[i];
        if (Math.hypot(z.x - person.x, z.y - person.y) < 0.85) {
          this.state.people.splice(i, 1);
          this.say(`${person.name} was taken by a zombie.`);
        }
      }

      alive.push(z);
    }

    this.state.zombies = alive;
    this.state.zombieSpawnMs -= dt;
    const targetCount = Math.max(8, Math.floor(8 + this.state.worldIndex * 1.5 * profile.zombieScale));
    if (this.state.zombieSpawnMs <= 0 && this.state.zombies.length < targetCount) {
      if (this.hash01(this.state.seed + this.ambientMs * 0.0023) > 0.45) {
        this.spawnZombieInWorld(Math.floor(this.ambientMs / 1000));
      } else {
        const distance = 10 + this.hash01(this.state.seed + this.ambientMs * 0.002) * 8;
        this.spawnZombieNearPlayer(distance);
      }
      this.state.zombieSpawnMs = Math.max(5000, 15000 / Math.max(0.7, profile.zombieScale)) + Math.floor(Math.random() * 7000);
    }
  }

  updateBurning(dt) {
    const updated = {};
    const entries = Object.entries(this.state.burning);

    for (const [key, burn] of entries) {
      const next = { ...burn, ms: burn.ms - dt, spreadMs: burn.spreadMs - dt };
      const { x, y, z } = this.parseKey(key);
      const type = this.getBlock(x, y, z);

      if (type === "tnt") {
        this.explode(x, y, z, 3.4, true);
        continue;
      }

      if (next.spreadMs <= 0) {
        next.spreadMs = 800;
        this.spreadFire(x, y, z);
      }

      if (next.ms <= 0) {
        if (type === "wood" || type === "leaves" || type === "grass") {
          this.setBlock(x, y, z, "air");
        }
        continue;
      }

      updated[key] = next;
    }

    this.state.burning = updated;
  }

  updateExplosions(dt) {
    this.state.explosions = this.state.explosions
      .map((fx) => ({ ...fx, ms: fx.ms - dt }))
      .filter((fx) => fx.ms > 0);
  }

  spreadFire(x, y, z) {
    const neighbors = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1]
    ];

    for (const [dx, dy, dz] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;
      const t = this.getBlock(nx, ny, nz);
      if (t === "wood" || t === "leaves" || t === "tnt") {
        if (Math.random() < 0.36) this.ignite(nx, ny, nz);
      }
    }
  }

  hasPlacementSupport(x, y, z) {
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, -1], [0, 0, 1]]) {
      const neighbor = this.getBlock(x + dx, y + dy, z + dz);
      if (this.isSolid(neighbor)) return true;
    }
    return false;
  }

  doesBlockOverlapPlayer(x, y, z) {
    const p = this.state.player;
    const playerMinX = p.x - 0.28;
    const playerMaxX = p.x + 0.28;
    const playerMinY = p.y - 0.28;
    const playerMaxY = p.y + 0.28;
    const playerMinZ = p.z;
    const playerMaxZ = p.z + 1.72;
    return (
      playerMinX < x + 1 &&
      playerMaxX > x &&
      playerMinY < y + 1 &&
      playerMaxY > y &&
      playerMinZ < z + 1 &&
      playerMaxZ > z
    );
  }

  placeOrUseSelected() {
    const sel = this.state.selectedBlock;
    const hit = this.raycastTarget();
    if (!hit) return;

    if (sel === "destroy") {
      this.destroyTargetBlock();
      return;
    }

    if (sel === "fire") {
      this.ignite(hit.x, hit.y, hit.z);
      this.tryCreatePortal(hit.x, hit.y, hit.z);
      return;
    }

    if ((this.state.inventory[sel] || 0) <= 0) {
      this.say(`No ${sel} left in inventory.`);
      return;
    }

    const place = hit.place;
    if (!place) return;
    if (!hit.type || !this.isRenderable(hit.type)) return;
    if (place.z > MAX_Z || place.z <= MIN_Z) return;
    if (this.doesBlockOverlapPlayer(place.x, place.y, place.z)) return;
    if (this.isSolid(this.getBlock(place.x, place.y, place.z))) return;
    if (!this.hasPlacementSupport(place.x, place.y, place.z)) {
      this.say("Blocks need support. You cannot place them floating in air.");
      return;
    }

    this.setBlock(place.x, place.y, place.z, sel);
    this.state.inventory[sel] -= 1;

    if (sel === "tnt") this.say("TNT placed. It explodes on touch or fire.");
  }

  destroyTargetBlock() {
    const hit = this.raycastTarget();
    if (!hit) return;

    if (hit.type === "bedrock") return;

    if (hit.type === "portal") {
      this.say("Portal removed.");
      this.setBlock(hit.x, hit.y, hit.z, "air");
      return;
    }

    this.setBlock(hit.x, hit.y, hit.z, "air");
    delete this.state.burning[this.key(hit.x, hit.y, hit.z)];
    this.collectResource(hit.type);

    const terrain = this.terrainHeight(hit.x, hit.y);
    if (hit.z < terrain - 2 && Math.random() < 0.18) {
      this.spawnZombieAt(hit.x + (Math.random() - 0.5), hit.y + (Math.random() - 0.5));
      this.say("A zombie crawled out of the hole.");
    }

    if (hit.type === "tnt") this.explode(hit.x, hit.y, hit.z, 3.2, true);
  }

  collectResource(type) {
    this.collectResourceForInventory(this.state.imported, type, this.state.resources);
  }

  ignite(x, y, z) {
    const type = this.getBlock(x, y, z);
    if (!this.isSolid(type)) return;

    if (type === "tnt") {
      this.explode(x, y, z, 3.8, true);
      return;
    }

    this.state.burning[this.key(x, y, z)] = { ms: 5600, spreadMs: 700 };

    if (this.tryCreatePortal(x, y, z)) {
      this.say("Portal opened. Step into it.");
    }
  }

  tryCreatePortal(x, y, z) {
    for (let base = z - 2; base <= z; base += 1) {
      if (
        this.getBlock(x, y, base) === "metal" &&
        this.getBlock(x, y, base + 1) === "metal" &&
        this.getBlock(x, y, base + 2) === "metal"
      ) {
        this.setBlock(x, y, base, "portal");
        this.setBlock(x, y, base + 1, "portal");
        this.setBlock(x, y, base + 2, "portal");
        delete this.state.burning[this.key(x, y, base)];
        delete this.state.burning[this.key(x, y, base + 1)];
        delete this.state.burning[this.key(x, y, base + 2)];
        return true;
      }
    }
    return false;
  }

  findTouchedPortal() {
    const p = this.state.player;
    const minX = p.x - 0.34;
    const maxX = p.x + 0.34;
    const minY = p.y - 0.34;
    const maxY = p.y + 0.34;
    const minZ = p.z + 0.02;
    const maxZ = p.z + 1.76;

    for (let x = Math.floor(minX); x <= Math.floor(maxX); x += 1) {
      for (let y = Math.floor(minY); y <= Math.floor(maxY); y += 1) {
        for (let z = Math.floor(minZ); z <= Math.floor(maxZ); z += 1) {
          if (this.getBlock(x, y, z) !== "portal") continue;
          return { x, y, z };
        }
      }
    }
    return null;
  }

  checkPortalTravel() {
    const touchedPortal = this.findTouchedPortal();
    if (touchedPortal) {
      const entryBiome = this.biomeAt(touchedPortal.x, touchedPortal.y, this.terrainHeight(touchedPortal.x, touchedPortal.y));
      this.startNewWorld(this.state.worldIndex + 1, entryBiome);
    }
  }

  startNewWorld(index, entryBiome = "") {
    const prevInventory = { ...this.state.inventory };
    const prevResources = { ...this.state.resources };
    const portalTravelCount = (this.state.portalTravelCount || 0) + 1;
    const newSeed = Math.floor(Math.random() * 9999999) + index * 173;
    const profile = this.getWorldProfile(newSeed);

    this.state.worldIndex = index;
    this.state.seed = newSeed;
    this.state.worldName = `${profile.name}-${(newSeed % 9000) + 1000}`;
    this.state.worldMods = {};
    this.state.burning = {};
    this.state.animals = [];
    this.state.animalSerial = 0;
    this.state.animalSpawnMs = 2000;
    this.state.zombies = [];
    this.state.zombieSpawnMs = 5000;
    this.state.importTimerMs = 60000;
    this.state.weather = this.createWeatherState(newSeed);
    this.state.inventory = prevInventory;
    this.state.resources = prevResources;
    this.state.selectedBlock = this.state.selectedBlock || "wood";
    this.state.portalTravelCount = portalTravelCount;

    const candidateBiomes = ["grass", "sand", "snow"]
      .sort((a, b) => {
        const sa = (a !== entryBiome ? 10 : 0) + this.hash01(newSeed * 0.23 + portalTravelCount * 17 + a.length * 11);
        const sb = (b !== entryBiome ? 10 : 0) + this.hash01(newSeed * 0.23 + portalTravelCount * 17 + b.length * 11);
        return sb - sa;
      });
    let spawn = null;
    for (const biome of candidateBiomes) {
      spawn = this.findFreshSpawn({
        seed: newSeed,
        salt: portalTravelCount + biome.length,
        preferredBiome: biome,
        minRadius: 18 + Math.floor(this.hash01(newSeed * 0.61 + portalTravelCount * 29) * 44)
      });
      if (spawn && (!entryBiome || spawn.biome !== entryBiome)) break;
    }
    if (!spawn || (entryBiome && spawn.biome === entryBiome)) {
      spawn = this.findFreshSpawn({
        seed: newSeed,
        salt: portalTravelCount + 23,
        avoidBiome: entryBiome,
        minRadius: 18 + Math.floor(this.hash01(newSeed * 0.61 + portalTravelCount * 29) * 44)
      });
    }
    if (!spawn) spawn = this.findFreshSpawn({ seed: newSeed, salt: portalTravelCount + 31 });

    this.state.player.x = spawn.x;
    this.state.player.y = spawn.y;
    this.state.player.z = this.getTopSolidZ(Math.floor(spawn.x), Math.floor(spawn.y)) + 1;
    this.state.player.velX = 0;
    this.state.player.velY = 0;
    this.state.player.velZ = 0;
    this.state.player.flyMode = false;
    this.jumpQueued = false;
    this.resetCameraPoint();
    this.state.worldSpawn = {
      x: spawn.x,
      y: spawn.y,
      z: this.state.player.z,
      biome: spawn.biome || this.biomeAt(Math.floor(spawn.x), Math.floor(spawn.y))
    };
    this.rememberSpawnPoint(spawn, newSeed);

    this.state.people = this.createPeople(newSeed, spawn);
    this.seedWorldAnimals();
    this.seedWorldZombies(Math.max(8, Math.floor(8 + this.state.worldIndex * 1.2)));
    this.ensureMerchants();

    this.say(`Portal warped you to the ${this.getBiomeLabel(this.state.worldSpawn.biome)} in ${profile.name}.`);
  }

  nextPersonId() {
    const id = this.state.personSerial || 0;
    this.state.personSerial = id + 1;
    return `p-${this.state.seed}-${id}`;
  }

  nextZombieId() {
    const id = this.state.zombieSerial || 0;
    this.state.zombieSerial = id + 1;
    return `z-${this.state.seed}-${id}`;
  }

  nextAnimalId() {
    const id = this.state.animalSerial || 0;
    this.state.animalSerial = id + 1;
    return `a-${this.state.seed}-${id}`;
  }

  getHabitatAt(x, y) {
    const top = this.getTopSolidZ(x, y);
    const waterTop = this.getWaterTopZ(x, y);
    if (waterTop > top + 0.35) return "ocean";
    return this.biomeAt(x, y, this.terrainHeight(x, y));
  }

  getAnimalSpeciesDefinition(speciesId = "", habitat = "grass") {
    const habitats = [habitat, "grass", "sand", "snow", "ocean"];
    for (const key of habitats) {
      const found = (ANIMAL_SPECIES[key] || []).find((entry) => entry.id === speciesId);
      if (found) return { ...found, habitat: key };
    }
    const fallback = (ANIMAL_SPECIES[habitat] && ANIMAL_SPECIES[habitat][0]) || ANIMAL_SPECIES.grass[0];
    return { ...fallback, habitat: habitat || "grass" };
  }

  getWildlifeTargetCount() {
    const profile = this.getWorldProfile(this.state.seed);
    return WILDLIFE_TARGET_BASE + Math.round(profile.oceanBias * 10) + Math.round(profile.mountainBias * 6);
  }

  getPreferredAnimalHabitat(slot = 0) {
    const playerHabitat = this.getHabitatAt(Math.floor(this.state.player.x), Math.floor(this.state.player.y));
    const cycle = [playerHabitat, playerHabitat, "grass", "sand", "snow", "ocean", ""];
    return cycle[slot % cycle.length] || "";
  }

  findWildlifeSpawn(options = {}) {
    const seed = typeof options.seed === "number" ? options.seed : (this.state.seed || 1);
    const salt = options.salt || 0;
    const preferredHabitat = options.preferredHabitat || "";
    const anchorX = typeof options.anchorX === "number" ? options.anchorX : this.state.player.x;
    const anchorY = typeof options.anchorY === "number" ? options.anchorY : this.state.player.y;
    const minRadius = typeof options.minRadius === "number" ? options.minRadius : 8;
    const maxRadius = typeof options.maxRadius === "number" ? options.maxRadius : 92;

    for (let attempt = 0; attempt < 260; attempt += 1) {
      const radius = minRadius + this.hash01(seed * 0.47 + salt * 5.9 + attempt * 1.7) * Math.max(8, maxRadius - minRadius);
      const angle = this.hash01(seed * 0.79 + salt * 8.1 + attempt * 3.7) * Math.PI * 2;
      const x = Math.round(anchorX + Math.cos(angle) * radius);
      const y = Math.round(anchorY + Math.sin(angle) * radius);
      if (this.isInPrivateZone(x, y)) continue;
      const habitat = this.getHabitatAt(x, y);
      if (preferredHabitat && habitat !== preferredHabitat) continue;
      const tooCloseToPlayer = Math.hypot(x + 0.5 - this.state.player.x, y + 0.5 - this.state.player.y) < 4.2;
      const nearAnimal = this.state.animals.some((animal) => Math.hypot(animal.x - (x + 0.5), animal.y - (y + 0.5)) < 2.1);
      if (tooCloseToPlayer || nearAnimal) continue;

      if (habitat === "ocean") {
        const top = this.getTopSolidZ(x, y);
        const waterTop = this.getWaterTopZ(x, y);
        if (waterTop <= top + 1.35) continue;
        return { x: x + 0.5, y: y + 0.5, z: Math.max(top + 0.75, waterTop - 0.85), habitat };
      }

      if (!this.isDrySurface(x, y)) continue;
      const h = this.terrainHeight(x, y);
      if (this.getTerrainSlope(x, y, h) > 1.9) continue;
      if (this.isCellOccupied(x, y, h + 1)) continue;
      return { x: x + 0.5, y: y + 0.5, z: this.getTopSolidZ(x, y) + 1, habitat };
    }
    return null;
  }

  spawnAnimalInWorld(salt = 0, preferredHabitat = "") {
    const spot = this.findWildlifeSpawn({
      seed: this.state.seed + 307,
      salt: salt + this.state.animals.length * 11 + this.state.worldIndex * 17,
      preferredHabitat
    }) || (preferredHabitat ? this.findWildlifeSpawn({
      seed: this.state.seed + 307,
      salt: salt + this.state.animals.length * 11 + this.state.worldIndex * 17 + 41
    }) : null);
    if (!spot) return false;

    const pool = ANIMAL_SPECIES[spot.habitat] || ANIMAL_SPECIES.grass;
    const species = pool[Math.floor(this.hash01(this.state.seed * 0.91 + salt * 13.7 + this.state.animals.length * 7.3) * pool.length) % pool.length];
    const speedScale = 0.88 + this.hash01(this.state.seed * 0.33 + salt * 5.1 + this.state.animals.length * 9.1) * 0.32;
    const scale = species.scale * (0.92 + this.hash01(this.state.seed * 0.19 + salt * 7.7) * 0.2);
    const z = spot.habitat === "ocean"
      ? Math.max(this.getTopSolidZ(Math.floor(spot.x), Math.floor(spot.y)) + 0.75, this.getWaterTopZ(Math.floor(spot.x), Math.floor(spot.y)) - species.depthBias)
      : spot.z;

    this.state.animals.push({
      id: this.nextAnimalId(),
      x: spot.x,
      y: spot.y,
      z,
      habitat: spot.habitat,
      species: species.id,
      label: species.label,
      shape: species.shape,
      palette: { ...species.palette },
      scale,
      speed: species.speed * speedScale,
      depthBias: species.depthBias,
      dir: this.hash01(this.state.seed * 0.53 + salt * 11.2 + this.state.animals.length * 13.4) * Math.PI * 2,
      turnMs: 0.6 + this.hash01(this.state.seed * 0.61 + salt * 17.3 + this.state.animals.length * 7.9) * 2.5,
      walkCycle: this.hash01(this.state.seed * 0.43 + salt * 19.7) * Math.PI * 2,
      bobPhase: this.hash01(this.state.seed * 0.87 + salt * 23.1) * Math.PI * 2
    });
    return true;
  }

  seedWorldAnimals(count = this.getWildlifeTargetCount()) {
    this.state.animals = [];
    for (let i = 0; i < count; i += 1) {
      this.spawnAnimalInWorld(i * 17 + count, this.getPreferredAnimalHabitat(i));
    }
    for (let i = this.state.animals.length; i < count; i += 1) {
      if (!this.spawnAnimalInWorld(i * 29 + count + 7)) break;
    }
    this.state.animalSpawnMs = 2000;
  }

  updateAnimals(dtS, dt) {
    const p = this.state.player;
    const alive = [];

    for (const animal of this.state.animals) {
      if (!animal || typeof animal !== "object") continue;
      if (Math.hypot(animal.x - p.x, animal.y - p.y) > 145) continue;

      const gx = Math.floor(animal.x);
      const gy = Math.floor(animal.y);
      const habitatHere = this.getHabitatAt(gx, gy);
      const nearestZombie = this.findNearestZombie(animal.x, animal.y, animal.habitat === "ocean" ? 5.8 : 6.8);
      const fleeSource = nearestZombie || (Math.hypot(animal.x - p.x, animal.y - p.y) < 3.2 ? p : null);

      animal.turnMs -= dtS;
      if (animal.habitat === "ocean") {
        if (habitatHere !== "ocean") continue;
        if (fleeSource) {
          animal.dir = this.angleStep(animal.dir || 0, Math.atan2(animal.y - fleeSource.y, animal.x - fleeSource.x), dtS * 4.8);
        } else if (animal.turnMs <= 0) {
          animal.turnMs = 0.7 + this.hash01(this.state.seed + animal.x * 13 + animal.y * 19 + this.ambientMs * 0.001) * 2.1;
          animal.dir += (this.hash01(this.state.seed + animal.x * 29 + animal.y * 31 + this.ambientMs * 0.0007) - 0.5) * 1.9;
        }
        const swimSpeed = animal.speed * (fleeSource ? 1.55 : 1);
        const nx = animal.x + Math.cos(animal.dir || 0) * swimSpeed * dtS;
        const ny = animal.y + Math.sin(animal.dir || 0) * swimSpeed * dtS;
        if (this.getHabitatAt(Math.floor(nx), Math.floor(ny)) === "ocean") {
          animal.x = nx;
          animal.y = ny;
        } else {
          animal.dir += Math.PI * 0.65;
        }
        const floorZ = this.getTopSolidZ(Math.floor(animal.x), Math.floor(animal.y));
        const waterTop = this.getWaterTopZ(Math.floor(animal.x), Math.floor(animal.y));
        const targetZ = Math.max(floorZ + 0.75, waterTop - (animal.depthBias || 0.9) + Math.sin(this.ambientMs * 0.003 + (animal.bobPhase || 0)) * 0.18);
        animal.z += (targetZ - animal.z) * Math.min(1, dtS * 3.6);
        animal.walkCycle = (animal.walkCycle || 0) + swimSpeed * dtS * 6.4;
      } else {
        if (habitatHere === "ocean") continue;
        if (fleeSource) {
          animal.dir = this.angleStep(animal.dir || 0, Math.atan2(animal.y - fleeSource.y, animal.x - fleeSource.x), dtS * 4.5);
        } else if (animal.turnMs <= 0) {
          animal.turnMs = 0.8 + this.hash01(this.state.seed + animal.x * 17 + animal.y * 23 + this.ambientMs * 0.001) * 2.6;
          animal.dir += (this.hash01(this.state.seed + animal.x * 43 + animal.y * 41 + this.ambientMs * 0.0009) - 0.5) * 1.7;
        }
        const stride = animal.speed * (fleeSource ? 1.7 : 1);
        this.moveWalker(animal, Math.cos(animal.dir || 0) * stride * dtS, Math.sin(animal.dir || 0) * stride * dtS, 0.9);
        animal.z = this.getTopSolidZ(Math.floor(animal.x), Math.floor(animal.y)) + 1;
        animal.walkCycle = (animal.walkCycle || 0) + stride * dtS * 5.2;
      }

      alive.push(animal);
    }

    this.state.animals = alive;
    this.state.animalSpawnMs -= dt;
    const target = this.getWildlifeTargetCount();
    if (this.state.animalSpawnMs <= 0 && this.state.animals.length < target) {
      const missing = Math.min(4, target - this.state.animals.length);
      for (let i = 0; i < missing; i += 1) {
        this.spawnAnimalInWorld(Math.floor(this.ambientMs / 1000) + i * 13, this.getPreferredAnimalHabitat(this.state.animals.length + i));
      }
      this.state.animalSpawnMs = 1600;
    }
  }

  angleStep(from, to, maxStep) {
    const diff = Math.atan2(Math.sin(to - from), Math.cos(to - from));
    if (Math.abs(diff) <= maxStep) return to;
    return from + Math.sign(diff) * maxStep;
  }

  createPersonRecord(seed, i, center, orbitScale = 1) {
    const angle = (Math.PI * 2 * i) / PEOPLE_PER_WORLD;
    const radius = (12 + (i % 5) * 3.2) * orbitScale;
    const jitter = (this.hash01(seed + i * 97) - 0.5) * 2.2;
    const x = center.x + Math.cos(angle) * (radius + jitter);
    const y = center.y + Math.sin(angle) * (radius - jitter);
    return {
      id: this.nextPersonId(),
      name: PERSON_NAMES[i % PERSON_NAMES.length],
      x,
      y,
      z: this.getTopSolidZ(Math.floor(x), Math.floor(y)) + 1,
      homeX: x,
      homeY: y,
      dir: this.hash01(seed + i * 11) * Math.PI * 2,
      turnMs: 1 + this.hash01(seed + i * 19) * 2,
      actionMs: 0.8 + this.hash01(seed + i * 47) * 2.1,
      walkCycle: this.hash01(seed + i * 13) * Math.PI * 2,
      inventory: {
        wood: 2 + Math.floor(this.hash01(seed + i * 53) * 3),
        stone: 2 + Math.floor(this.hash01(seed + i * 59) * 4),
        metal: Math.floor(this.hash01(seed + i * 61) * 2),
        tnt: this.hash01(seed + i * 67) > 0.93 ? 1 : 0
      },
      resources: { amber: 0, crystal: 0, metal: 0, sulfur: 0, pearl: 0 },
      role: "villager"
    };
  }

  ensurePopulation() {
    if (!Array.isArray(this.state.people)) this.state.people = [];
    while (this.state.people.length < PEOPLE_PER_WORLD) {
      const idx = this.state.people.length;
      const center = this.state.worldSpawn || this.findFreshSpawn({ seed: this.state.seed, salt: 41 });
      const newcomer = this.createPersonRecord(this.state.seed + idx * 131 + Math.floor(this.ambientMs / 2000), idx, center, 0.55);
      newcomer.homeX += (this.hash01(idx * 17 + this.state.seed) - 0.5) * 3;
      newcomer.homeY += (this.hash01(idx * 29 + this.state.seed) - 0.5) * 3;
      newcomer.x = newcomer.homeX;
      newcomer.y = newcomer.homeY;
      newcomer.z = this.getTopSolidZ(Math.floor(newcomer.x), Math.floor(newcomer.y)) + 1;
      this.state.people.push(newcomer);
    }
    if (this.state.people.length > PEOPLE_PER_WORLD) this.state.people = this.state.people.slice(0, PEOPLE_PER_WORLD);
  }

  createPeople(seed, center = this.findFreshSpawn({ seed, salt: 41 })) {
    const people = [];
    for (let i = 0; i < PEOPLE_PER_WORLD; i += 1) {
      people.push(this.createPersonRecord(seed, i, center));
    }
    return people;
  }

  spawnZombieNearPlayer(distance) {
    const p = this.state.player;
    const a = Math.random() * Math.PI * 2;
    const x = p.x + Math.cos(a) * distance;
    const y = p.y + Math.sin(a) * distance;
    this.spawnZombieAt(x, y);
  }

  spawnZombieAt(x, y) {
    const surfaceZ = this.getTopSolidZ(Math.floor(x), Math.floor(y)) + 1;
    this.state.zombies.push({
      id: this.nextZombieId(),
      x,
      y,
      z: surfaceZ,
      dir: this.hash01(this.state.seed + x * 11 + y * 17 + this.state.zombies.length * 31) * Math.PI * 2,
      turnMs: 0.7 + this.hash01(this.state.seed + x * 41 + y * 13) * 1.8,
      walkCycle: this.hash01(this.state.seed + x * 23 + y * 29) * Math.PI * 2,
      lifeMs: 90000 + Math.random() * 90000
    });
  }

  spawnZombieInWorld(salt = 0) {
    const spot = this.findFreshSpawn({
      seed: this.state.seed + 911,
      salt: salt + this.state.zombies.length * 3 + this.state.worldIndex * 19,
      minRadius: 8,
      maxRadius: 120,
      requireOpenArea: true
    });
    if (!spot) return;
    this.spawnZombieAt(spot.x, spot.y);
  }

  seedWorldZombies(count = 8) {
    this.state.zombies = [];
    for (let i = 0; i < count; i += 1) {
      this.spawnZombieInWorld(i * 11 + count);
    }
  }

  getUndergroundZ(x, y) {
    const terrain = this.terrainHeight(x, y);
    return Math.max(MIN_Z + 1, terrain - 3);
  }

  getLandmassCenter(seed = (this.state?.seed || 1)) {
    const range = 72;
    return {
      x: Math.round((this.hash01(seed * 0.111) * 2 - 1) * range),
      y: Math.round((this.hash01(seed * 0.173) * 2 - 1) * range)
    };
  }

  getSpawnAnchor(seed = (this.state?.seed || 1), salt = 0) {
    const center = this.getLandmassCenter(seed);
    const angle = this.hash01(seed * 0.147 + salt * 7.31) * Math.PI * 2;
    const radius = 10 + this.hash01(seed * 0.293 + salt * 11.73) * 30;
    return {
      x: Math.round(center.x + Math.cos(angle) * radius),
      y: Math.round(center.y + Math.sin(angle) * radius)
    };
  }

  getRecentSpawnList(seed = null) {
    if (!Array.isArray(this.state?.recentSpawns)) return [];
    if (typeof seed !== "number") return this.state.recentSpawns;
    return this.state.recentSpawns.filter((spot) => spot && spot.seed === seed);
  }

  rememberSpawnPoint(spawn, seed = (this.state?.seed || 1)) {
    if (!this.state) return;
    if (!Array.isArray(this.state.recentSpawns)) this.state.recentSpawns = [];
    const entry = {
      seed,
      x: Number(spawn?.x) || 0,
      y: Number(spawn?.y) || 0,
      biome: spawn?.biome || this.biomeAt(Math.floor(spawn?.x || 0), Math.floor(spawn?.y || 0))
    };
    this.state.recentSpawns = [
      entry,
      ...this.state.recentSpawns.filter((spot) => !spot || spot.seed !== entry.seed || Math.hypot(spot.x - entry.x, spot.y - entry.y) > 8)
    ].slice(0, 10);
  }

  isDrySurface(x, y) {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    const top = this.getTopSolidZ(gx, gy);
    if (top < SEA_LEVEL + 1) return false;
    return this.getWaterTopZ(gx, gy) <= top;
  }

  isSpawnSpotSafe(x, y) {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    const top = this.getTopSolidZ(gx, gy);
    const feet = top + 1;
    if (!this.isDrySurface(gx, gy)) return false;
    if (this.isSolid(this.getBlock(gx, gy, feet)) || this.isSolid(this.getBlock(gx, gy, feet + 1)) || this.isSolid(this.getBlock(gx, gy, feet + 2))) return false;
    if (this.getTerrainSlope(gx, gy, top) > 1.35) return false;

    let blockedSides = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = gx + dx;
      const ny = gy + dy;
      if (!this.isDrySurface(nx, ny)) return false;
      if (
        this.isSolid(this.getBlock(nx, ny, feet)) ||
        this.isSolid(this.getBlock(nx, ny, feet + 1)) ||
        this.getTopSolidZ(nx, ny) > feet + 1
      ) {
        blockedSides += 1;
      }
    }
    return blockedSides <= 1;
  }

  repairSpawnStateIfNeeded() {
    const spawn = this.state?.worldSpawn;
    if (!spawn) return;
    const player = this.state?.player;
    const currentAtSpawn = Math.hypot((this.state.player?.x || 0) - spawn.x, (this.state.player?.y || 0) - spawn.y) < 1.5;
    const playerNeedsDryLand = Boolean(player) && (
      !this.isDrySurface(player.x, player.y) ||
      this.isPlayerInWater() ||
      player.z < this.getTopSolidZ(Math.floor(player.x), Math.floor(player.y)) + 1
    );
    let targetSpawn = spawn;

    if (!this.isSpawnSpotSafe(spawn.x, spawn.y)) {
      const repaired = this.findFreshSpawn({
        seed: this.state.seed,
        salt: (this.state.portalTravelCount || 0) + 17,
        preferredBiome: spawn.biome || "",
        minRadius: 12
      });
      if (!repaired) return;

      this.state.worldSpawn = {
        x: repaired.x,
        y: repaired.y,
        z: this.getTopSolidZ(Math.floor(repaired.x), Math.floor(repaired.y)) + 1,
        biome: repaired.biome || this.biomeAt(Math.floor(repaired.x), Math.floor(repaired.y))
      };
      this.rememberSpawnPoint(repaired, this.state.seed);
      targetSpawn = this.state.worldSpawn;
    }

    if (playerNeedsDryLand || currentAtSpawn) {
      this.state.player.x = targetSpawn.x;
      this.state.player.y = targetSpawn.y;
      this.state.player.z = targetSpawn.z;
      this.state.player.velX = 0;
      this.state.player.velY = 0;
      this.state.player.velZ = 0;
      this.state.player.flyMode = false;
      this.jumpQueued = false;
      this.resetCameraPoint();
    }
  }

  findFreshSpawn(options = {}) {
    const seed = typeof options.seed === "number" ? options.seed : (this.state?.seed || 1);
    const salt = options.salt || 0;
    const anchor = this.getSpawnAnchor(seed, salt);
    return this.findDrySpawn({
      ...options,
      anchorX: typeof options.anchorX === "number" ? options.anchorX : anchor.x,
      anchorY: typeof options.anchorY === "number" ? options.anchorY : anchor.y,
      maxRadius: typeof options.maxRadius === "number" ? options.maxRadius : 180,
      avoidPositions: Array.isArray(options.avoidPositions) ? options.avoidPositions : this.getRecentSpawnList(seed),
      minAvoidDistance: typeof options.minAvoidDistance === "number" ? options.minAvoidDistance : 22,
      requireOpenArea: options.requireOpenArea !== false
    });
  }

  findDrySpawn(options = {}) {
    const {
      preferredBiome = "",
      avoidBiome = "",
      minRadius = 0,
      anchorX = 0,
      anchorY = 0,
      maxRadius = 140,
      avoidPositions = [],
      minAvoidDistance = 18,
      requireOpenArea = true
    } = options;
    const seed = this.state.seed || 1;
    let fallback = null;
    let best = null;
    let bestScore = -Infinity;

    for (let attempt = 0; attempt < 240; attempt += 1) {
      const ring = Math.floor(attempt / 12);
      const radius = minRadius + 4 + ring * 4 + Math.floor(this.hash01(seed * 0.91 + attempt * 13.3) * 5);
      if (radius > maxRadius) break;
      const angle = this.hash01(seed * 0.41 + attempt * 17.7) * Math.PI * 2;
      const cx = Math.round(anchorX + Math.cos(angle) * radius);
      const cy = Math.round(anchorY + Math.sin(angle) * radius);

      for (let ox = -1; ox <= 1; ox += 1) {
        for (let oy = -1; oy <= 1; oy += 1) {
          const x = cx + ox;
          const y = cy + oy;
          const h = this.terrainHeight(x, y);
          if (h < SEA_LEVEL + 1 || !this.isDrySurface(x, y)) continue;
          const biome = this.biomeAt(x, y, h);
          if (preferredBiome && biome !== preferredBiome) continue;
          if (avoidBiome && biome === avoidBiome) continue;
          const slope = this.getTerrainSlope(x, y, h);
          const spot = { x: x + 0.5, y: y + 0.5, biome };
          const nearestAvoid = avoidPositions.length
            ? Math.min(...avoidPositions.map((p) => Math.hypot((p?.x || 0) - spot.x, (p?.y || 0) - spot.y)))
            : Infinity;
          const openArea = this.isSpawnSpotSafe(x, y);
          const score = (openArea ? 18 : 0) + Math.min(20, nearestAvoid) - slope * 8 - Math.hypot(x - anchorX, y - anchorY) * 0.03 + this.hash01(seed * 1.19 + x * 17 + y * 23);
          if (!fallback || score > fallback.score) fallback = { ...spot, slope, score };
          if (nearestAvoid < minAvoidDistance) continue;
          if (requireOpenArea && !openArea) continue;
          if (score > bestScore) {
            bestScore = score;
            best = spot;
          }
          if (openArea && slope <= 0.95 && nearestAvoid >= minAvoidDistance + 4) return spot;
        }
      }
    }

    if (best) return best;
    if (fallback) return { x: fallback.x, y: fallback.y, biome: fallback.biome };

    for (let r = 0; r <= 28; r += 1) {
      for (let x = -r; x <= r; x += 1) {
        for (let y = -r; y <= r; y += 1) {
          if (Math.abs(x) !== r && Math.abs(y) !== r) continue;
          const h = this.terrainHeight(x, y);
          if (h < SEA_LEVEL + 1 || !this.isDrySurface(x, y)) continue;
          const biome = this.biomeAt(x, y, h);
          if (preferredBiome && biome !== preferredBiome) continue;
          if (avoidBiome && biome === avoidBiome) continue;
          const spot = { x: x + 0.5, y: y + 0.5, biome };
          const nearestAvoid = avoidPositions.length
            ? Math.min(...avoidPositions.map((p) => Math.hypot((p?.x || 0) - spot.x, (p?.y || 0) - spot.y)))
            : Infinity;
          const openArea = this.isSpawnSpotSafe(x, y);
          if (!fallback) fallback = { ...spot, score: -Infinity };
          if (nearestAvoid < minAvoidDistance) continue;
          if (requireOpenArea && !openArea) continue;
          if (this.getTerrainSlope(x, y, h) <= 1.25) return spot;
        }
      }
    }
    return fallback || { x: 0.5, y: 0.5, biome: "grass" };
  }

  getWaterTopZ(x, y) {
    for (let z = MAX_Z; z >= MIN_Z; z -= 1) {
      const type = this.getBlock(x, y, z);
      if (type === "water" || type === "waterfall") return z + 1;
    }
    return MIN_Z;
  }

  isPlayerInWater() {
    const p = this.state.player;
    const px = Math.floor(p.x);
    const py = Math.floor(p.y);
    const waterTop = this.getWaterTopZ(px, py);
    return waterTop > MIN_Z && p.z < waterTop + 0.2;
  }

  findNearestZombie(x, y, maxDist = Infinity) {
    let best = null;
    let bestD = maxDist;
    for (const z of this.state.zombies) {
      const d = Math.hypot(x - z.x, y - z.y);
      if (d < bestD) {
        bestD = d;
        best = z;
      }
    }
    return best;
  }

  findNearestPersonOrPlayer(x, y, maxDist = Infinity) {
    let best = null;
    let bestD = maxDist;

    const playerD = Math.hypot(x - this.state.player.x, y - this.state.player.y);
    if (playerD < bestD) {
      best = this.state.player;
      bestD = playerD;
    }

    for (const p of this.state.people) {
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  checkEntityTnt() {
    const check = (entity, onHit, useEntityDepth = false) => {
      const x = Math.floor(entity.x);
      const y = Math.floor(entity.y);
      const z = useEntityDepth ? Math.floor(entity.z || this.getTopSolidZ(x, y)) : this.getTopSolidZ(x, y);
      if (this.getBlock(x, y, z) === "tnt") onHit(x, y, z);
    };

    check(this.state.player, (x, y, z) => {
      this.explode(x, y, z, 3.8, true);
    });

    this.state.people.forEach((person) => {
      check(person, (x, y, z) => this.explode(x, y, z, 3.4, true));
    });

    this.state.zombies.forEach((zombie) => {
      check(zombie, (x, y, z) => this.explode(x, y, z, 3.4, true), true);
    });
  }

  explode(cx, cy, cz, radius, triggeredByTnt = false) {
    this.state.explosions.push({ x: cx + 0.5, y: cy + 0.5, z: cz + 0.6, ms: 520, radius });

    for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx += 1) {
      for (let dy = -Math.ceil(radius); dy <= Math.ceil(radius); dy += 1) {
        for (let dz = -Math.ceil(radius); dz <= Math.ceil(radius); dz += 1) {
          const dist = Math.hypot(dx, dy, dz * 0.65);
          if (dist > radius) continue;
          const x = cx + dx;
          const y = cy + dy;
          const z = cz + dz;
          const t = this.getBlock(x, y, z);
          if (!this.isSolid(t) || t === "bedrock" || t === "portal") continue;
          this.setBlock(x, y, z, "air");
          delete this.state.burning[this.key(x, y, z)];
        }
      }
    }

    const hitEntity = (entity) => Math.hypot(entity.x - cx, entity.y - cy, (entity.z - cz) * 0.65) <= radius + 0.25;

    this.state.people = this.state.people.filter((p) => !hitEntity(p));
    this.state.animals = this.state.animals.filter((a) => !hitEntity(a));
    this.state.zombies = this.state.zombies.filter((z) => !hitEntity(z));

    if (hitEntity(this.state.player)) {
      this.damagePlayer(4, "blast");
      this.state.player.x += (Math.random() - 0.5) * 2;
      this.state.player.y += (Math.random() - 0.5) * 2;
      this.state.player.z = this.getTopSolidZ(Math.floor(this.state.player.x), Math.floor(this.state.player.y)) + 1;
    }

    if (triggeredByTnt) this.say("Boom. TNT exploded.");
  }

  getViewDirection() {
    const p = this.state.player;
    const flat = Math.cos(p.pitch);
    return {
      x: Math.cos(p.facing) * flat,
      y: Math.sin(p.facing) * flat,
      z: Math.sin(p.pitch)
    };
  }

  raycastTarget(maxDist = INTERACT_DISTANCE + 1.8, step = 0.14) {
    const p = this.state.player;
    const eye = { x: p.x, y: p.y, z: p.z + EYE_HEIGHT };
    const dir = this.getViewDirection();
    let prev = null;
    let lastKey = "";

    for (let t = 0.2; t <= maxDist; t += step) {
      const wx = eye.x + dir.x * t;
      const wy = eye.y + dir.y * t;
      const wz = eye.z + dir.z * t;
      const cell = { x: Math.floor(wx), y: Math.floor(wy), z: Math.floor(wz) };
      const key = this.key(cell.x, cell.y, cell.z);
      if (key === lastKey) continue;
      lastKey = key;
      const type = this.getBlock(cell.x, cell.y, cell.z);
      if (type === "water" || type === "waterfall") {
        prev = cell;
        continue;
      }
      if (this.isRenderable(type)) {
        return { x: cell.x, y: cell.y, z: cell.z, type, place: prev };
      }
      prev = cell;
    }

    return prev ? { ...prev, type: "", place: prev } : null;
  }

  terrainHeight(x, y) {
    const seed = this.state.seed || 1;
    const profile = this.getWorldProfile(seed);
    const flatWave = Math.sin((x + seed * 0.031) * 0.022) * 0.45 + Math.cos((y - seed * 0.037) * 0.02) * 0.38;
    let height = profile.plainHeight + Math.round(flatWave * 2) * 0.5;
    const landmass = this.getLandmassCenter(seed);
    const distToLandmass = Math.hypot(x - landmass.x, y - landmass.y);
    const landFalloff = Math.max(0, 1 - distToLandmass / 96);
    if (landFalloff > 0) {
      height += landFalloff * 4.5 + landFalloff * landFalloff * 4.5;
    }

    const oceanField = Math.sin((x - seed * 0.09) * 0.0052) + Math.cos((y + seed * 0.07) * 0.0048) + Math.sin((x + y + seed) * 0.0038);
    if (oceanField + profile.oceanBias > 1.42) {
      height -= 3 + Math.floor(this.hash01(seed + x * 17 + y * 23) * 4);
    }

    const basinField = Math.sin((x + seed * 0.043) * 0.013) + Math.cos((y - seed * 0.051) * 0.014) + Math.sin((x - y + seed) * 0.009);
    if (basinField + profile.oceanBias * 0.72 > 1.48) {
      height -= 1 + Math.floor(this.hash01(seed * 1.31 + x * 31 + y * 47) * 2);
    }

    const rangeField = Math.sin((x + seed * 0.13) * 0.0105) + Math.cos((y - seed * 0.1) * 0.0095) + Math.sin((x - y + seed) * 0.0062);
    if (rangeField + profile.mountainBias > 1.12) {
      const ridge = 1 - Math.abs(Math.sin((x + seed * 0.21) * 0.053) * 0.58 + Math.cos((y - seed * 0.16) * 0.048) * 0.42);
      const rough = this.hash01(seed * 1.7 + x * 77.3 + y * 133.7) * 1.4;
      const rise = (rangeField + profile.mountainBias - 1.12) * 7.2 + ridge * 6.8 + rough;
      height += Math.floor(rise / 1.5) * 1.5;
    }

    if (landFalloff > 0.28 && height < SEA_LEVEL + 2) {
      height = SEA_LEVEL + 2 + landFalloff * 2.2;
    }

    const clamped = Math.max(MIN_Z + 1, Math.min(MAX_Z - 2, height));
    return Math.floor(clamped);
  }

  biomeAt(x, y, h = this.terrainHeight(x, y)) {
    const v = this.hash01(this.state.seed + x * 19 + y * 29);
    if (h <= SEA_LEVEL + 1 || v < 0.12) return "sand";
    if (h >= 11 || (h >= 9 && v > 0.88)) return "snow";
    return "grass";
  }

  isTreeAt(x, y, h = this.terrainHeight(x, y)) {
    if (h <= SEA_LEVEL + 1) return false;
    if (this.biomeAt(x, y, h) !== "grass") return false;
    if (this.getTerrainSlope(x, y, h) > 2.1) return false;
    const profile = this.getWorldProfile(this.state.seed);
    const v = this.hash01(this.state.seed + x * 92821 + y * 68917);
    return v > 0.978 - profile.treeBias;
  }

  getNaturalBlock(x, y, z) {
    if (z <= MIN_Z) return "bedrock";

    const h = this.terrainHeight(x, y);
    const profile = this.getWorldProfile(this.state.seed);
    if (z > h) {
      const waterfall = this.getWaterfallInfo(x, y, h);
      if (waterfall && z >= waterfall.bottom && z <= waterfall.top) return "waterfall";
      if (z <= SEA_LEVEL) return "water";
      if (this.isTreeAt(x, y, h)) {
        const trunkTop = h + 3;
        if (z >= h + 1 && z <= trunkTop) return "wood";
      }

      if (z >= h + 3 && z <= h + 4) {
        const nearTree = this.isTreeAt(x, y, h) || this.isTreeAt(x + 1, y) || this.isTreeAt(x - 1, y) || this.isTreeAt(x, y + 1) || this.isTreeAt(x, y - 1);
        if (nearTree) return "leaves";
      }

      return "air";
    }

    if (z === h) {
      const b = this.biomeAt(x, y, h);
      if (b === "sand") return "sand";
      if (b === "snow") return "snow";
      return "grass";
    }

    if (z >= h - 2) return "dirt";

    const ore = this.getProfileOreAt(x, y, z, h, profile);
    if (ore) return ore;

    return "stone";
  }

  getBlock(x, y, z) {
    const k = this.key(x, y, z);
    const mods = (this.state && this.state.worldMods && typeof this.state.worldMods === "object")
      ? this.state.worldMods
      : {};
    if (Object.prototype.hasOwnProperty.call(mods, k)) return mods[k];
    return this.getNaturalBlock(x, y, z);
  }

  setBlock(x, y, z, type) {
    const k = this.key(x, y, z);
    const natural = this.getNaturalBlock(x, y, z);
    if (!this.state.worldMods || typeof this.state.worldMods !== "object") {
      this.state.worldMods = {};
    }
    if (type === natural) {
      delete this.state.worldMods[k];
      return;
    }
    this.state.worldMods[k] = type;
  }

  getTopSolidZ(x, y) {
    for (let z = MAX_Z; z >= MIN_Z; z -= 1) {
      if (this.isSolid(this.getBlock(x, y, z))) return z;
    }
    return MIN_Z;
  }

  refreshEntityHeights() {
    this.state.player.z = this.getTopSolidZ(Math.floor(this.state.player.x), Math.floor(this.state.player.y)) + 1;
    this.state.people.forEach((p) => {
      if (this.isMerchant(p)) {
        p.stall.z = this.getTopSolidZ(Math.floor(p.stall.x), Math.floor(p.stall.y)) + 1;
      }
      p.z = this.getTopSolidZ(Math.floor(p.x), Math.floor(p.y)) + 1;
    });
    this.state.animals.forEach((a) => {
      if (a.habitat === "ocean") {
        const floorZ = this.getTopSolidZ(Math.floor(a.x), Math.floor(a.y));
        const waterTop = this.getWaterTopZ(Math.floor(a.x), Math.floor(a.y));
        a.z = Math.max(floorZ + 0.75, waterTop - (a.depthBias || 0.9));
      } else {
        a.z = this.getTopSolidZ(Math.floor(a.x), Math.floor(a.y)) + 1;
      }
    });
    this.state.zombies.forEach((z) => { z.z = this.getTopSolidZ(Math.floor(z.x), Math.floor(z.y)) + 1; });
  }

  isSolid(type) {
    return Boolean(type && type !== "air" && type !== "water" && type !== "waterfall");
  }

  isRenderable(type) {
    return Boolean(type && type !== "air");
  }

  colorFor(type) {
    switch (type) {
      case "grass": return "#5fa84f";
      case "dirt": return "#7e5a3c";
      case "stone": return "#8b939d";
      case "sand": return "#c9b97b";
      case "snow": return "#d5e6f5";
      case "wood": return "#91623c";
      case "leaves": return "#4f8d46";
      case "metal": return "#9ea7b5";
      case "metal_ore": return "#7a8594";
      case "amber_ore": return "#c28a2a";
      case "crystal_ore": return "#70d8ea";
      case "sulfur_ore": return "#d6c046";
      case "pearl_ore": return "#d7e8f8";
      case "water": return "#2c67c4";
      case "waterfall": return "#79cdf4";
      case "tnt": return "#bb3333";
      case "portal": return "#7f4bff";
      case "bedrock": return "#303744";
      default: return "#8b939d";
    }
  }

  shade(hex, factor) {
    const clean = hex.replace("#", "");
    const n = parseInt(clean, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    const fr = Math.max(0, Math.min(255, Math.floor(r * factor)));
    const fg = Math.max(0, Math.min(255, Math.floor(g * factor)));
    const fb = Math.max(0, Math.min(255, Math.floor(b * factor)));
    return `rgb(${fr},${fg},${fb})`;
  }

  resetCameraPoint() {
    const p = this.state.player;
    this.cameraPoint = p ? { x: p.x, y: p.y, z: p.z + EYE_HEIGHT } : null;
  }

  updateCameraPoint(dtS) {
    const p = this.state.player;
    const target = { x: p.x, y: p.y, z: p.z + EYE_HEIGHT };
    if (!this.cameraPoint) {
      this.cameraPoint = { ...target };
      return;
    }
    const blend = 1 - Math.exp(-CAMERA_SMOOTHING * dtS);
    this.cameraPoint.x += (target.x - this.cameraPoint.x) * blend;
    this.cameraPoint.y += (target.y - this.cameraPoint.y) * blend;
    this.cameraPoint.z += (target.z - this.cameraPoint.z) * blend;
  }

  getCameraPoint() {
    if (this.cameraPoint) return this.cameraPoint;
    const p = this.state.player;
    return { x: p.x, y: p.y, z: p.z + EYE_HEIGHT };
  }

  worldToCamera(wx, wy, wz) {
    const p = this.state.player;
    const cam = this.getCameraPoint();
    const dx = wx - cam.x;
    const dy = wy - cam.y;
    const dz = wz - cam.z;
    const cosYaw = Math.cos(p.facing);
    const sinYaw = Math.sin(p.facing);
    const right = -dx * sinYaw + dy * cosYaw;
    const forward = dx * cosYaw + dy * sinYaw;
    const cosPitch = Math.cos(p.pitch);
    const sinPitch = Math.sin(p.pitch);
    return {
      right,
      depth: forward * cosPitch + dz * sinPitch,
      up: dz * cosPitch - forward * sinPitch
    };
  }

  project3D(wx, wy, wz) {
    const c = this.worldToCamera(wx, wy, wz);
    if (c.depth <= 0.08) return null;
    const cw = this.canvas.clientWidth;
    const ch = this.canvas.clientHeight;
    const focal = Math.min(cw, ch) * 0.92;
    return {
      x: cw * 0.5 + (c.right * focal) / c.depth,
      y: ch * 0.56 - (c.up * focal) / c.depth,
      depth: c.depth
    };
  }

  drawFace(points, fill, alpha = 1, stroke = "rgba(8,16,24,0.18)") {
    if (points.some((p) => !p)) return;
    const c = this.ctx;
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) c.lineTo(points[i].x, points[i].y);
    c.closePath();
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1;
      c.stroke();
    }
    c.restore();
  }

  drawFireBillboard(x, y, z) {
    const base = this.project3D(x + 0.5, y + 0.5, z + 0.15);
    const top = this.project3D(x + 0.5, y + 0.5, z + 1.35);
    if (!base || !top) return;
    const c = this.ctx;
    const h = Math.max(8, base.y - top.y);
    const w = h * 0.45;
    const flicker = 0.7 + Math.sin(this.ambientMs * 0.024 + x * 3 + y * 5) * 0.16;
    c.save();
    c.globalCompositeOperation = "screen";
    c.fillStyle = `rgba(255,110,40,${0.42 * flicker})`;
    c.beginPath();
    c.ellipse(base.x, base.y - h * 0.4, w, h * 0.62, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = `rgba(255,220,120,${0.55 * flicker})`;
    c.beginPath();
    c.ellipse(base.x, base.y - h * 0.56, w * 0.48, h * 0.34, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  drawExplosionBillboard(fx) {
    const p = this.project3D(fx.x, fx.y, fx.z);
    if (!p) return;
    const c = this.ctx;
    const t = fx.ms / 520;
    const radius = Math.max(10, (1 - t) * 120 / Math.max(0.6, p.depth * 0.18));
    c.save();
    c.globalCompositeOperation = "screen";
    c.fillStyle = `rgba(255,170,60,${0.34 + t * 0.22})`;
    c.beginPath();
    c.arc(p.x, p.y, radius, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = `rgba(255,245,180,${0.16 + t * 0.18})`;
    c.beginPath();
    c.arc(p.x, p.y, radius * 0.46, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  drawCloudBillboard(x, y, z, size, alpha = 1) {
    const p = this.project3D(x, y, z);
    if (!p || p.depth < 1.5) return;
    const c = this.ctx;
    const scale = Math.max(16, (size * 110) / Math.max(1, p.depth));
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = "rgba(255,255,255,0.82)";
    c.beginPath();
    c.ellipse(p.x - scale * 0.3, p.y, scale * 0.42, scale * 0.24, 0, 0, Math.PI * 2);
    c.ellipse(p.x, p.y - scale * 0.06, scale * 0.5, scale * 0.28, 0, 0, Math.PI * 2);
    c.ellipse(p.x + scale * 0.34, p.y, scale * 0.38, scale * 0.22, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  drawClouds() {
    if (this.isPlayerInWater()) return;
    const px = Math.floor(this.state.player.x / 18);
    const py = Math.floor(this.state.player.y / 18);
    const boost = this.state.weather.type === "cloudy" || this.state.weather.type === "rain" || this.state.weather.type === "storm" ? 0.12 : 0;
    for (let gx = px - 4; gx <= px + 4; gx += 1) {
      for (let gy = py - 4; gy <= py + 4; gy += 1) {
        const hash = this.hash01(this.state.seed * 0.61 + gx * 41 + gy * 67);
        if (hash < 0.76 - boost) continue;
        const wx = gx * 18 + this.hash01(hash * 733) * 10 - 5;
        const wy = gy * 18 + this.hash01(hash * 977) * 10 - 5;
        const wz = 20 + this.hash01(hash * 557) * 6;
        const size = 1.8 + this.hash01(hash * 131) * 1.6;
        this.drawCloudBillboard(wx, wy, wz, size, 0.72 + boost * 0.9);
      }
    }
  }

  drawWeatherOverlay(cw, ch) {
    if (this.isPlayerInWater()) return;
    const weather = this.state.weather.type;
    if (weather === "clear" || weather === "cloudy") return;
    const c = this.ctx;
    c.save();
    if (weather === "rain" || weather === "storm") {
      c.strokeStyle = weather === "storm" ? "rgba(210,230,255,0.42)" : "rgba(210,230,255,0.26)";
      c.lineWidth = weather === "storm" ? 1.5 : 1;
      const streaks = weather === "storm" ? 80 : 54;
      for (let i = 0; i < streaks; i += 1) {
        const hash = this.hash01(this.state.seed * 0.29 + i * 37 + this.ambientMs * 0.0024);
        const x = hash * cw;
        const y = (this.hash01(this.state.seed * 0.71 + i * 53 + this.ambientMs * 0.0031) * ch);
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 8, y + 18);
        c.stroke();
      }
      if (weather === "storm" && this.hash01(this.state.seed + Math.floor(this.ambientMs / 180)) > 0.984) {
        c.fillStyle = "rgba(255,255,255,0.1)";
        c.fillRect(0, 0, cw, ch);
      }
    } else if (weather === "snow") {
      c.fillStyle = "rgba(245,250,255,0.78)";
      for (let i = 0; i < 64; i += 1) {
        const hash = this.hash01(this.state.seed * 0.39 + i * 29 + this.ambientMs * 0.0009);
        const x = hash * cw;
        const y = this.hash01(this.state.seed * 0.93 + i * 61 + this.ambientMs * 0.0012) * ch;
        const size = 1.5 + this.hash01(i * 11 + this.ambientMs * 0.001) * 2.5;
        c.fillRect(x, y, size, size);
      }
    }
    c.restore();
  }

  drawTargetOutline(hit) {
    if (!hit || !hit.type) return;
    const center = this.project3D(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    if (!center) return;
    const c = this.ctx;
    const size = Math.max(10, 82 / Math.max(0.7, center.depth));
    c.save();
    c.strokeStyle = "rgba(255,255,255,0.95)";
    c.lineWidth = 2;
    c.strokeRect(center.x - size * 0.5, center.y - size * 0.5, size, size);
    c.restore();
  }

  drawEntityBillboard(entity, palette, label, style = "human") {
    const foot = this.project3D(entity.x, entity.y, entity.z - 0.02);
    const head = this.project3D(entity.x, entity.y, entity.z + 1.62);
    if (!foot || !head) return;
    const c = this.ctx;
    const h = Math.max(12, foot.y - head.y);
    const w = h * 0.34;
    const headSize = w * 0.72;
    const bodyTop = head.y + h * 0.34;
    const bodyHeight = h * 0.42;
    const armTop = head.y + h * 0.38;
    const legTop = head.y + h * 0.72;
    const limbW = Math.max(2, w * 0.16);
    const handSize = Math.max(2, w * 0.18);
    const cycle = entity.walkCycle || 0;
    const stride = Math.sin(cycle);
    const legSwing = style === "zombie" ? Math.sin(cycle * 0.6) * h * 0.05 : stride * h * 0.12;
    const armSwing = style === "zombie" ? h * 0.08 + Math.sin(cycle * 0.5) * h * 0.03 : -stride * h * 0.1;
    const bodyLean = style === "zombie" ? h * 0.04 : 0;
    const headTilt = style === "zombie" ? Math.sin(cycle * 0.4) * w * 0.08 : 0;
    c.fillStyle = "rgba(0,0,0,0.22)";
    c.beginPath();
    c.ellipse(foot.x, foot.y + 2, w * 0.65, h * 0.12, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = palette.head;
    c.fillRect(foot.x - headSize * 0.5 + headTilt, head.y + bodyLean * 0.15, headSize, headSize);

    c.fillStyle = palette.body;
    c.fillRect(foot.x - w * 0.42, bodyTop + bodyLean, w * 0.84, bodyHeight);

    c.fillStyle = palette.limb;
    c.fillRect(foot.x - w * 0.66, armTop + armSwing, limbW, h * 0.3);
    c.fillRect(foot.x + w * 0.5, armTop - armSwing, limbW, h * 0.3);
    c.fillRect(foot.x - w * 0.22, legTop + legSwing, limbW, h * 0.28);
    c.fillRect(foot.x + w * 0.06, legTop - legSwing, limbW, h * 0.28);

    c.fillStyle = palette.head;
    c.fillRect(foot.x - w * 0.7, armTop + h * 0.26 + armSwing, handSize, handSize);
    c.fillRect(foot.x + w * 0.46, armTop + h * 0.26 - armSwing, handSize, handSize);

    if (foot.depth < 14) {
      const eyeSize = Math.max(1.5, headSize * 0.12);
      c.fillStyle = "#12202b";
      c.fillRect(foot.x - headSize * 0.22 + headTilt, head.y + headSize * 0.28 + bodyLean * 0.15, eyeSize, eyeSize);
      c.fillRect(foot.x + headSize * 0.1 + headTilt, head.y + headSize * 0.28 + bodyLean * 0.15, eyeSize, eyeSize);
      c.fillRect(foot.x - headSize * 0.14 + headTilt, head.y + headSize * 0.62 + bodyLean * 0.15, headSize * 0.28, Math.max(1.5, headSize * 0.08));
    }

    if (foot.depth < 10) {
      c.fillStyle = "rgba(6,12,18,0.68)";
      c.font = "12px Trebuchet MS";
      c.fillText(label, foot.x - c.measureText(label).width / 2, head.y - 8);
    }
  }

  drawAnimalBillboard(animal) {
    const c = this.ctx;
    const scale = animal.scale || 1;
    const bodyBase = animal.habitat === "ocean" ? animal.z + 0.26 : animal.z - 0.02;
    const foot = this.project3D(animal.x, animal.y, bodyBase);
    const crown = this.project3D(animal.x, animal.y, bodyBase + (animal.shape === "fish" ? 0.78 : animal.shape === "jelly" ? 0.92 : 1.08) * scale);
    if (!foot || !crown) return;

    const h = Math.max(10, foot.y - crown.y);
    const w = h * (animal.shape === "fish" ? 0.58 : animal.shape === "jelly" ? 0.48 : 0.62);
    const stride = Math.sin(animal.walkCycle || 0);
    const bob = animal.habitat === "ocean" ? Math.sin(this.ambientMs * 0.004 + (animal.bobPhase || 0)) * h * 0.04 : 0;
    const palette = animal.palette || ANIMAL_SPECIES.grass[0].palette;

    c.save();
    c.fillStyle = "rgba(0,0,0,0.18)";
    c.beginPath();
    c.ellipse(foot.x, foot.y + 2, w * 0.62, h * 0.11, 0, 0, Math.PI * 2);
    c.fill();

    if (animal.shape === "fish" || animal.shape === "turtle") {
      c.fillStyle = palette.body;
      c.beginPath();
      c.ellipse(foot.x, foot.y - h * 0.28 + bob, w * 0.62, h * 0.22, 0, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = palette.limb;
      c.beginPath();
      c.moveTo(foot.x - w * 0.72, foot.y - h * 0.28 + bob);
      c.lineTo(foot.x - w * 1.08, foot.y - h * 0.4 + bob);
      c.lineTo(foot.x - w * 1.02, foot.y - h * 0.14 + bob);
      c.closePath();
      c.fill();

      c.fillStyle = palette.head;
      c.beginPath();
      c.ellipse(foot.x + w * 0.6, foot.y - h * 0.29 + bob, w * 0.22, h * 0.13, 0, 0, Math.PI * 2);
      c.fill();

      if (animal.shape === "turtle") {
        c.fillStyle = palette.limb;
        c.fillRect(foot.x - w * 0.32, foot.y - h * 0.1 + bob + stride * 1.4, w * 0.18, h * 0.08);
        c.fillRect(foot.x + w * 0.08, foot.y - h * 0.1 + bob - stride * 1.4, w * 0.18, h * 0.08);
      }
    } else if (animal.shape === "jelly") {
      c.fillStyle = palette.head;
      c.beginPath();
      c.ellipse(foot.x, foot.y - h * 0.36 + bob, w * 0.46, h * 0.26, 0, Math.PI, 0, true);
      c.lineTo(foot.x + w * 0.46, foot.y - h * 0.36 + bob);
      c.fill();

      c.strokeStyle = palette.limb;
      c.lineWidth = Math.max(1.2, w * 0.08);
      for (const tx of [-0.24, -0.08, 0.08, 0.24]) {
        c.beginPath();
        c.moveTo(foot.x + w * tx, foot.y - h * 0.36 + bob);
        c.lineTo(foot.x + w * tx + stride * 1.2, foot.y + h * 0.1 + bob);
        c.stroke();
      }
    } else {
      c.fillStyle = palette.body;
      c.beginPath();
      c.ellipse(foot.x, foot.y - h * 0.28, w * 0.55, h * 0.22, 0, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = palette.head;
      c.beginPath();
      c.ellipse(foot.x + w * 0.48, foot.y - h * 0.34, w * 0.24, h * 0.16, 0, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = palette.limb;
      const legH = h * 0.24;
      c.fillRect(foot.x - w * 0.32, foot.y - legH * 0.3 + stride * 1.2, w * 0.1, legH);
      c.fillRect(foot.x - w * 0.08, foot.y - legH * 0.2 - stride * 1.1, w * 0.1, legH);
      c.fillRect(foot.x + w * 0.12, foot.y - legH * 0.18 - stride * 1.1, w * 0.1, legH);
      c.fillRect(foot.x + w * 0.34, foot.y - legH * 0.28 + stride * 1.2, w * 0.1, legH);

      if (animal.shape === "crab") {
        c.fillRect(foot.x - w * 0.72, foot.y - h * 0.34, w * 0.22, h * 0.05);
        c.fillRect(foot.x + w * 0.5, foot.y - h * 0.34, w * 0.22, h * 0.05);
      }
    }

    c.fillStyle = palette.accent || "#f5f5f5";
    c.fillRect(foot.x + w * 0.58, foot.y - h * 0.37 + bob, Math.max(1.5, w * 0.06), Math.max(1.5, h * 0.04));

    if (foot.depth < 8) {
      c.fillStyle = "rgba(6,12,18,0.7)";
      c.font = "12px Trebuchet MS";
      c.fillText(animal.label || "Animal", foot.x - c.measureText(animal.label || "Animal").width / 2, crown.y - 8);
    }
    c.restore();
  }

  drawStallBillboard(merchant) {
    const stall = merchant?.stall;
    if (!stall) return;

    const privateRadius = stall.privateZoneRadius || 2.4;
    const x0 = stall.x - 0.9;
    const x1 = stall.x + 0.9;
    const y0 = stall.y - 0.58;
    const y1 = stall.y + 0.58;
    const z0 = stall.z;
    const counterTop = z0 + 0.74;
    const roofBack = z0 + 1.9;
    const roofFront = z0 + 1.68;
    const awning = stall.color || "#d6934f";

    this.drawFace(
      [
        this.project3D(stall.x - privateRadius, stall.y - privateRadius * 0.72, z0 + 0.03),
        this.project3D(stall.x + privateRadius, stall.y - privateRadius * 0.72, z0 + 0.03),
        this.project3D(stall.x + privateRadius, stall.y + privateRadius * 0.72, z0 + 0.03),
        this.project3D(stall.x - privateRadius, stall.y + privateRadius * 0.72, z0 + 0.03)
      ],
      "rgba(28,48,66,0.18)",
      1,
      "rgba(160,215,255,0.16)"
    );

    this.drawFace(
      [this.project3D(x0, y0, counterTop), this.project3D(x1, y0, counterTop), this.project3D(x1, y1, counterTop), this.project3D(x0, y1, counterTop)],
      this.shade("#94663d", 1.08),
      1
    );
    this.drawFace(
      [this.project3D(x0, y1, z0), this.project3D(x1, y1, z0), this.project3D(x1, y1, counterTop), this.project3D(x0, y1, counterTop)],
      "#7d5630",
      1
    );
    this.drawFace(
      [this.project3D(x0 - 0.1, y0 - 0.02, roofBack), this.project3D(x1 + 0.1, y0 - 0.02, roofBack), this.project3D(x1 + 0.18, y1 + 0.04, roofFront), this.project3D(x0 - 0.18, y1 + 0.04, roofFront)],
      awning,
      0.98,
      "rgba(44,24,18,0.14)"
    );
    this.drawFace(
      [this.project3D(x0 - 0.04, y0 + 0.06, roofBack - 0.12), this.project3D(x1 + 0.04, y0 + 0.06, roofBack - 0.12), this.project3D(x1 + 0.12, y1 - 0.02, roofFront - 0.12), this.project3D(x0 - 0.12, y1 - 0.02, roofFront - 0.12)],
      this.shade(awning, 0.76),
      0.84,
      ""
    );

    const c = this.ctx;
    c.save();
    c.strokeStyle = "#5d3f25";
    c.lineCap = "round";
    for (const [px, py] of [[x0 + 0.12, y0 + 0.08], [x1 - 0.12, y0 + 0.08], [x0 + 0.12, y1 - 0.08], [x1 - 0.12, y1 - 0.08]]) {
      const top = this.project3D(px, py, roofFront - 0.02);
      const bottom = this.project3D(px, py, z0);
      if (!top || !bottom) continue;
      c.lineWidth = Math.max(2, 12 / Math.max(1, top.depth));
      c.beginPath();
      c.moveTo(top.x, top.y);
      c.lineTo(bottom.x, bottom.y);
      c.stroke();
    }

    const sign = this.project3D(stall.x, stall.y, roofBack + 0.14);
    if (sign && sign.depth < 15) {
      const label = merchant.shop?.title || "Stall";
      c.fillStyle = "rgba(10,16,26,0.72)";
      c.font = "12px Trebuchet MS";
      const width = c.measureText(label).width + 12;
      c.fillRect(sign.x - width / 2, sign.y - 12, width, 16);
      c.fillStyle = "#f3f7ff";
      c.fillText(label, sign.x - width / 2 + 6, sign.y);
    }
    c.restore();
  }

  drawCube3D(x, y, z, type) {
    const cam = this.getCameraPoint();
    const base = this.colorFor(type);
    const alpha = type === "water" ? 0.5 : (type === "waterfall" ? 0.68 : 1);
    const x0 = x;
    const x1 = x + 1;
    const y0 = y;
    const y1 = y + 1;
    const z0 = z;
    const z1 = z + 1;

    const pts = {
      nbl: this.project3D(x0, y0, z0),
      nbr: this.project3D(x1, y0, z0),
      fbl: this.project3D(x0, y1, z0),
      fbr: this.project3D(x1, y1, z0),
      ntl: this.project3D(x0, y0, z1),
      ntr: this.project3D(x1, y0, z1),
      ftl: this.project3D(x0, y1, z1),
      ftr: this.project3D(x1, y1, z1)
    };

    if (cam.z >= z0 + 0.45 || type === "water") {
      this.drawFace([pts.ntl, pts.ntr, pts.ftr, pts.ftl], this.shade(base, 1.08), alpha);
    }
    if (cam.x <= x0 + 0.5) {
      this.drawFace([pts.ntl, pts.ftl, pts.fbl, pts.nbl], this.shade(base, 0.72), alpha);
    } else {
      this.drawFace([pts.ntr, pts.ftr, pts.fbr, pts.nbr], this.shade(base, 0.82), alpha);
    }
    if (cam.y <= y0 + 0.5) {
      this.drawFace([pts.ntl, pts.ntr, pts.nbr, pts.nbl], this.shade(base, 0.86), alpha);
    } else {
      this.drawFace([pts.ftl, pts.ftr, pts.fbr, pts.fbl], this.shade(base, 0.62), alpha);
    }

    if (type === "portal") {
      this.drawFace(
        [this.project3D(x0 + 0.08, y0 + 0.08, z0 + 0.08), this.project3D(x1 - 0.08, y0 + 0.08, z0 + 0.08), this.project3D(x1 - 0.08, y1 - 0.08, z1 - 0.08), this.project3D(x0 + 0.08, y1 - 0.08, z1 - 0.08)],
        `rgba(180,140,255,${0.34 + Math.sin(this.ambientMs * 0.008) * 0.14})`,
        1,
        ""
      );
    }

    if (type === "tnt") {
      const topA = this.project3D(x0 + 0.18, y0 + 0.18, z1 + 0.01);
      const topB = this.project3D(x1 - 0.18, y1 - 0.18, z1 + 0.01);
      if (topA && topB) {
        const c = this.ctx;
        c.fillStyle = "#f5e39a";
        c.fillRect(Math.min(topA.x, topB.x), Math.min(topA.y, topB.y), Math.abs(topB.x - topA.x), Math.abs(topB.y - topA.y));
      }
    }

    if (type === "waterfall") {
      const top = this.project3D(x0 + 0.5, y0 + 0.5, z1);
      const bottom = this.project3D(x0 + 0.5, y0 + 0.5, z0);
      if (top && bottom) {
        const c = this.ctx;
        c.save();
        c.strokeStyle = "rgba(235,248,255,0.55)";
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(top.x, top.y);
        c.lineTo(bottom.x, bottom.y);
        c.stroke();
        c.restore();
      }
    }

    if (this.state.burning[this.key(x, y, z)]) this.drawFireBillboard(x, y, z);
  }

  render() {
    const c = this.ctx;
    const cw = this.canvas.clientWidth;
    const ch = this.canvas.clientHeight;
    const p = this.state.player;
    const camPoint = this.getCameraPoint();
    const inWater = this.isPlayerInWater();
    const weather = this.state.weather.type;

    c.clearRect(0, 0, cw, ch);
    const sky = c.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, inWater ? "#4f8fc1" : (weather === "storm" ? "#627b97" : weather === "rain" ? "#6f8eab" : "#7cb3ea"));
    sky.addColorStop(0.5, inWater ? "#356d99" : (weather === "storm" ? "#445d78" : weather === "rain" ? "#547693" : "#4f86c0"));
    sky.addColorStop(1, inWater ? "#1b3651" : (weather === "storm" ? "#24384c" : weather === "rain" ? "#35536d" : "#2d4f70"));
    c.fillStyle = sky;
    c.fillRect(0, 0, cw, ch);

    this.drawClouds();

    const horizon = ch * (0.55 + this.state.player.pitch * 0.18);
    c.fillStyle = inWater ? "rgba(37,84,142,0.55)" : "rgba(52,96,134,0.9)";
    c.fillRect(0, horizon, cw, ch - horizon);

    const px = Math.floor(camPoint.x);
    const py = Math.floor(camPoint.y);
    const renderables = [];

    for (let x = px - RENDER_RADIUS; x <= px + RENDER_RADIUS; x += 1) {
      for (let y = py - RENDER_RADIUS; y <= py + RENDER_RADIUS; y += 1) {
        const ring = Math.max(Math.abs(x - px), Math.abs(y - py));
        const top = this.getTopSolidZ(x, y);
        const waterSurface = this.getWaterTopZ(x, y) - 1;
        if (ring <= VIEW_RADIUS) {
          const low = Math.max(MIN_Z, Math.min(top, Math.floor(p.z) - 1) - 6);
          const high = Math.min(MAX_Z, Math.max(top + 4, waterSurface + 1, Math.ceil(p.z) + 2));
          for (let z = low; z <= high; z += 1) {
            const t = this.getBlock(x, y, z);
            if (!this.isRenderable(t)) continue;
            const center = this.worldToCamera(x + 0.5, y + 0.5, z + 0.5);
            if (center.depth <= 0.08) continue;
            renderables.push({ kind: "block", depth: center.depth, x, y, z, t });
          }
        } else {
          let surfaceZ = top;
          let surfaceType = this.getBlock(x, y, top);
          if (waterSurface >= top + 1) {
            surfaceZ = waterSurface;
            surfaceType = this.getBlock(x, y, waterSurface);
          }
          if (!this.isRenderable(surfaceType)) continue;
          const center = this.worldToCamera(x + 0.5, y + 0.5, surfaceZ + 0.5);
          if (center.depth <= 0.08) continue;
          renderables.push({ kind: "surface", depth: center.depth, x, y, z: surfaceZ, t: surfaceType });
        }
      }
    }

    this.state.people.forEach((entity) => {
      if (this.isMerchant(entity)) {
        const stallCam = this.worldToCamera(entity.stall.x, entity.stall.y, entity.stall.z + 0.8);
        if (stallCam.depth > 0.08) renderables.push({ kind: "stall", depth: stallCam.depth + 0.08, entity });
      }
      const cam = this.worldToCamera(entity.x, entity.y, entity.z + 0.8);
      if (cam.depth > 0.08) renderables.push({ kind: "person", depth: cam.depth, entity });
    });
    this.state.animals.forEach((entity) => {
      const cam = this.worldToCamera(entity.x, entity.y, entity.z + 0.55);
      if (cam.depth > 0.08) renderables.push({ kind: "animal", depth: cam.depth, entity });
    });
    this.state.zombies.forEach((entity) => {
      const cam = this.worldToCamera(entity.x, entity.y, entity.z + 0.8);
      if (cam.depth > 0.08) renderables.push({ kind: "zombie", depth: cam.depth, entity });
    });
    this.state.explosions.forEach((fx) => {
      const cam = this.worldToCamera(fx.x, fx.y, fx.z);
      if (cam.depth > 0.08) renderables.push({ kind: "explosion", depth: cam.depth, fx });
    });

    renderables.sort((a, b) => b.depth - a.depth);
    renderables.forEach((item) => {
      if (item.kind === "block" || item.kind === "surface") this.drawCube3D(item.x, item.y, item.z, item.t);
      if (item.kind === "stall") this.drawStallBillboard(item.entity);
      if (item.kind === "person") {
        const isMerchant = this.isMerchant(item.entity);
        this.drawEntityBillboard(
          item.entity,
          isMerchant
            ? { head: "#f0d7c3", body: "#b36c3e", limb: "#6b4529" }
            : { head: "#f0d7c3", body: "#4d7bc0", limb: "#334d72" },
          isMerchant ? `${item.entity.name} Shop` : item.entity.name,
          isMerchant ? "merchant" : "human"
        );
      }
      if (item.kind === "animal") this.drawAnimalBillboard(item.entity);
      if (item.kind === "zombie") this.drawEntityBillboard(item.entity, { head: "#89b47b", body: "#3f6240", limb: "#2d4a2c" }, "Zombie", "zombie");
      if (item.kind === "explosion") this.drawExplosionBillboard(item.fx);
    });

    this.drawTargetOutline(this.raycastTarget());

    if (inWater) {
      c.fillStyle = "rgba(70,130,200,0.2)";
      c.fillRect(0, 0, cw, ch);
    }

    this.drawWeatherOverlay(cw, ch);

    c.strokeStyle = "rgba(255,255,255,0.92)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cw * 0.5 - 10, ch * 0.5);
    c.lineTo(cw * 0.5 + 10, ch * 0.5);
    c.moveTo(cw * 0.5, ch * 0.5 - 10);
    c.lineTo(cw * 0.5, ch * 0.5 + 10);
    c.stroke();

    const nearbyMerchant = this.getNearbyMerchant();
    if (nearbyMerchant) this.drawMerchantOverlay(nearbyMerchant, cw, ch);

    if (this.messageMs > 0 && this.message) {
      c.fillStyle = "rgba(10,16,26,0.75)";
      c.fillRect(14, 58, Math.min(560, cw - 28), 32);
      c.fillStyle = "#f2f7ff";
      c.font = "15px Trebuchet MS";
      c.fillText(this.message, 24, 79);
    }
  }

  drawMerchantOverlay(merchant, cw, ch) {
    const offers = merchant?.shop?.offers || [];
    if (!offers.length) return;
    const selected = this.clamp(merchant.shop.cursor, 0, 0, offers.length - 1);
    const c = this.ctx;
    const width = Math.min(480, cw - 36);
    const rowH = 18;
    const boxH = 80 + offers.length * rowH;
    const top = ch - boxH - 20;
    c.save();
    c.fillStyle = "rgba(10,16,26,0.74)";
    c.fillRect(18, top, width, boxH);
    c.fillStyle = "#f4f7ff";
    c.font = "bold 15px Trebuchet MS";
    c.fillText(`${merchant.name}'s ${merchant.shop.title}`, 30, top + 24);
    c.font = "13px Trebuchet MS";
    c.fillStyle = "rgba(218,231,247,0.92)";
    c.fillText("Open now. Press N to cycle offers and B to buy.", 30, top + 44);
    c.fillText("Blue ground pad marks the shop's private zone.", 30, top + 62);
    offers.forEach((offer, i) => {
      c.fillStyle = i === selected ? "#ffe08a" : "#dbe7f7";
      c.fillText(`${i === selected ? "> " : "  "}${this.describeShopOffer(offer)}`, 30, top + 84 + i * rowH);
    });
    c.restore();
  }

  renderFatal(err) {
    const c = this.ctx;
    const cw = this.canvas.clientWidth || window.innerWidth;
    const ch = this.canvas.clientHeight || window.innerHeight;
    c.clearRect(0, 0, cw, ch);
    c.fillStyle = "#0d1420";
    c.fillRect(0, 0, cw, ch);
    c.fillStyle = "#ff7d7d";
    c.font = "bold 18px Trebuchet MS";
    c.fillText("Runtime error", 20, 40);
    c.fillStyle = "#eaf2ff";
    c.font = "14px Trebuchet MS";
    c.fillText(String(err?.message || err || "Unknown error"), 20, 66);
    c.fillText("Hard refresh once (Ctrl+F5).", 20, 90);
  }

  say(text) {
    this.message = text;
    this.messageMs = 2400;
  }

  key(x, y, z) {
    return `${x},${y},${z}`;
  }

  parseKey(k) {
    const [x, y, z] = String(k).split(",").map((n) => Number(n));
    return { x, y, z };
  }

  hash01(v) {
    const n = Math.sin(v * 12.9898 + 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  clamp(v, fallback, min, max) {
    const n = Number.isFinite(v) ? v : fallback;
    return Math.max(min, Math.min(max, n));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore storage issues.
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
