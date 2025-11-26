import {
  fetch5Day,
  fetchAqi,
  fetchCurrent,
  fetchGeo,
  reverseGeo,
} from "../api.js";
import { loadRecents, saveRecent, setLastQuery } from "../state.js";
import {
  render5DayCard,
  renderAqi,
  renderCurrent,
  renderDetail,
  renderRecentList,
  setLoading,
} from "../ui/render.js";
import { computeDailyFromForecast } from "../utils.js";

// 검색 도시명 기반 렌더링
export async function searchAndRender(query) {
  const current = document.querySelector("#current-card");
  const detail = document.querySelector("#detail-card");
  const daysCard = document.querySelector("#days-card");
  const aqiContainer = document.querySelector("#city-aqi-container");
  if (!current || !daysCard || !daysCard || !aqiContainer) return;

  try {
    setLoading(current, true);
    setLoading(detail, true);
    setLoading(daysCard, true);
    setLoading(aqiContainer, true);

    // 검색한 데이터에 해당하는 위치, 도시명 fetch
    const {
      lat,
      lon,
      localPlace: geoPlace,
      placeEnName,
    } = await fetchGeo(query);
    let localPlace = geoPlace ?? "";

    // 위치로 날씨 데이터 fetch
    const weather = await fetchCurrent(lat, lon);

    // API에 도시명이 존재하지 않을 때 위치를 이용하여 역으로 도시명 찾기
    if (!localPlace) {
      try {
        const rev = await reverseGeo(lat, lon);
        localPlace = rev.localPlace ?? "";
      } catch {}
    }

    // 현재 날씨 렌더링
    renderCurrent(current, weather, localPlace || query);

    // 오늘 예보 (디테일) 렌더링
    renderDetail(detail, weather);

    // 위치로 5일 예보 데이터 fetch
    const forecast = await fetch5Day(lat, lon);

    // 데이터 가공
    const days = computeDailyFromForecast(forecast);

    // 5일 예보 렌더링
    render5DayCard(daysCard, days);

    // 대기질 지수 렌더링
    const aqi = await fetchAqi(lat, lon);
    renderAqi(aqiContainer, aqi);

    // 최근 검색어 저장 후 렌더링
    saveRecent(query);
    renderRecentList(document.getElementById("recent-list"), loadRecents());
    setLastQuery(query);
  } catch (e) {
    const err = `<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">오류: ${e.message}</div>`;
    current.innerHTML = err;
    detail.innerHTML = err;
    daysCard.innerHTML = err;
    aqiContainer.innerHTML = err;
  }
}
