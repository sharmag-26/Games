// @ts-nocheck
export const STORAGE_KEY = "flower_garden_state_v5";
export const ROUND_SECONDS = 90;
export const PLAYER_SPEED_X = 230;
export const PLAYER_SPEED_DEPTH = 0.95;
export const seedTypes = {
    rose: { icon: "R", bloomClass: "bloom-rose", cost: 5, growTime: 8, payout: 7 },
    tulip: { icon: "T", bloomClass: "bloom-tulip", cost: 4, growTime: 6, payout: 5 },
    sunflower: { icon: "S", bloomClass: "bloom-sunflower", cost: 8, growTime: 10, payout: 10 }
};
export const gardenersMeta = {
    you: { name: "You", role: "Lead Gardener" },
    luna: { name: "Luna", role: "Herb Specialist" },
    maya: { name: "Maya", role: "Soil Specialist" },
    iris: { name: "Iris", role: "Seed Keeper" },
    zara: { name: "Zara", role: "Bloom Expert" },
    noor: { name: "Noor", role: "Compost Expert" },
    rhea: { name: "Rhea", role: "Irrigation Keeper" }
};
export const initialState = {
    level: 1,
    bestLevel: 1,
    gardeners: {
        you: { coins: 20, seeds: { rose: 2, tulip: 2, sunflower: 1 } },
        luna: { coins: 14, seeds: { rose: 3, tulip: 1, sunflower: 1 } },
        maya: { coins: 16, seeds: { rose: 1, tulip: 3, sunflower: 0 } },
        iris: { coins: 15, seeds: { rose: 2, tulip: 2, sunflower: 2 } },
        zara: { coins: 18, seeds: { rose: 1, tulip: 2, sunflower: 2 } },
        noor: { coins: 17, seeds: { rose: 2, tulip: 1, sunflower: 1 } },
        rhea: { coins: 13, seeds: { rose: 1, tulip: 3, sunflower: 1 } }
    }
};
//# sourceMappingURL=gameConfig.js.map