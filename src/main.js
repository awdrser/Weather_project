import "./style.css";
import { mountAqiWidget } from "./widget.js";

const API_KEY = import.meta.env.VITE_OWM_KEY;
const $ = (sel) => document.querySelector(sel);

async function fetchGeo(query) {
  const url = new URL("https://api.openweathermap.org/geo/1.0/direct");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("appid", API_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error("지오코딩 실패");
  const list = await res.json();
  if (!list.length) throw new Error("도시를 찾을 수 없음");

  const { lat, lon, local_names } = list[0];
  const localPlace = local_names.ko;
  const placeEnName = local_names.en;

  return { lat, lon, localPlace, placeEnName };
}

async function reverseGeo(lat, lon) {
  const url = new URL("https://api.openweathermap.org/geo/1.0/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("limit", "1");
  url.searchParams.set("appid", API_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error("리버스 지오코딩 실패");
  const list = await res.json();
  if (!list.length) return { localPlace: "", placeEnName: "" };

  const g = list[0];
  const localPlace =
    (g.local_names && (g.local_names.ko || g.local_names.en)) ||
    [g.name, g.state, g.country].filter(Boolean).join(", ");
  const placeEnName = g.local_names?.en || g.name || "";

  return { localPlace, placeEnName };
}

const state = {
  unit: "metric", // metric(℃, m/s), imperial(℉, mph)
  lang: "kr",
};

function normalizeIcon(icon) {
  if (typeof icon !== "string") return "01d";
  // "04d,[1@2x.png" 같은 이상값에서 "04d"만 뽑기
  const m = icon.match(/^\d{2}[dn]/);
  return m ? m[0] : "01d";
}

function formatSunTime(utcSeconds, cityOffsetSec) {
  // 1) 도시 현지 시각(UTC + cityOffset)을 얻은 뒤
  const cityMs = (utcSeconds + cityOffsetSec) * 1000;
  // 2) toLocale...은 환경 타임존을 기준으로 표시하므로,
  // 표시 시에는 'UTC'로 고정하여 숫자를 그대로 문자열화한다.
  return new Date(cityMs).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC", // 핵심: 다시 환경 오프셋을 적용하지 않도록 고정
  });
}

function renderUnitPopover() {
  const pop = document.querySelector("#unit-popover");
  if (!pop) return;
  const btns = pop.querySelectorAll("[data-unit]");
  btns.forEach((b) => {
    const u = b.getAttribute("data-unit");
    const active = u === state.unit;
    b.classList.toggle("bg-neutral-900", active);
    b.classList.toggle("text-white", active);
    b.classList.toggle("bg-neutral-100", !active);
    b.classList.toggle("text-neutral-900", !active);
  });
}

function setupUnitMenu() {
  const trigger = document.querySelector("#unit-trigger");
  const pop = document.querySelector("#unit-popover");
  if (!trigger || !pop) return;

  const open = () => {
    pop.classList.remove("hidden");
    renderUnitPopover();
  };
  const close = () => pop.classList.add("hidden");
  const toggle = () => {
    pop.classList.toggle("hidden");
    if (!pop.classList.contains("hidden")) renderUnitPopover();
  };

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  pop.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-unit]");
    if (!btn) return;
    const next = btn.getAttribute("data-unit");
    if (next !== state.unit) {
      state.unit = next; // 업데이트
      renderUnitPopover(); // UI 즉시 반영
      const input = document.querySelector("#search");
      const q = input?.value?.trim() || state.lastQuery || "Seoul";
      await searchAndRender(q); // 데이터 재요청
      trigger.innerHTML = `<button
                    id="unit-trigger"
                    class="px-2 py-1 rounded hover:bg-neutral-100"
                  >
                    ${state.unit === "metric" ? "℃" : "℉"}
                  </button>`;
    }
    close();
  });

  // 바깥 클릭 닫기
  document.addEventListener("click", (e) => {
    if (!pop.contains(e.target) && e.target !== trigger) close();
  });

  // 초기 표시
  renderUnitPopover();
}

function templateCurrent(weather, localPlace) {
  const temp = Math.round(weather.main.temp);
  const desc = weather.weather[0]?.description ?? "";
  const icon = weather.weather[0]?.icon; // 예: 01d

  return `<div class="rounded-xl overflow-hidden border border-neutral-200 bg-linear-to-br from-sky-500 to-blue-700 text-white"> <div class="h-44 p-5 flex justify-between"> <div class="relative  w-46"> <div class="text-sm/5 font-medium bg-white/15 px-2 py-1 rounded w-fit ">${localPlace}</div> <div class="relative mt-3 flex items-start justify-start gap-1"> <div class="text-6xl font-bold">${temp}°</div> <img alt="" class="absolute -top-5 right-0 h-28 w-28" src="https://openweathermap.org/img/wn/${icon}@4x.png"/> </div> <div class="mt-3 text-white/90">${desc}</div> </div> <div class="text-white/80 text-sm">${new Date().toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" }
  )}</div>`;
}

