// @ts-nocheck
export class SceneSystem {
  constructor(game) {
    this.game = game;
    this.npcMotion = {};
    this.npcInsideBarnUntil = {};
  }

  playWidth() {
    return this.game.dom.plotsLayer.clientWidth || this.game.dom.garden.clientWidth || 1;
  }

  youPlotCenterX() {
    const bounds = this.game.plotBounds.you;
    if (!bounds) return 120;
    return (bounds.left + bounds.right) / 2;
  }

  keepPlayerInsideOwnPlot() {
    const bounds = this.game.plotBounds.you;
    if (!bounds) return;
    this.game.player.x = Math.max(bounds.left, Math.min(bounds.right, this.game.player.x));
    this.game.player.depth = Math.max(0, Math.min(1, this.game.player.depth));
  }

  applyPlayerMovementConstraints(previousX, previousDepth) {
    const width = this.playWidth();
    this.game.player.x = Math.max(0, Math.min(width, this.game.player.x));
    this.game.player.depth = Math.max(0, Math.min(1, this.game.player.depth));

    const bounds = this.game.plotBounds.you;
    const outsideOwnPlot = bounds && (this.game.player.x < bounds.left || this.game.player.x > bounds.right);
    if (outsideOwnPlot) {
      this.game.player.x = previousX;
      this.game.player.depth = previousDepth;
      return true;
    }
    return false;
  }

  renderPlayer() {
    const top = this.yForDepth(this.game.player.depth);
    const scale = Math.max(0.48, Math.min(1.28, 0.55 + this.game.player.depth * 0.55));
    this.game.dom.playerAvatar.style.left = `${this.game.player.x}px`;
    this.game.dom.playerAvatar.style.top = `${top}px`;
    this.game.dom.playerAvatar.style.setProperty("--scale", scale.toFixed(3));
    this.game.dom.playerAvatar.style.setProperty("--face", String(this.game.player.facing || 1));

    const xParallax = (this.game.player.x / this.playWidth() - 0.5) * 10;
    const yParallax = (this.game.player.depth - 0.5) * 8;
    this.game.dom.garden.style.backgroundPosition = `${50 + xParallax}% ${50 + yParallax}%`;

    this.game.dom.playerAvatar.classList.toggle("walking", this.game.player.moving);
  }

