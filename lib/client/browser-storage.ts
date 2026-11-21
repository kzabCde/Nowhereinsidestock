"use client";

const memory = new Map<string, string>();
const storageEvent = "nis:storage-change";

export function browserStorage(key: string) {
  return {
    read() {
      try { return window.localStorage.getItem(key) ?? memory.get(key) ?? null; }
      catch { return memory.get(key) ?? null; }
    },
    subscribe(listener: () => void) {
      const update = (event: Event) => {
        if (event instanceof StorageEvent ? event.key == null || event.key === key : (event as CustomEvent).detail === key) listener();
      };
      window.addEventListener("storage", update);
      window.addEventListener(storageEvent, update);
      return () => {
        window.removeEventListener("storage", update);
        window.removeEventListener(storageEvent, update);
      };
    },
    write(data: string) {
      try { window.localStorage.setItem(key, data); }
      catch { memory.set(key, data); }
      window.dispatchEvent(new CustomEvent(storageEvent, { detail: key }));
    }
  };
}
