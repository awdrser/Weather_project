import { state } from "../state.js";
import { flipIconVariant, formatSunTime, normalizeIcon } from "../utils.js";

export function templateCurrent(weather, localPlace) {
  const temp = Math.round(weather.main.temp);
  const desc = weather.weather[0]?.description ?? "";
  const icon = weather.weather[0]?.icon ?? "";

  // icon에 'n'이 포함되면 배경 바꾸기
  const darkModeClass = icon.includes("n")
    ? "bg-gradient-to-br from-gray-800 to-gray-700"
    : "bg-linear-to-br from-sky-500 to-blue-700";

  return `<div class="rounded-xl overflow-hidden border border-neutral-200 ${darkModeClass} text-white min-w-32 lg:-mb-64">
    <div class="h-44 p-5 flex justify-between">
      <div class="relative w-46">
        <div id="search-place" class="text-sm/5 font-medium bg-white/15 px-2 py-1 rounded w-fit">${localPlace}</div>
        <div class="relative mt-3 flex items-start justify-start gap-1 pb-0 mb-0 h-16">
          <div class="text-6xl font-bold">${temp}°</div>
          <img alt="날씨 이미지" class="-translate-y-6 h-28 w-28" src="https://openweathermap.org/img/wn/${icon}@4x.png"/>
        </div>
        <div class="mt-3 text-white/90">${desc}</div>
      </div>
      <div class="text-white/80 text-sm ">${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}</div>
    </div>
  </div>`;
}

export function templateDetail({ weather, today }) {
  const temp = Math.round(weather.main.temp);
  const tempMax = Math.round(today.temp.max);
  const tempMin = Math.round(today.temp.min);
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
  <h2 class="card">오늘 예보</h2>
  <ul class="mt-4 grid grid-cols-2 gap-4">
  <li class="col-span-2 h-16 w-52"><div class="tag">체감 온도</div><div class="text-4xl font-bold">${feels}°</div></li>
  <li><div class="tag">최고/최저</div><div class="item">${tempMax}° / ${tempMin}°</div></li>
  <li><div class="tag">바람</div><div class="item">${wind} ${windLabel}</div></li>
  <li><div class="tag">습도</div><div class="item">${humidity}%</div></li>
  <li><div class="tag">기압</div><div class="item">${pressure} hPa</div></li>
  <li class="flex items-center gap-3">
    <div>
      <img alt="일출" src="https://cdn.jsdelivr.net/npm/lucide-static@0.453.0/icons/sunrise.svg" class="h-5 w-5"/>
      <div class="mt-0.5 text-2xl ">${formatSunTime(sunRise, tz)}</div>
    </div>
  </li>
  <li class=" flex items-center gap-3">
    <div>
      <img alt="일몰" src="https://cdn.jsdelivr.net/npm/lucide-static@0.453.0/icons/sunset.svg" class="h-5 w-5"/>
      <div class="mt-0.5 text-2xl ">${formatSunTime(sunSet, tz)}</div>
    </div>
  </li>
</ul>`;
}

export function template5Day(days) {
  const items = days
    .map((d) => {
      const dayLabel = new Date(d.dt * 1000).toLocaleDateString("ko-KR", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      });
      const pop = Math.round((d.pop || 0) * 100);
      const iconUrl = `https://openweathermap.org/img/wn/${normalizeIcon(
        d.weather[0].icon
      )}@2x.png`;
      return `
  <li class="rounded-lg border border-neutral-200 p-4 text-center">
    <div class="text-sm text-neutral-500">${dayLabel}</div>
    <img alt="${d.desc}" class="mx-auto my-2 h-12 w-12" src="${iconUrl}" />
    <div class="mt-1 font-bold">
      <span class="text-neutral-900">${Math.round(d.temp.max)}°</span>
      <span class="text-neutral-400 ml-1">${Math.round(d.temp.min)}°</span>
    </div>
    <div class="flex gap-2 justify-center items-center text-sm text-neutral-500"><img alt="비" src="/droplet.svg" class="h-4 w-4"/> ${pop}% </div>
  </li>`;
    })
    .join("");
  return `<h2 class="card">5일 예보</h2>
<ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 ">${items}</ul>`;
}

export function templateRecentList(recents) {
  const items = recents.length
    ? recents
        .map(
          (q) => `<li>
      <button class="w-full  px-4 py-2 rounded hover:bg-neutral-100" onclick="window.__searchRecent('${q}')">
        <div class="flex flex-col justify-center items-center text-center gap-5 lg:flex-row lg:justify-start"><img class="w-5 h-5 translate-y-0.5" src="/search-right.svg" /> <p class="w-12 lg:w-20 text-sm lg:text-[16px] ">${q}</p></div>
      </button>
    </li>`
        )
        .join("")
    : `<li class="text-neutral-400 px-3 py-2">최근 검색 없음</li>`;
  return items;
}

