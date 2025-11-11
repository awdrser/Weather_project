import { state } from "./state.js";
import { normalizePlaceEn } from "./utils.js";

const API_KEY = import.meta.env.VITE_OWM_KEY;

export async function fetchGeo(query) {
  const url = new URL("https://api.openweathermap.org/geo/1.0/direct");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("appid", API_KEY);
  const res = await fetch(url);
  if (!res.ok) throw new Error("지오코딩 실패");
  const list = await res.json();
  if (!list.length) throw new Error("도시를 찾을 수 없음");
  const { lat, lon, local_names } = list[0];
  const placeEnNameRaw = local_names.en;
  const placeEnName = normalizePlaceEn(placeEnNameRaw);
  return {
    lat,
    lon,
    localPlace: local_names?.ko,
    placeEnName,
  };
}

export async function reverseGeo(lat, lon) {
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
  const placeEnNameRaw = g.local_names?.en || g.name || "";
  const placeEnName = normalizePlaceEn(placeEnNameRaw);
  return { localPlace, placeEnName };
}

export async function fetchCurrent(lat, lon) {
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

export async function fetch5Day(lat, lon) {
  const url = new URL("https://api.openweathermap.org/data/2.5/forecast");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("appid", API_KEY);
  url.searchParams.set("units", state.unit);
  url.searchParams.set("lang", state.lang);
  const res = await fetch(url);
  if (!res.ok) throw new Error("5일 예보 조회 실패");
  return res.json();
}
