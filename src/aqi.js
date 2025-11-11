export async function mountCityAqi({
  city,
  containerId = "city-aqi-container",
  lang = "kr",
}) {
  // AQICN 위젯은 container와 city 파라미터를 요구합니다.
  await mountAqiWidget({ city, containerId, lang });
}

let aqiFeedReady;

function loadAqiFeedOnce({ city = "seoul", lang = "kr" } = {}) {
  if (window._aqiFeed && window._aqiFeed.n !== undefined) {
    return Promise.resolve(window._aqiFeed);
  }
  if (aqiFeedReady) return aqiFeedReady;

  aqiFeedReady = new Promise((resolve, reject) => {
    (function (w, d, t, f) {
      w[f] =
        w[f] ||
        function (c, k, n) {
          const s = w[f];
          k = s.k = s.k || (k ? "&k=" + k : "");
          s.c = c = c instanceof Array ? c : [c];
          s.n = n = n || 0;
          const L = d.createElement(t);
          const e = d.getElementsByTagName(t)[0];
          L.async = 1;
          L.src =
            "https://feed.aqicn.org/feed/" +
            c[n].city +
            "/" +
            (c[n].lang || "") +
            "/feed.v1.js?n=" +
            n +
            k;
          L.onload = () => resolve(w[f]);
          L.onerror = reject;
          e.parentNode.insertBefore(L, e);
        };
    })(window, document, "script", "_aqiFeed");

    window._aqiFeed({ city, lang }); // 트리거
  });

  return aqiFeedReady;
}

export async function mountAqiWidget({
  city,
  lang = "kr",
  containerId = "city-aqi-container",
}) {
  await loadAqiFeedOnce({ city, lang });
  const el = document.getElementById(containerId);
  if (!el) return;
  window._aqiFeed({
    display: `<div class="flex justify-center items-center translate-y-3.5 text-3xl gap-3">%aqi <small>%impact</small></div>`,
    container: containerId,
    city: city,
    lang,
  });
}
