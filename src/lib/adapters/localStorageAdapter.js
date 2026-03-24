export function createLocalStorageAdapter(storage = window.localStorage) {
  return {
    get(key, fallback = null) {
      try {
        const value = storage.getItem(key);
        return value ?? fallback;
      } catch {
        return fallback;
      }
    },
    getJSON(key, fallback) {
      try {
        const value = storage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        storage.setItem(key, value);
      } catch {
        // Ignore storage failures in demo mode.
      }
    },
    setJSON(key, value) {
      this.set(key, JSON.stringify(value));
    },
    remove(key) {
      try {
        storage.removeItem(key);
      } catch {
        // Ignore storage failures in demo mode.
      }
    },
  };
}
