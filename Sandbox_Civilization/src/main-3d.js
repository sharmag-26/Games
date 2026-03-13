(async () => {
  const bootFail = (err) => {
    const world = document.getElementById("worldText");
    const help = document.querySelector(".help-strip");
    if (world) world.textContent = "Boot Error";
    if (help) help.textContent = `3D startup failed: ${String(err?.message || err || "Unknown error")}`;
  };

  try {
    const THREE = await import("../node_modules/three/build/three.module.js");

    const canvas = document.getElementById("worldCanvas");
    if (!canvas) throw new Error("Missing #worldCanvas");

    const ui = {
      worldText: document.getElementById("worldText"),
      peopleText: document.getElementById("peopleText"),
      zombieText: document.getElementById("zombieText"),
      selectedText: document.getElementById("selectedText"),
      inventoryToggleBtn: document.getElementById("inventoryToggleBtn"),
      fullscreenBtn: document.getElementById("fullscreenBtn"),
      inventoryPanel: document.getElementById("inventoryPanel"),
      blockSelect: document.getElementById("blockSelect"),
      inventoryItems: document.getElementById("inventoryItems"),
      inventoryStats: document.getElementById("inventoryStats"),
      convertImportedBtn: document.getElementById("convertImportedBtn"),
      helpStrip: document.querySelector(".help-strip")
    };

    const ENGINE_VERSION = "3D-r23-forced";
    const BLOCK_ORDER = ["wood", "stone", "metal", "tnt", "fire"];
    const BLOCK_LABEL = { wood: "Wood", stone: "Stone", metal: "Metal", tnt: "TNT", fire: "Fire" };
    const PEOPLE_COUNT = 20;
    const ANIMAL_COUNT = 12;
    const ZOMBIE_COUNT = 10;
    const WORLD_RADIUS = 44;
    const SEA_LEVEL = 2;

    const state = {
      seed: Math.floor(Math.random() * 9999999),
      worldIndex: 1,
      worldName: "Unknown",
      selected: "wood",
      inventoryOpen: false,
      inventory: { wood: 24, stone: 30, metal: 14, tnt: 5, fire: 999 },
      imported: { wood: 0, stone: 0, metal: 0, tnt: 0 },
      keys: {},
      playerPos: new THREE.Vector3(0.5, 8, 0.5),
      playerVel: new THREE.Vector2(0, 0),
      people: [],
      animals: [],
      zombies: [],
      blocks: 0,
      lastTs: performance.now()
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8db9e5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1200);

    scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x4c5e44, 1.05));
    const sun = new THREE.DirectionalLight(0xffffff, 0.95);
    sun.position.set(50, 80, 20);
    scene.add(sun);

    const hash = (x, z) => {
      const n = Math.sin(x * 127.1 + z * 311.7 + state.seed * 0.17) * 43758.5453;
      return n - Math.floor(n);
    };

    const terrainH = (x, z) => {
      const hills = Math.sin(x * 0.14) * 2.5 + Math.cos(z * 0.12) * 2.1 + Math.sin((x + z) * 0.05) * 1.7;
      const basin = (Math.hypot(x, z) > 30) ? -2.2 : 0;
      return Math.floor(hills + 4 + basin);
    };

    const getTop = (x, z) => Math.max(terrainH(x, z), SEA_LEVEL);

    const terrainGroup = new THREE.Group();
    const entsGroup = new THREE.Group();
    scene.add(terrainGroup);
    scene.add(entsGroup);

    const gBox = new THREE.BoxGeometry(1, 1, 1);
    const mGrass = new THREE.MeshLambertMaterial({ color: 0x60a950 });
    const mDirt = new THREE.MeshLambertMaterial({ color: 0x7c5a3a });
    const mStone = new THREE.MeshLambertMaterial({ color: 0x8b939d });
    const mWater = new THREE.MeshLambertMaterial({ color: 0x2c5ea8, transparent: true, opacity: 0.68 });

    const placeCube = (x, y, z, mat) => {
      const m = new THREE.Mesh(gBox, mat);
      m.position.set(x + 0.5, y + 0.5, z + 0.5);
      terrainGroup.add(m);
      state.blocks += 1;
    };

    const buildWorld = () => {
      terrainGroup.clear();
      entsGroup.clear();
      state.people = [];
      state.animals = [];
      state.zombies = [];
      state.blocks = 0;
      state.worldName = `Unknown-${(state.seed % 9000) + 1000}`;

      for (let x = -WORLD_RADIUS; x <= WORLD_RADIUS; x += 1) {
        for (let z = -WORLD_RADIUS; z <= WORLD_RADIUS; z += 1) {
          const h = terrainH(x, z);
          const base = Math.max(-2, h - 2);
          for (let y = base; y < h; y += 1) {
            placeCube(x, y, z, y < h - 1 ? mStone : mDirt);
          }
          placeCube(x, h, z, mGrass);
          if (h < SEA_LEVEL) {
            for (let y = h + 1; y <= SEA_LEVEL; y += 1) placeCube(x, y, z, mWater);
          }
        }
      }

      // Hard fallback layers that are always visible, even if block terrain fails visually.
      const oceanPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(220, 220),
        new THREE.MeshBasicMaterial({ color: 0x1f4f8d })
      );
      oceanPlane.rotation.x = -Math.PI / 2;
      oceanPlane.position.y = SEA_LEVEL + 0.9;
      terrainGroup.add(oceanPlane);

      const landPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(70, 70),
        new THREE.MeshBasicMaterial({ color: 0x4f9a3f })
      );
      landPlane.rotation.x = -Math.PI / 2;
      landPlane.position.y = SEA_LEVEL + 5.02;
      terrainGroup.add(landPlane);

      // Guaranteed visible starter land: large elevated island so first view is never all-blue.
      const ISLAND_TOP = SEA_LEVEL + 5;
      for (let x = -14; x <= 14; x += 1) {
        for (let z = -14; z <= 14; z += 1) {
          const d = Math.hypot(x, z);
          if (d > 14.2) continue;
          placeCube(x, ISLAND_TOP - 1, z, mDirt);
          placeCube(x, ISLAND_TOP, z, mGrass);
        }
      }

      const findSpawn = () => {
        for (let r = 0; r <= 20; r += 1) {
          for (let x = -r; x <= r; x += 1) {
            for (let z = -r; z <= r; z += 1) {
              if (Math.abs(x) !== r && Math.abs(z) !== r) continue;
              if (terrainH(x, z) >= SEA_LEVEL + 1) return { x: x + 0.5, z: z + 0.5 };
            }
          }
        }
        return { x: 0.5, z: 0.5 };
      };

      const spawn = findSpawn();
      state.playerPos.set(0.5, ISLAND_TOP + 1.72, 0.5);

      const mkEntity = (color, sx, sz, yOff = 1.05) => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 4, 8), new THREE.MeshLambertMaterial({ color }));
        body.position.y = yOff;
        g.add(body);
        entsGroup.add(g);
        return { group: g, x: sx, z: sz, dir: Math.random() * Math.PI * 2, timer: 0.8 + Math.random() * 2.6, speed: 0.8 + Math.random() * 0.6 };
      };

      for (let i = 0; i < PEOPLE_COUNT; i += 1) {
        const a = (Math.PI * 2 * i) / PEOPLE_COUNT;
        const r = 6 + (i % 6) * 2.2;
        state.people.push(mkEntity(0x3e73b2, Math.cos(a) * r, Math.sin(a) * r));
      }
      for (let i = 0; i < ANIMAL_COUNT; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const r = 4 + Math.random() * 10;
        state.animals.push(mkEntity(0xdfe8f2, Math.cos(a) * r, Math.sin(a) * r, 0.8));
      }
      for (let i = 0; i < ZOMBIE_COUNT; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * 7;
        state.zombies.push(mkEntity(0x4f7f4a, Math.cos(a) * r, Math.sin(a) * r));
      }

      // Visible player marker in third-person mode.
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 2.2, 14),
        new THREE.MeshBasicMaterial({ color: 0xffd84a, depthTest: false })
      );
      marker.name = "playerMarker";
      marker.renderOrder = 9999;
      entsGroup.add(marker);
    };

    const updateEntities = (arr, dt) => {
      arr.forEach((e) => {
        e.timer -= dt;
        if (e.timer <= 0) {
          e.dir = Math.random() * Math.PI * 2;
          e.timer = 0.9 + Math.random() * 2.3;
        }
        e.x += Math.cos(e.dir) * e.speed * dt;
        e.z += Math.sin(e.dir) * e.speed * dt;
        e.x = Math.max(-WORLD_RADIUS + 2, Math.min(WORLD_RADIUS - 2, e.x));
        e.z = Math.max(-WORLD_RADIUS + 2, Math.min(WORLD_RADIUS - 2, e.z));
        const y = getTop(Math.floor(e.x), Math.floor(e.z));
        e.group.position.set(e.x + 0.5, y + 0.02, e.z + 0.5);
      });
    };

    const syncUi = () => {
      if (ui.worldText) ui.worldText.textContent = `World ${state.worldIndex} (${state.worldName})`;
      if (ui.peopleText) ui.peopleText.textContent = `People: ${state.people.length}/${PEOPLE_COUNT}`;
      if (ui.zombieText) ui.zombieText.textContent = `Zombies: ${state.zombies.length}`;
      if (ui.selectedText) ui.selectedText.textContent = `Selected: ${BLOCK_LABEL[state.selected] || "Wood"}`;
      if (ui.inventoryPanel) ui.inventoryPanel.classList.toggle("hidden", !state.inventoryOpen);

      if (ui.blockSelect && ui.blockSelect.options.length === 0) {
        ui.blockSelect.innerHTML = BLOCK_ORDER.map((k) => `<option value="${k}">${BLOCK_LABEL[k]}</option>`).join("");
        ui.blockSelect.addEventListener("change", () => {
          state.selected = String(ui.blockSelect.value || "wood");
          syncUi();
        });
      }
      if (ui.blockSelect) ui.blockSelect.value = state.selected;

      if (ui.inventoryItems) {
        ui.inventoryItems.innerHTML = BLOCK_ORDER.map((k) => {
          const n = k === "fire" ? "inf" : Math.floor(state.inventory[k] || 0);
          return `<button class="inventory-item ${state.selected === k ? "active" : ""}" data-block="${k}">${BLOCK_LABEL[k]}<br><small>${n}</small></button>`;
        }).join("");
        ui.inventoryItems.querySelectorAll("[data-block]").forEach((el) => {
          el.addEventListener("click", () => {
            state.selected = String(el.getAttribute("data-block") || "wood");
            syncUi();
          });
        });
      }

      if (ui.inventoryStats) {
        ui.inventoryStats.innerHTML = [
          `Wood: ${Math.floor(state.inventory.wood)}`,
          `Stone: ${Math.floor(state.inventory.stone)}`,
          `Metal: ${Math.floor(state.inventory.metal)}`,
          `TNT: ${Math.floor(state.inventory.tnt)}`,
          `Imported Wood: ${Math.floor(state.imported.wood)}`,
          `Imported Stone: ${Math.floor(state.imported.stone)}`,
          `Imported Metal: ${Math.floor(state.imported.metal)}`,
          `Imported TNT: ${Math.floor(state.imported.tnt)}`,
          "Fire: Infinite"
        ].join("<br>");
      }
    };

    window.addEventListener("keydown", (e) => {
      const k = String(e.key || "").toLowerCase();
      state.keys[k] = true;
      if (k === "e") {
        state.inventoryOpen = !state.inventoryOpen;
        syncUi();
      }
      if (k >= "1" && k <= "5") {
        state.selected = BLOCK_ORDER[Number(k) - 1];
        syncUi();
      }
    });
    window.addEventListener("keyup", (e) => {
      state.keys[String(e.key || "").toLowerCase()] = false;
    });

    ui.inventoryToggleBtn?.addEventListener("click", () => {
      state.inventoryOpen = !state.inventoryOpen;
      syncUi();
    });
    ui.fullscreenBtn?.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.();
    });
    ui.convertImportedBtn?.addEventListener("click", () => {
      state.inventory.wood += state.imported.wood;
      state.inventory.stone += state.imported.stone;
      state.inventory.metal += state.imported.metal;
      state.inventory.tnt += state.imported.tnt;
      state.imported.wood = 0;
      state.imported.stone = 0;
      state.imported.metal = 0;
      state.imported.tnt = 0;
      syncUi();
    });

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    buildWorld();
    syncUi();
    if (ui.helpStrip) ui.helpStrip.textContent = `Engine ${ENGINE_VERSION} | Stable world mode | Terrain/Ocean/People/Animals/Zombies guaranteed`;

    const animate = (ts) => {
      const dt = Math.min(0.05, (ts - state.lastTs) / 1000);
      state.lastTs = ts;

      const speed = state.keys["shift"] ? 9.5 : 6.5;
      let f = Number(state.keys["w"] || state.keys["arrowup"]) - Number(state.keys["s"] || state.keys["arrowdown"]);
      let r = Number(state.keys["d"] || state.keys["arrowright"]) - Number(state.keys["a"] || state.keys["arrowleft"]);
      const len = Math.hypot(f, r) || 1;
      f /= len;
      r /= len;

      const targetVx = (r - f) * speed * 0.707;
      const targetVz = (r + f) * speed * 0.707;
      const ease = Math.min(1, dt * 10);
      state.playerVel.x += (targetVx - state.playerVel.x) * ease;
      state.playerVel.y += (targetVz - state.playerVel.y) * ease;
      state.playerPos.x += state.playerVel.x * dt;
      state.playerPos.z += state.playerVel.y * dt;
      state.playerPos.x = Math.max(-WORLD_RADIUS + 2, Math.min(WORLD_RADIUS - 2, state.playerPos.x));
      state.playerPos.z = Math.max(-WORLD_RADIUS + 2, Math.min(WORLD_RADIUS - 2, state.playerPos.z));
      state.playerPos.y = getTop(Math.floor(state.playerPos.x), Math.floor(state.playerPos.z)) + 1.72;

      updateEntities(state.people, dt);
      updateEntities(state.animals, dt);
      updateEntities(state.zombies, dt);

      const marker = entsGroup.getObjectByName("playerMarker");
      if (marker) marker.position.set(state.playerPos.x, state.playerPos.y - 0.55, state.playerPos.z);

      camera.position.set(state.playerPos.x + 28, state.playerPos.y + 20, state.playerPos.z + 28);
      camera.lookAt(state.playerPos.x, state.playerPos.y + 3, state.playerPos.z);

      if (ui.helpStrip) {
        ui.helpStrip.textContent = `Engine ${ENGINE_VERSION} | Calls: ${renderer.info.render.calls} | Blocks: ${state.blocks} | People: ${state.people.length} | Animals: ${state.animals.length} | Zombies: ${state.zombies.length} | Ground`;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  } catch (err) {
    bootFail(err);
  }
})();
