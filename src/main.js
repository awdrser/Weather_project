import "./style.css";

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
  const place = local_names.ko;

  return { lat, lon, place };
}

const state = {
  unit: "metric", // metric(℃, m/s), imperial(℉, mph)
  lang: "kr",
};

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

function setupUnitMenu() {
  const trigger = document.querySelector("#unit-trigger");
  const pop = document.querySelector("#unit-popover");

  if (!trigger || !pop) return;

  const open = () => pop.classList.remove("hidden");
  const close = () => pop.classList.add("hidden");
  const toggle = () => pop.classList.toggle("hidden");

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  pop.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-unit]");
    if (!btn) return;
    const next = btn.getAttribute("data-unit");
    if (next !== state.unit) {
      state.unit = next; // "metric" | "imperial"
      // 현재 입력값이 있으면 그걸, 없으면 lastQuery로 재요청
      const input = document.querySelector("#search");
      const q = input?.value?.trim() || state.lastQuery || "Seoul";
      await searchAndRender(q);
    }
    close();
  });

  // 바깥 클릭 시 닫힘
  document.addEventListener("click", (e) => {
    if (!pop.contains(e.target) && e.target !== trigger) close();
  });
}

function templateCurrent(weather, place) {
  const temp = Math.round(weather.main.temp);
  const desc = weather.weather[0]?.description ?? "";
  const icon = weather.weather[0]?.icon; // 예: 01d

  return `<div class="rounded-xl overflow-hidden border border-neutral-200 bg-linear-to-br from-sky-500 to-blue-700 text-white"> <div class="h-44 p-5 flex justify-between"> <div class="relative  w-46"> <div class="text-sm/5 font-medium bg-white/15 px-2 py-1 rounded w-fit ">${place}</div> <div class="relative mt-3 flex items-start justify-start gap-1"> <div class="text-6xl font-bold">${temp}°</div> <img alt="" class="absolute -top-5 right-0 h-28 w-28" src="https://openweathermap.org/img/wn/${icon}@4x.png"/> </div> <div class="mt-3 text-white/90">${desc}</div> </div> <div class="text-white/80 text-sm">${new Date().toLocaleTimeString(
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

    const icon =
      noonItem?.weather[0]?.icon ??
      Object.entries(iconCount).sort((a, b) => b - a);
    [1];

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
      const iconUrl = `https://openweathermap.org/img/wn/${d.icon}@2x.png`;

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

async function fetchCurrentByCoord(lat, lon) {
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

async function searchAndRender(query) {
  const current = document.querySelector("#current-card");
  const detail = document.querySelector("#detail-card");
  const days = document.querySelector("#days-card");
  if (!current || !days) return;

  try {
    setLoading(current, true);
    setLoading(days, true);
    const { lat, lon, place } = await fetchGeo(query);
    const weather = await fetchCurrentByCoord(lat, lon);

    current.innerHTML = templateCurrent(weather, place);
    if (detail) detail.innerHTML = templateDetail(weather);
    if (days) {
      const days = await fetch5Day(lat, lon);
      render5Day(days);
    }

    saveRecent(query);
    renderRecentList();
    state.lastQuery = query;
  } catch (e) {
    const err = `<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        오류: ${e.message}
      </div>`;
    current.innerHTML = err;
    if (detail) detail.innerHTML = err;
    if (days) days.innerHTML = err;
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
  searchAndRender("서울");
  renderRecentList();
});