  buildGardenScene() {
    this.game.dom.plotsLayer.innerHTML = "";
    this.game.dom.gardenersLayer.innerHTML = "";

    const playWidth = this.playWidth();
    const section = 100 / this.game.gardenerIds.length;

    this.game.gardenerIds.forEach((id, index) => {
      const widthPct = section;
      const leftPct = index * section;
      const centerPct = leftPct + widthPct / 2;

      this.game.plotBounds[id] = {
        left: (leftPct / 100) * playWidth,
        right: ((leftPct + widthPct) / 100) * playWidth
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

      const barn = document.createElement("div");
      barn.className = `plot-barn${id === "you" ? " own" : ""}`;
      barn.dataset.owner = id;
      barn.style.left = `${leftPct + widthPct * 0.78}%`;
      barn.innerHTML = `<div class='roof'></div><div class='wall'></div><div class='door'></div><div class='sign'>${this.game.gardenersMeta[id].name}</div>`;
      this.game.dom.plotsLayer.appendChild(barn);

      if (id !== "you") {
        const gardener = document.createElement("div");
        gardener.className = "gardener";
        gardener.dataset.id = id;
        gardener.style.left = `${centerPct}%`;
        gardener.style.zIndex = "8";
        gardener.innerHTML = `<div class='hat'></div><div class='head'></div><div class='body'></div><div class='arm left'></div><div class='arm right'></div><div class='tool'></div><div class='tag'>${this.game.gardenersMeta[id].name}</div>`;
        this.game.dom.gardenersLayer.appendChild(gardener);
      }
    });

    this.initNpcMotion();
    if (!this.game.player.x || this.game.player.x < 1) this.game.player.x = this.youPlotCenterX();
    this.keepPlayerInsideOwnPlot();
    this.renderPlayer();
  }

  getBarnX(ownerId) {
    const barn = this.game.dom.plotsLayer.querySelector(`.plot-barn[data-owner="${ownerId}"]`);
    if (!barn) return null;
    const pct = parseFloat(barn.style.left || "0");
    return (pct / 100) * this.playWidth();
  }

  yForDepth(depth) {
    const gardenHeight = this.game.dom.garden.clientHeight || 700;
    const topPad = gardenHeight * 0.07;
    const bottomPad = gardenHeight * 0.09;
    const usable = Math.max(1, gardenHeight - topPad - bottomPad);
    return topPad + depth * usable;
  }

  depthFromLocalY(localY) {
    const gardenHeight = this.game.dom.garden.clientHeight || 700;
    const topPad = gardenHeight * 0.07;
    const bottomPad = gardenHeight * 0.09;
    const usable = Math.max(1, gardenHeight - topPad - bottomPad);
    return Math.max(0, Math.min(1, (localY - topPad) / usable));
  }

  isNpcInsideBarn(ownerId) {
    return (this.npcInsideBarnUntil[ownerId] || 0) > Date.now();
  }

  sendNpcInsideBarn(ownerId, durationMs = 1800, onReturn = null) {
    if (this.isNpcInsideBarn(ownerId)) return false;

    const npc = this.game.dom.gardenersLayer.querySelector(`.gardener[data-id="${ownerId}"]`);
    const barn = this.game.dom.plotsLayer.querySelector(`.plot-barn[data-owner="${ownerId}"]`);
    if (!npc || !barn) return false;

    const until = Date.now() + durationMs;
    this.npcInsideBarnUntil[ownerId] = until;
    npc.classList.add("inside-barn");
    barn.classList.add("busy");

    if (this.npcMotion[ownerId]) {
      const barnX = this.getBarnX(ownerId);
      if (barnX != null) this.npcMotion[ownerId].x = barnX;
      this.npcMotion[ownerId].depth = 0.18;
    }

    setTimeout(() => {
      if ((this.npcInsideBarnUntil[ownerId] || 0) > Date.now()) return;
      npc.classList.remove("inside-barn");
      barn.classList.remove("busy");
      if (typeof onReturn === "function") onReturn();
    }, durationMs + 30);

    return true;
  }

  ownerForX(x) {
    return this.game.gardenerIds.find((id) => x >= this.game.plotBounds[id].left && x <= this.game.plotBounds[id].right) || null;
  }

  getRandomXForOwner(ownerId) {
    const bounds = this.game.plotBounds[ownerId];
    if (!bounds) return 50;
    return bounds.left + 30 + Math.random() * Math.max(10, bounds.right - bounds.left - 60);
  }

  initNpcMotion() {
    this.npcMotion = {};
    const npcEls = this.game.dom.gardenersLayer.querySelectorAll(".gardener");
    npcEls.forEach((el) => {
      const id = el.dataset.id;
      if (!id || !this.game.plotBounds[id]) return;

      const bounds = this.game.plotBounds[id];
      const width = this.playWidth();
      const currentPct = parseFloat(el.style.left || "0");
      const currentPx = (currentPct / 100) * width;
      const directionX = Math.random() > 0.5 ? 1 : -1;
      const directionDepth = Math.random() > 0.5 ? 1 : -1;
      this.npcMotion[id] = {
        x: currentPx,
        depth: 0.35 + Math.random() * 0.45,
        speedX: 20 + Math.random() * 24,
        speedDepth: 0.16 + Math.random() * 0.22,
        pauseMs: Math.random() * 800,
        targetX: null,
        targetDepth: null,
        pendingPlant: null,
        busyUntil: 0,
        directionX,
        directionDepth
      };
    });
  }

  queueNpcMoveTo(ownerId, x, depth, pendingPlant = null) {
    const motion = this.npcMotion[ownerId];
    if (!motion) return;
    motion.targetX = x;
    motion.targetDepth = depth;
    motion.pendingPlant = pendingPlant;
  }

  npcHasPendingTarget(ownerId) {
    const motion = this.npcMotion[ownerId];
    if (!motion) return false;
    return (
      typeof motion.targetX === "number" ||
      typeof motion.targetDepth === "number" ||
      !!motion.pendingPlant ||
      (motion.busyUntil || 0) > Date.now() ||
      this.isNpcInsideBarn(ownerId)
    );
  }

  getNpcMotion(ownerId) {
    return this.npcMotion[ownerId] || null;
  }

  updateNpcMotion(dt) {
    const width = this.playWidth();
    const gardenHeight = this.game.dom.garden.clientHeight || 700;
    const npcEls = this.game.dom.gardenersLayer.querySelectorAll(".gardener");
    const now = Date.now();

    npcEls.forEach((el) => {
      const id = el.dataset.id;
      if (!id || !this.game.plotBounds[id] || !this.npcMotion[id]) return;
      if ((this.npcInsideBarnUntil[id] || 0) > now) return;

      const bounds = this.game.plotBounds[id];
      const pad = 26;
      const left = bounds.left + pad;
      const right = bounds.right - pad;
      const nearDepth = 0.04;
      const farDepth = 0.98;
      const motion = this.npcMotion[id];
      if ((motion.busyUntil || 0) <= now && typeof motion.targetX === "number" && typeof motion.targetDepth === "number") {
        const dx = motion.targetX - motion.x;
        const dd = motion.targetDepth - motion.depth;
        const reached = Math.abs(dx) < 8 && Math.abs(dd) < 0.03;
        if (!reached) {
          motion.directionX = dx >= 0 ? 1 : -1;
          motion.directionDepth = dd >= 0 ? 1 : -1;
          motion.x += Math.sign(dx) * Math.min(Math.abs(dx), motion.speedX * 1.55 * dt);
          motion.depth += Math.sign(dd) * Math.min(Math.abs(dd), motion.speedDepth * 1.5 * dt);
        } else {
          if (motion.pendingPlant) {
            const plan = motion.pendingPlant;
            motion.pendingPlant = null;
            motion.busyUntil = Date.now() + 700;
            el.classList.add("planting");
            setTimeout(() => {
              if (!el.isConnected)
                return;
              this.game.growth.plantSeed(plan.ownerId, plan.seed, plan.x, plan.depth);
              el.classList.remove("planting");
            }, 700);
          }
          motion.targetX = null;
          motion.targetDepth = null;
          motion.pauseMs = 260 + Math.random() * 420;
        }
      } else if ((motion.busyUntil || 0) <= now) {
      motion.pauseMs = Math.max(0, (motion.pauseMs || 0) - dt * 1000);
      if (motion.pauseMs > 0) {
        if (Math.random() < 0.02) motion.directionX *= -1;
        return;
      }

      motion.x += motion.speedX * motion.directionX * dt;
      motion.depth += motion.speedDepth * motion.directionDepth * dt;
      }

      if (motion.x < left) {
        motion.x = left;
        motion.directionX = 1;
        motion.pauseMs = 350 + Math.random() * 550;
      } else if (motion.x > right) {
        motion.x = right;
        motion.directionX = -1;
        motion.pauseMs = 350 + Math.random() * 550;
      }

      if (motion.depth < nearDepth) {
        motion.depth = nearDepth;
        motion.directionDepth = 1;
      } else if (motion.depth > farDepth) {
        motion.depth = farDepth;
        motion.directionDepth = -1;
      }

      const pct = (motion.x / width) * 100;
      const bottomPx = gardenHeight * 0.017 + motion.depth * gardenHeight * 0.106;
      const scale = 0.78 + motion.depth * 0.36;

      el.style.left = `${pct}%`;
      el.style.bottom = `${bottomPx}px`;
      el.style.setProperty("--dir", motion.directionX >= 0 ? "1" : "-1");
      el.style.transform = `translateX(-50%) scaleX(var(--dir)) scale(${scale.toFixed(3)})`;
      el.classList.add("moving");
    });
  }
}