function templateDetail(weather) {
  const feels = Math.round(weather.main.feels_like);
  const humidity = weather.main.humidity;
  const pressure = weather.main.pressure;
  const wind =
    state.unit === "metric"
      ? Math.round(weather.wind.speed * 3.6)
      : Math.round(weather.wind.speed);
  const windLabel = state.unit === "metric" ? "km/h" : "mph";
  const sunRise = weather.sys.sunrise;
  const sunSet = weather.sys.sunset;
  const tz = weather.timezone;

  return `
<div class="flex items-center justify-between">
<h2 class="font-semibold">오늘 예보</h2>
</div>
<ul class="mt-4 grid grid-cols-2 gap-4">
<li>
<div class="text-sm text-neutral-500">체감 온도</div>
<div class="mt-1 text-xl font-semibold">${feels}°</div>
</li>
<li>
<div class="text-sm text-neutral-500">바람</div>
<div class="mt-1 text-xl font-semibold">${wind} ${windLabel}</div>
</li>
<li>
<div class="text-sm text-neutral-500">습도</div>
<div class="mt-1 text-xl font-semibold">${humidity}%</div>
</li>
<li>
<div class="text-sm text-neutral-500">기압</div>
<div class="mt-1 text-xl font-semibold">${pressure} hPa</div>
</li>
  <li class="col-span-1 flex items-center gap-3">
    
    <div>
      <img alt="일출" src="https://cdn.jsdelivr.net/npm/lucide-static@0.453.0/icons/sunrise.svg" class="h-5 w-5"/>
      <div class="mt-0.5 text-lg font-semibold">${formatSunTime(
        sunRise,
        tz
      )}</div>
    </div>
  </li>
  <li class="col-span-1 flex items-center gap-3">
    
    <div>
      <img alt="일몰" src="https://cdn.jsdelivr.net/npm/lucide-static@0.453.0/icons/sunset.svg" class="h-5 w-5"/>
      <div class="mt-0.5 text-lg font-semibold">${formatSunTime(
        sunSet,
        tz
      )}</div>
    </div>
  </li>
</ul>
`;
}

function setLoading(el, on) {
  el.innerHTML = on
    ? `<div class="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
      불러오는 중...
    </div>`
    : "";
}

async function fetch5Day(lat, lon) {
  const url = new URL("https://api.openweathermap.org/data/2.5/forecast");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("appid", API_KEY);
  url.searchParams.set("units", state.unit);
  url.searchParams.set("lang", state.lang);

  const res = await fetch(url);
  if (!res.ok) throw new Error("5일 예보 조회 실패");
  const data = await res.json();

  // 날짜별 그룹핑
  const byDay = new Map(); // key: YYYY-MM-DD
  for (const it of data.list) {
    const d = new Date(it.dt * 1000);
    const key = d.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(it);
  }

  // 오늘 포함 앞으로 5개 날짜
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const keys = Array.from(byDay.keys()).sort();
  let future = keys.filter((k) => k > todayKey).slice(0, 5); // 오늘을 완전히 지나간 후 제외

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
      if (h === 12) noonItem = it; // 정오 값 선호
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
      desc: noonItem?.weather[0]?.description ?? "",
    };
  });
}

function render5Day(days) {
  const card = document.querySelector("#days-card");
  if (!card) return;

  const items = days
    .map((d) => {
      const dayLabel = new Date(d.date).toLocaleDateString("ko-KR", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      });
      const safeIcon = normalizeIcon(d.icon);
      const iconUrl = `https://openweathermap.org/img/wn/${safeIcon}@2x.png`;

      return `
  <li class="rounded-lg border border-neutral-200 p-4 text-center">
    <div class="text-sm text-neutral-500">${dayLabel}</div>
    <img alt="${d.desc}" class="mx-auto my-2 h-12 w-12" src="${iconUrl}" />
    <div class="mt-1 font-medium">
      <span class="text-neutral-900">${d.max}°</span>
      <span class="text-neutral-400 ml-1">${d.min}°</span>
    </div>
  </li>
`;
    })
    .join("");

  card.innerHTML = `<h2 class="font-semibold">5일 예보</h2> <ul class="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"> ${items} </ul>`;
}

