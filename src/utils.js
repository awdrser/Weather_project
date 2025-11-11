export function normalizeIcon(icon) {
  if (typeof icon !== "string") return "01d";
  const m = icon.match(/^\d{2}[dn]/);
  return m ? m[0] : "01d";
}

export function normalizePlaceEn(nameRaw) {
  if (!nameRaw || typeof nameRaw !== "string") return "";

  let s = nameRaw.trim();

  // 1) 괄호 및 괄호 안 내용 제거: "Yongsan-gu (Seoul)" -> "Yongsan-gu"
  s = s.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, " ").trim(); // 공백으로 치환 후 트림 [web:29][web:35][web:38]

  // 2) 쉼표나 하이픈 뒤 상세 제거: "Gangnam-gu - Seoul" / "Mapo-gu, Seoul" -> "Gangnam-gu" / "Mapo-gu"
  s = s.split(/[,–—-]/)[0].trim(); // 다양한 대시 포함 [web:22][web:33][web:39]

  // 3) 한국 행정구역 영문 접미사 제거: "-si, -gun, -gu, -eup, -myeon, -dong, -ri"
  //    확장: "Metropolitan City", "Special City", "City" 등도 제거
  //    단어 경계 기준으로 끝에 있을 때만 제거
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
    // 공백 또는 하이픈으로 연결된 접미사가 끝에 연속 존재할 수 있어 반복 제거
    `(?:\\s*-(?:${adminSuffixes.join("|")})|\\s+(?:${adminSuffixes.join(
      "|"
    )}))+$`,
    "i"
  );
  s = s.replace(suffixPattern, "").trim(); // [web:21][web:27][web:25][web:30]

  // 4) 다중 공백 정리
  s = s.replace(/\s{2,}/g, " ").trim(); // [web:22][web:33]

  // 5) 남는게 너무 짧으면 원본 fallback
  return s.length >= 2 ? s : nameRaw.trim();
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
