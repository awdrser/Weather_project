export function normalizeIcon(icon) {
  if (typeof icon !== "string") return "01d";
  const m = icon.match(/^\d{2}[dn]/);
  return m ? m[0] : "01d";
}

// src/utils/place.js
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
