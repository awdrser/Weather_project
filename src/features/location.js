import { fetch5Day, fetchCurrent, reverseGeo } from "../api.js";
import { mountCityAqi } from "../aqi.js";
import { loadRecents, saveRecent, state } from "../state.js";
import {
  render5DayCard,
  renderCurrent,
  renderDetail,
  renderRecentList,
  setLoading,
} from "../ui/render.js";
import { normalizeIcon } from "../utils.js";

function computeDailyFromForecast(data) {
  // 필요 시 공통화: 중복이면 /features/shared.js 로 이동
  const byDay = new Map();
  for (const it of data.list) {
    const key = new Date(it.dt * 1000).toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(it);
  }
  const todayKey = new Date().toISOString().slice(0, 10);
  const keys = Array.from(byDay.keys()).sort();
  const future = keys.filter((k) => k > todayKey).slice(0, 5);
  return future.map((k) => {
    const items = byDay.get(k);
    let tmin = Infinity,
      tmax = -Infinity;
    const iconCount = {};
    let noonItem = null;
    for (const it of items) {
      const t = it.main.temp;
      if (t < tmin) tmin = t;
      if (t > tmax) tmax = t;
      const ic = it.weather[0]?.icon ?? "01d";
      iconCount[ic] = (iconCount[ic] ?? 0) + 1;
      const h = new Date(it.dt * 1000).getHours();
      if (h === 12) noonItem = it;
    }
    let icon =
      noonItem?.weather?.[0]?.icon ??
      Object.entries(iconCount).sort((a, b) => b[1] - a[1])[0][0];
    icon = normalizeIcon(icon);
    return {
      date: k,
      min: Math.round(tmin),
      max: Math.round(tmax),
      icon,
      desc: noonItem?.weather?.[0]?.description ?? "",
    };
  });
}

export async function renderByCoord(lat, lon) {
  const current = document.querySelector("#current-card");
  const detail = document.querySelector("#detail-card");
  const daysCard = document.querySelector("#days-card");
  const aqiContainer = document.querySelector("#city-aqi-container");
  if (!current) return;

  try {
    setLoading(current, true);
    if (detail) setLoading(detail, true);
    if (daysCard) setLoading(daysCard, true);
    if (aqiContainer) setLoading(aqiContainer, true);

    const rev = await reverseGeo(lat, lon);
    const localPlace = rev.localPlace || "";
    const placeEnName = rev.placeEnName || "";

    const weather = await fetchCurrent(lat, lon);
    renderCurrent(current, weather, localPlace || "알 수 없는 위치");
    if (detail) renderDetail(detail, weather);

    if (daysCard) {
      const forecast = await fetch5Day(lat, lon);
      const days = computeDailyFromForecast(forecast);
      render5DayCard(daysCard, days);
    }

    if (aqiContainer) {
      await mountCityAqi({
        city: placeEnName,
        lang: "kr",
        containerId: "city-aqi-container",
      });
    }

    if (localPlace) {
      saveRecent(localPlace);
      renderRecentList(document.getElementById("recent-list"), loadRecents());
      state.lastQuery = localPlace;
    }
  } catch (e) {
    const err = `<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">오류: ${e.message}</div>`;
    current.innerHTML = err;
    if (detail) detail.innerHTML = err;
    if (daysCard) daysCard.innerHTML = err;
  }
}