export function templateHourSlots(slots, tzOffset = 0) {
  if (!Array.isArray(slots) || slots.length === 0)
    return `<h2 class="card">시간별 예보</h2><div class="mt-4 text-neutral-400">데이터가 없습니다.</div>`;

  const items = slots
    .map((s) => {
      // dt_txt 형식: "YYYY-MM-DD HH:MM:SS" -> HH:MM만 추출
      const time =
        typeof s.dt_txt === "string" && s.dt_txt.length >= 16
          ? s.dt_txt.slice(11, 16)
          : formatSunTime(s.dt, tzOffset);
      let icon = normalizeIcon(s.icon);
      // d를 n으로, n을 d로 바꾸기
      icon = flipIconVariant(icon);
      const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
      const temp = Math.round(s.temp);
      const pop = Math.round((s.pop || 0) * 100);
      const rain = typeof s.rain === "number" ? s.rain : 0;
      return `
      <li class="rounded-lg border border-neutral-200 p-3 text-center">
        <div class="text-sm text-neutral-500">${time}</div>
        <img alt="icon" class="mx-auto my-2 h-12 w-12" src="${iconUrl}" />
        <div class="mt-1 font-bold">${temp}°</div>
        <div class="flex gap-2 justify-center items-center text-sm text-neutral-500"><img alt="비" src="/droplet.svg" class="h-4 w-4"/> ${pop}% </div>
      </li>`;
    })
    .join("");

  return `<h2 class="card">시간별 예보</h2>
  <ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">${items}</ul>`;
}

// 각 components별 수치값에 맞는 index(1~5)를 반환하는 함수
function getIndexForComponent(name, value) {
  switch (name) {
    case "so2":
      if (value < 20) return 1;
      if (value < 80) return 2;
      if (value < 250) return 3;
      if (value < 350) return 4;
      return 5;
    case "no2":
      if (value < 40) return 1;
      if (value < 70) return 2;
      if (value < 150) return 3;
      if (value < 200) return 4;
      return 5;
    case "pm10":
      if (value < 20) return 1;
      if (value < 50) return 2;
      if (value < 100) return 3;
      if (value < 200) return 4;
      return 5;
    case "pm2_5":
      if (value < 10) return 1;
      if (value < 25) return 2;
      if (value < 50) return 3;
      if (value < 75) return 4;
      return 5;
    case "o3":
      if (value < 60) return 1;
      if (value < 100) return 2;
      if (value < 140) return 3;
      if (value < 180) return 4;
      return 5;
    case "co":
      if (value < 4400) return 1;
      if (value < 9400) return 2;
      if (value < 12400) return 3;
      if (value < 15400) return 4;
      return 5;
    default:
      return 0;
  }
}

// 인덱스에 따른 텍스트 색상 클래스 반환
function getColorClassByIndex(index) {
  return index === 1
    ? "text-green-600"
    : index === 2
    ? "text-yellow-500"
    : index === 3
    ? "text-amber-600"
    : index === 4
    ? "text-red-600"
    : index === 5
    ? "text-purple-700"
    : "text-gray-400";
}

export function templateAqi(aqi) {
  const aqiNum = aqi.list[0].main.aqi ?? 0;
  const components = aqi.list[0].components ?? {};

  const colorClass =
    aqiNum === 1.0
      ? "text-green-600"
      : aqiNum === 2.0
      ? "text-yellow-500"
      : aqiNum === 3.0
      ? "text-amber-600"
      : aqiNum === 4.0
      ? "text-red-600"
      : aqiNum === 5.0
      ? "text-purple-700"
      : "text-gray-400";

  const aqiStr =
    aqiNum === 1.0
      ? "좋음"
      : aqiNum === 2.0
      ? "보통"
      : aqiNum === 3.0
      ? "약간 나쁨"
      : aqiNum === 4.0
      ? "나쁨"
      : aqiNum === 5.0
      ? "매우 나쁨"
      : "알 수 없음";

  const {
    co = 0,
    no = 0,
    no2 = 0,
    o3 = 0,
    so2 = 0,
    pm2_5 = 0,
    pm10 = 0,
    nh3 = 0,
  } = components;

  const comps = [
    { name: "co", label: "CO", value: co },
    { name: "no", label: "NO", value: no },
    { name: "no2", label: "NO₂", value: no2 },
    { name: "o3", label: "O₃", value: o3 },
    { name: "so2", label: "SO₂", value: so2 },
    { name: "pm2_5", label: "PM2.5", value: pm2_5 },
    { name: "pm10", label: "PM10", value: pm10 },
    { name: "nh3", label: "NH₃", value: nh3 }, // nh3는 별도 기준 없으면 기본 클라스
  ];

  const componentsHTML = `
    <ul class="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      ${comps
        .map(({ name, label, value }) => {
          const idx = getIndexForComponent(name, value);
          const color = getColorClassByIndex(idx);
          return `<li class="text-center"><div class="tag">${label} </div><div class="item ${color}">${value.toFixed(
            1
          )} </div><span class="text-sm">μg/m³</span></li>`;
        })
        .join("")}
    </ul>`;

  const items = `<h2 class="card">대기질 지수</h2>
      <p class="text-center text-2xl font-semibold  w-full ${colorClass}">${aqiStr}</p>
      ${componentsHTML}
    `;

  return items;
}
