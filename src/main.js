import { renderByCoord } from "./features/location.js";
import { searchAndRender } from "./features/search.js";
import { setupUnitMenu } from "./features/unit-menu.js";
import { loadRecents } from "./state.js";
import "./style.css";
import { renderRecentList } from "./ui/render.js";

// 검색 셋업
function setupSearch() {
  const input = document.querySelector("#search");
  if (!input) return;
  // 검색 이벤트 핸들러
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = input.value.trim();
      if (q) searchAndRender(q);
    }
  });
  // 최근 검색 클릭 핸들러
  window.__searchRecent = function (query) {
    if (input) input.value = query;
    searchAndRender(query);
  };

  // 현재 위치 버튼 클릭 핸들러
  window.__searchGeo = () => {
    if (input) input.value = null;
    initWithGeo();
  };
}

// 현재 위치 기반 날씨 fetch - 기본값 : 서울
function initWithGeo() {
  if (!("geolocation" in navigator)) {
    searchAndRender("서울");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      renderByCoord(latitude, longitude);
    },
    (err) => {
      console.warn("Geolocation error:", err);
      searchAndRender("서울");
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

// 첫 화면 로딩 시 작동
document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupUnitMenu();
  initWithGeo();
  renderRecentList(document.getElementById("recent-list"), loadRecents());
});
