import type { Position, Settings, VaultEntry } from "./types";

const POS_KEY = "mystocks:positions";
const SET_KEY = "mystocks:settings";
const VAULT_KEY = "mystocks:vault";
const VER_KEY = "mystocks:schema-version";
const CURRENT_VERSION = 1;

const isBrowser = () => typeof window !== "undefined";

export function loadPositions(): Position[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(POS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    return parsed as Position[];
  } catch (err) {
    const raw = window.localStorage.getItem(POS_KEY);
    if (raw) {
      window.localStorage.setItem(
        `${POS_KEY}.broken-${Date.now()}`,
        raw,
      );
    }
    console.warn("Corrupt positions data, starting fresh", err);
    return [];
  }
}

export function savePositions(positions: Position[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(POS_KEY, JSON.stringify(positions));
  window.localStorage.setItem(VER_KEY, String(CURRENT_VERSION));
}

const DEFAULT_SETTINGS: Settings = {
  autoSync: true,
  notificationsEnabled: false,
};

export function loadSettings(): Settings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SET_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SET_KEY, JSON.stringify(settings));
}

export function loadVault(): VaultEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(VAULT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VaultEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveVault(vault: VaultEntry[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}
