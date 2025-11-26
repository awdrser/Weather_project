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
  const cityMs = (utcSeconds + cityOffsetSec) * 1000;
  return new Date(cityMs).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
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
