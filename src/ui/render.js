import {
  template5Day,
  templateAqi,
  templateCurrent,
  templateDetail,
  templateHourSlots,
  templateRecentList,
} from "./templates.js";

export function setLoading(el, on) {
  el.innerHTML = on
    ? `<div class="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">불러오는 중...</div>`
    : "";
}

export function renderCurrent(el, weather, localPlace) {
  el.innerHTML = templateCurrent(weather, localPlace || "알 수 없는 위치");
}

export function renderDetail(el, weather) {
  el.innerHTML = templateDetail(weather);
}

export function render5DayCard(el, days) {
  el.innerHTML = template5Day(days);
}

export function renderHourSlots(el, slots, tzOffset = 0) {
  if (!el) return;
  el.innerHTML = templateHourSlots(slots, tzOffset);
}

export function renderRecentList(ul, recents) {
  if (!ul) return;
  ul.innerHTML = templateRecentList(recents);
}

export function renderAqi(el, aqi) {
  el.innerHTML = templateAqi(aqi);
}
