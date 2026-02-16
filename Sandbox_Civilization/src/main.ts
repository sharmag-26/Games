// @ts-nocheck
import { SandboxCivilizationGame } from "./game/SandboxCivilizationRuntime.js?v=20260216-5";

const game = new SandboxCivilizationGame();
(window as any).__sandboxGame = game;
game.init();
