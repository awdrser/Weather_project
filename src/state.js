export const state = {
  unit: "metric",
  lang: "kr",
  lastQuery: "",
};

export function setUnit(u) {
  state.unit = u;
}
export function setLastQuery(q) {
  state.lastQuery = q;
}

const KEY = "weather:recent";

export function loadRecents() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecent(query) {
  let recents = loadRecents().filter((q) => q !== query);
  recents.unshift(query);
  if (recents.length > 5) recents = recents.slice(0, 5);
  localStorage.setItem(KEY, JSON.stringify(recents));
}
