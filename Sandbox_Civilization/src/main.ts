// @ts-nocheck
const wireBasicUiFallback = () => {
  const invBtn = document.getElementById("inventoryToggleBtn");
  const invPanel = document.getElementById("inventoryPanel");
  const fsBtn = document.getElementById("fullscreenBtn");
  invBtn?.addEventListener("click", () => {
    invPanel?.classList.toggle("hidden");
  });
  fsBtn?.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  });
};

const drawFallbackScene = (msg: string) => {
  const canvas = document.getElementById("worldCanvas") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#8ec3f5");
  g.addColorStop(1, "#4d79a8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let y = 0; y < 12; y += 1) {
    for (let x = 0; x < 18; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#66a854" : "#5a9549";
      ctx.fillRect(x * 48, h - 300 + y * 24, 50, 26);
    }
  }

  ctx.fillStyle = "rgba(10,16,26,0.76)";
  ctx.fillRect(14, 58, Math.min(900, w - 28), 62);
  ctx.fillStyle = "#f1f7ff";
  ctx.font = "15px Trebuchet MS";
  ctx.fillText("Runtime load issue. Basic fallback mode is active.", 24, 83);
  ctx.fillText(msg.slice(0, 120), 24, 106);
};

(async () => {
  try {
    const mod = await import("./game/SandboxCivilizationRuntime.js?v=20260312-smooth-move4");
    const game = new mod.SandboxCivilizationGame();
    (window as any).__sandboxGame = game;
    game.init();
  } catch (err: any) {
    wireBasicUiFallback();
    const worldText = document.getElementById("worldText");
    if (worldText) worldText.textContent = "Boot Error";
    drawFallbackScene(String(err?.message || err || "Unknown error"));
  }
})();
