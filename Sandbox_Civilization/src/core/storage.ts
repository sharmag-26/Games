// @ts-nocheck
export function loadState(storageKey, fallbackState) {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return structuredClone(fallbackState);

  try {
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallbackState);
  }
}

export function saveState(storageKey, state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function resetState(storageKey) {
  localStorage.removeItem(storageKey);
}