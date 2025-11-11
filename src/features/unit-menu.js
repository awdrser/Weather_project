import { setUnit, state } from "../state.js";
import { searchAndRender } from "./search.js";

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

export function setupUnitMenu() {
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
      setUnit(next);
      renderUnitPopover();
      const input = document.querySelector("#search");
      const q = input?.value?.trim() || state.lastQuery || "Seoul";
      await searchAndRender(q);
      trigger.innerHTML = `<button id="unit-trigger" class="px-2 py-1 rounded hover:bg-neutral-100">
        ${state.unit === "metric" ? "℃" : "℉"}</button>`;
    }
    close();
  });

  document.addEventListener("click", (e) => {
    if (!pop.contains(e.target) && e.target !== trigger) close();
  });

  renderUnitPopover();
}
