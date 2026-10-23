/* Runs before the real app in the isolated practice frame only. */
window.__imakokoTutorialDemo = true;
for (const name of ['localStorage', 'sessionStorage']) {
  const entries = new Map();
  Object.defineProperty(window, name, {value: {
    get length() { return entries.size; },
    key: index => [...entries.keys()][index] ?? null,
    getItem: key => entries.get(String(key)) ?? null,
    setItem: (key, value) => entries.set(String(key), String(value)),
    removeItem: key => entries.delete(String(key)), clear: () => entries.clear()
  }});
}
