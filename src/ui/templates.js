import { state } from "../state.js";
import { formatSunTime, normalizeIcon } from "../utils.js";

export function templateCurrent(weather, localPlace) {
  const temp = Math.round(weather.main.temp);
  const desc = weather.weather[0]?.description ?? "";
  const icon = weather.weather[0]?.icon;
  return `<div class="rounded-xl overflow-hidden border border-neutral-200 bg-linear-to-br from-sky-500 to-blue-700 text-white min-w-64">
    <div class="h-44 p-5 flex justify-between">
      <div class="relative w-46">
        <div class="text-sm/5 font-medium bg-white/15 px-2 py-1 rounded w-fit ">${localPlace}</div>
        <div class="relative mt-3 flex items-start justify-start gap-1">
          <div class="text-6xl font-bold">${temp}°</div>
          <img alt="" class="absolute -top-5 right-0 h-28 w-28" src="https://openweathermap.org/img/wn/${icon}@4x.png"/>
        </div>
        <div class="mt-3 text-white/90">${desc}</div>
      </div>
      <div class="text-white/80 text-sm">${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}</div>
    </div>`;
}

export function templateDetail(weather) {
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
  <li><div class="text-sm text-neutral-500">체감 온도</div><div class="mt-1 text-xl font-semibold">${feels}°</div></li>
  <li><div class="text-sm text-neutral-500">바람</div><div class="mt-1 text-xl font-semibold">${wind} ${windLabel}</div></li>
  <li><div class="text-sm text-neutral-500">습도</div><div class="mt-1 text-xl font-semibold">${humidity}%</div></li>
  <li><div class="text-sm text-neutral-500">기압</div><div class="mt-1 text-xl font-semibold">${pressure} hPa</div></li>
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
</ul>`;
}

export function template5Day(days) {
  const items = days
    .map((d) => {
      const dayLabel = new Date(d.date).toLocaleDateString("ko-KR", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      });
      const iconUrl = `https://openweathermap.org/img/wn/${normalizeIcon(
        d.icon
      )}@2x.png`;
      return `
  <li class="rounded-lg border border-neutral-200 p-4 text-center">
    <div class="text-sm text-neutral-500">${dayLabel}</div>
    <img alt="${d.desc}" class="mx-auto my-2 h-12 w-12" src="${iconUrl}" />
    <div class="mt-1 font-medium">
      <span class="text-neutral-900">${d.max}°</span>
      <span class="text-neutral-400 ml-1">${d.min}°</span>
    </div>
  </li>`;
    })
    .join("");
  return `<h2 class="font-semibold">5일 예보</h2>
<ul class="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">${items}</ul>`;
}
