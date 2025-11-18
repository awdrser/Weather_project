import { template5Day, templateCurrent, templateDetail } from "./templates.js";

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

export function renderRecentList(ul, recents) {
  if (!ul) return;
  ul.innerHTML = recents.length
    ? recents
        .map(
          (q) => `<li>
      <button class="block w-full text-left px-3 py-2 rounded hover:bg-neutral-100" onclick="window.__searchRecent('${q}')">
        <span class="flex gap-5 "><img class="w-5 h-5 translate-y-0.5" src="./src/svg/search-left.svg"> ${q}</span>
      </button>
    </li>`
        )
        .join("")
    : `<li class="text-neutral-400 px-3 py-2">최근 검색 없음</li>`;
}