async function renderByCoord(lat, lon) {
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

    current.innerHTML = templateCurrent(
      weather,
      localPlace || "알 수 없는 위치"
    );
    if (detail) detail.innerHTML = templateDetail(weather);
    if (daysCard) {
      const days = await fetch5Day(lat, lon);
      render5Day(days);
    }
    if (aqiContainer) {
      await mountAqiWidget({
        city: placeEnName,
        lang: "kr",
        containerId: "city-aqi-container",
      });
    }

    // 최근검색 및 상태 갱신(문자열 기준은 한글명으로, 영문명은 위젯 등에서 사용)
    if (localPlace) {
      saveRecent(localPlace);
      renderRecentList();
      state.lastQuery = localPlace;
    }

    // AQI 위젯을 쓰는 경우 placeEnName으로 마운트
    // await mountAqiWidgetWithCity(placeEnName || localPlace);
  } catch (e) {
    const err = `<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">오류: ${e.message}</div>`;
    current.innerHTML = err;
    if (detail) detail.innerHTML = err;
    if (daysCard) daysCard.innerHTML = err;
  }
}

async function fetchCurrent(lat, lon) {
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("appid", API_KEY);
  url.searchParams.set("units", state.unit);
  url.searchParams.set("lang", state.lang);
  const res = await fetch(url);
  if (!res.ok) throw new Error("현재 날씨 조회 실패");
  return res.json();
}

function saveRecent(query) {
  let recents = JSON.parse(localStorage.getItem("weather:recent") || "[]");
  recents = recents.filter((q) => q !== query);
  recents.unshift(query);
  if (recents.length > 5) recents = recents.slice(0, 5);
  localStorage.setItem("weather:recent", JSON.stringify(recents));
}

function renderRecentList() {
  const ul = document.getElementById("recent-list");
  if (!ul) return;
  const recents = JSON.parse(localStorage.getItem("weather:recent") || "[]");
  ul.innerHTML = recents.length
    ? recents
        .map(
          (q) =>
            `<li>
      <button class="block w-full text-left px-3 py-2 rounded hover:bg-neutral-100" onclick="window.__searchRecent('${q}')">
        <span class="flex gap-5 "><img class="w-5 h-5 translate-y-0.5" src="./src/search-right.svg"> ${q}</span>  
      </button>
    </li>`
        )
        .join("")
    : `<li class="text-neutral-400 px-3 py-2">최근 검색 없음</li>`;
}

window.__searchRecent = function (query) {
  const input = document.getElementById("search");
  if (input) input.value = query;
  searchAndRender(query);
};

function initWithGeo() {
  if (!("geolocation" in navigator)) {
    searchAndRender("서울"); // 지원 안 하면 폴백
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      renderByCoord(latitude, longitude); // 현재 위치 전용
    },
    (err) => {
      console.warn("Geolocation error:", err);
      searchAndRender("서울"); // 실패 시 폴백
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

async function searchAndRender(query) {
  const current = document.querySelector("#current-card");
  const detail = document.querySelector("#detail-card");
  const daysCard = document.querySelector("#days-card");
  if (!current || !daysCard) return;

  try {
    setLoading(current, true);
    if (detail) setLoading(detail, true);
    setLoading(daysCard, true);

    const {
      lat,
      lon,
      localPlace: geoPlace,
      placeEnName,
    } = await fetchGeo(query);
    let localPlace = geoPlace || "";

    const weather = await fetchCurrent(lat, lon);

    if (!localPlace) {
      try {
        const rev = await reverseGeo(lat, lon);
        localPlace = rev.localPlace || "";
      } catch {}
    }

    current.innerHTML = templateCurrent(weather, localPlace || query);
    if (detail) detail.innerHTML = templateDetail(weather);
    const days = await fetch5Day(lat, lon);
    render5Day(days);
    await mountAqiWidget({
      city: placeEnName,
      lang: "kr",
      containerId: "city-aqi-container",
    });

    saveRecent(query);
    renderRecentList();
    state.lastQuery = query;
  } catch (e) {
    const err = `<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">오류: ${e.message}</div>`;
    current.innerHTML = err;
    if (detail) detail.innerHTML = err;
    if (daysCard) daysCard.innerHTML = err;
  }
}

function setupSearch() {
  const input =
    $("#search") || document.querySelector('input[placeholder*="도시"]');
  if (!input) return;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = input.value.trim();
      if (q) searchAndRender(q);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupUnitMenu();
  initWithGeo();
  renderRecentList();
});
