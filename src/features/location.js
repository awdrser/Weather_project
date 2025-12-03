import { fetch5Day, fetchAqi, fetchCurrent, reverseGeo } from "../api.js";
import { loadRecents, saveRecent, state } from "../state.js";
import {
  render3HourSlots,
  render5DayCard,
  renderAqi,
  renderCurrent,
  renderDetail,
  renderRecentList,
  setLoading,
} from "../ui/render.js";
import {
  computeDailyFromForecast,
  computeSlotsFromForecast,
} from "../utils.js";

// 현재 위치 기반 렌더링
export async function renderByCoord(lat, lon) {
  const current = document.querySelector("#current-card");
  const detail = document.querySelector("#detail-card");
  const daysCard = document.querySelector("#days-card");
  const hourlyCard = document.querySelector("#hourly-card");
  const aqiContainer = document.querySelector("#city-aqi-container");
  if (!current || !daysCard || !aqiContainer) return;

  try {
    setLoading(current, true);
    setLoading(detail, true);
    setLoading(daysCard, true);
    setLoading(hourlyCard, true);
    setLoading(aqiContainer, true);

    const rev = await reverseGeo(lat, lon);
    const localPlace = rev.localPlace || "";
    const placeEnName = rev.placeEnName || "";

    const weather = await fetchCurrent(lat, lon);
    renderCurrent(current, weather, localPlace || "알 수 없는 위치");
    renderDetail(detail, weather);

    const forecast = await fetch5Day(lat, lon);
    const days = computeDailyFromForecast(forecast);
    render5DayCard(daysCard, days);

    // 3시간 간격 슬롯 렌더링 (현재 위치 기반)
    try {
      const tz = forecast.city?.timezone ?? 0;
      const slots = computeSlotsFromForecast(forecast, 5, tz);
      if (hourlyCard) render3HourSlots(hourlyCard, slots, tz);
    } catch (err) {
      if (hourlyCard)
        hourlyCard.innerHTML = `<div class="text-sm text-neutral-500">3시간 간격 예보를 불러올 수 없습니다.</div>`;
    }

    // 대기질 지수 렌더링
    const aqi = await fetchAqi(lat, lon);
    renderAqi(aqiContainer, aqi);

    saveRecent(localPlace);
    renderRecentList(document.getElementById("recent-list"), loadRecents());
    state.lastQuery = localPlace;
  } catch (e) {
    const err = `<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">오류: ${e.message}</div>`;
    current.innerHTML = err;
    detail.innerHTML = err;
    daysCard.innerHTML = err;
    aqiContainer.innerHTML = err;
  }
}
