import { useSyncExternalStore } from "react";

/** Which dark store the customer is currently shopping from — same lightweight localStorage-persistence idiom as the session/token. */
const KEY = "customer_selected_store";
const listeners = new Set<() => void>();

function read(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setSelectedStoreId(storeId: string | null) {
  if (storeId) localStorage.setItem(KEY, storeId);
  else localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function useSelectedStoreId(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
}
