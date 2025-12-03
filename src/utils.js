// 정규화 및 시간 표시

export function normalizeIcon(icon) {
  if (typeof icon !== "string") return "01d";
  const m = icon.match(/^\d{2}[dn]/);
  return m ? m[0] : "01d";
}

export function normalizePlaceEn(nameRaw) {
  if (!nameRaw || typeof nameRaw !== "string") return "";
  let s = nameRaw.trim();

  // 괄호 제거
  s = s.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, " ").trim();

  // 쉼표/대시 뒤 제거
  s = s.split(/[,–—-]/)[0].trim();

  // 접미사 제거
  const adminSuffixes = [
    "metropolitan city",
    "special city",
    "self-governing city",
    "city",
    "si",
    "gun",
    "gu",
    "eup",
    "myeon",
    "dong",
    "ri",
  ];
  const suffixPattern = new RegExp(
    `(?:\\s*-(?:${adminSuffixes.join("|")})|\\s+(?:${adminSuffixes.join(
      "|"
    )}))+$`,
    "i"
  );
  const stripped = s.replace(suffixPattern, "").trim();

  // 최소 안전장치: 토큰이 1개뿐이고 길이가 3 미만이면 원본 유지
  const tokens = stripped.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return nameRaw.trim();
  if (tokens.length === 1 && tokens[0].length < 3) return nameRaw.trim();

  return stripped;
}

export function formatSunTime(utcSeconds, cityOffsetSec) {
  // UTC 타임스탐프를 밀리초로 변환하여 Date 객체 생성 (이건 UTC 시간)
  const d = new Date(utcSeconds * 1000);

  // UTC 시간을 읽기
  let hours = d.getUTCHours();
  let minutes = d.getUTCMinutes();

  // 도시 오프셋(초 단위)을 시간과 분으로 변환하여 더하기
  const offsetHours = Math.floor(cityOffsetSec / 3600);
  const offsetMinutes = Math.floor((cityOffsetSec % 3600) / 60);

  hours += offsetHours;
  minutes += offsetMinutes;

  // 분이 60을 넘으면 시간에 더하기
  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
  }

  // 시간이 24를 넘으면 처리
  while (hours >= 24) hours -= 24;
  while (hours < 0) hours += 24;

  const ampm = hours < 12 ? "오전" : "오후";
  const displayHour = hours % 12 || 12;

  return `${ampm} ${String(displayHour).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
}

export function computeDailyFromForecast(data) {
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

// 5일 예보 리스트에서 현재 시각 이후의 연속된 5개 항목을 추출
export function computeSlotsFromForecast(data, count = 5, cityTzOffsetSec = 0) {
  if (!data || !Array.isArray(data.list)) return [];

  // 도시의 현재 시각을 UTC 기준으로 계산
  // (브라우저의 현재 시각 + 도시 시간대 오프셋)
  const nowUtcSec = Math.floor(Date.now() / 1000);
  const nowInCitySec = nowUtcSec + cityTzOffsetSec;

  // 도시 현재 시각 기준으로 첫 번째 미래 항목 찾기
  let startIndex = data.list.findIndex((it) => it.dt > nowInCitySec);
  if (startIndex === -1) startIndex = 0;

  const sliced = data.list.slice(startIndex, startIndex + count);

  const result = sliced.map((it) => ({
    dt: it.dt,
    temp: it.main?.temp,
    icon: it.weather[0]?.icon ?? "01d",
    desc: it.weather[0]?.description ?? "",
    pop: typeof it.pop === "number" ? it.pop : 0,
    rain: (it.rain && (it.rain["3h"] ?? it.rain["1h"])) || 0,
    dt_txt: it.dt_txt,
  }));

  return result;
}
