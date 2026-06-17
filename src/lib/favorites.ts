import { useSyncExternalStore, useCallback } from "react";

export type FavoriteKind = "enterprise" | "contact" | "product" | "bill";

export interface FavoritePayload {
  title: string;
  subtitle?: string;
  meta?: Record<string, string>;
  parentRef?: { kind: "enterprise"; id: string; name: string };
}

export interface FavoriteRecord extends FavoritePayload {
  id: string; // `${kind}:${refId}`
  kind: FavoriteKind;
  refId: string;
  createdAt: string; // ISO
}

const STORAGE_KEY = "boo:favorites:v1";

function readStore(): Record<string, FavoriteRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return {};
}

function writeStore(s: Record<string, FavoriteRecord>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

let store: Record<string, FavoriteRecord> = readStore();
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      store = readStore();
      emit();
    }
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getVersion() {
  return version;
}

function makeKey(kind: FavoriteKind, refId: string) {
  return `${kind}:${refId}`;
}

export function isFavorited(kind: FavoriteKind, refId: string): boolean {
  return !!store[makeKey(kind, refId)];
}

export function toggleFavorite(
  kind: FavoriteKind,
  refId: string,
  payload: FavoritePayload,
): boolean {
  const key = makeKey(kind, refId);
  const next = { ...store };
  if (next[key]) {
    delete next[key];
    store = next;
    writeStore(store);
    emit();
    return false;
  }
  next[key] = {
    id: key,
    kind,
    refId,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  store = next;
  writeStore(store);
  emit();
  return true;
}

export function removeFavorite(kind: FavoriteKind, refId: string) {
  const key = makeKey(kind, refId);
  if (!store[key]) return;
  const next = { ...store };
  delete next[key];
  store = next;
  writeStore(store);
  emit();
}

export function removeFavoritesByIds(ids: string[]) {
  if (ids.length === 0) return;
  const next = { ...store };
  let changed = false;
  for (const id of ids) {
    if (next[id]) {
      delete next[id];
      changed = true;
    }
  }
  if (changed) {
    store = next;
    writeStore(store);
    emit();
  }
}

export function getAllFavorites(): FavoriteRecord[] {
  return Object.values(store).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export function useFavorites(): FavoriteRecord[] {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return getAllFavorites();
}

export function useFavorite(
  kind: FavoriteKind,
  refId: string,
  payload: FavoritePayload,
) {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  const favored = isFavorited(kind, refId);
  const toggle = useCallback(() => {
    toggleFavorite(kind, refId, payload);
    // payload is referenced by caller; if it changes ad-hoc that's fine
  }, [kind, refId, payload]);
  return { favored, toggle };
}

export const FAVORITE_KIND_LABEL: Record<FavoriteKind, string> = {
  enterprise: "企业",
  contact: "人物",
  bill: "提单",
  product: "商品",
};