import { getStyles } from "./styles";

const BOOKING_BASE_URL = "https://hotelos-booking.vercel.app";

interface WidgetConfig {
  hotel: string;
  lang: string;
  position: string;
  color: string;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function getDayAfterTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d;
}

function createNumberSelector(
  id: string,
  label: string,
  value: number,
  min: number,
  max: number,
  narrow: boolean
): { wrapper: HTMLDivElement; getValue: () => number } {
  let current = value;

  const wrapper = document.createElement("div");
  wrapper.className = narrow ? "ho-field ho-field-narrow" : "ho-field";

  const lbl = document.createElement("span");
  lbl.className = "ho-label";
  lbl.textContent = label;

  const numWrap = document.createElement("div");
  numWrap.className = "ho-number-wrap";

  const btnMinus = document.createElement("button");
  btnMinus.type = "button";
  btnMinus.className = "ho-number-btn";
  btnMinus.textContent = "\u2212";
  btnMinus.disabled = current <= min;

  const valSpan = document.createElement("span");
  valSpan.className = "ho-number-val";
  valSpan.textContent = String(current);

  const btnPlus = document.createElement("button");
  btnPlus.type = "button";
  btnPlus.className = "ho-number-btn";
  btnPlus.textContent = "+";
  btnPlus.disabled = current >= max;

  const update = () => {
    valSpan.textContent = String(current);
    btnMinus.disabled = current <= min;
    btnPlus.disabled = current >= max;
  };

  btnMinus.addEventListener("click", () => {
    if (current > min) {
      current--;
      update();
    }
  });

  btnPlus.addEventListener("click", () => {
    if (current < max) {
      current++;
      update();
    }
  });

  numWrap.appendChild(btnMinus);
  numWrap.appendChild(valSpan);
  numWrap.appendChild(btnPlus);

  wrapper.appendChild(lbl);
  wrapper.appendChild(numWrap);

  return { wrapper, getValue: () => current };
}

function initWidget(container: HTMLElement): void {
  const config: WidgetConfig = {
    hotel: container.getAttribute("data-hotel") || "",
    lang: container.getAttribute("data-lang") || "es",
    position: container.getAttribute("data-position") || "bottom",
    color: container.getAttribute("data-color") || "#2563eb",
  };

  if (!config.hotel) {
    console.warn("[HotelOS Widget] data-hotel attribute is required.");
    return;
  }

  const labels: Record<string, Record<string, string>> = {
    es: {
      checkin: "Entrada",
      checkout: "Salida",
      adults: "Adultos",
      children: "Ni\u00f1os",
      cta: "Ver disponibilidad",
      fab: "Reservar",
    },
    en: {
      checkin: "Check-in",
      checkout: "Check-out",
      adults: "Adults",
      children: "Children",
      cta: "Check availability",
      fab: "Book now",
    },
    pt: {
      checkin: "Entrada",
      checkout: "Sa\u00edda",
      adults: "Adultos",
      children: "Crian\u00e7as",
      cta: "Ver disponibilidade",
      fab: "Reservar",
    },
  };

  const t = labels[config.lang] || labels["es"];

  // Create shadow DOM
  const shadowHost = document.createElement("div");
  shadowHost.id = "hotelos-widget-root";
  document.body.appendChild(shadowHost);
  const shadow = shadowHost.attachShadow({ mode: "open" });

  // Inject styles
  const styleEl = document.createElement("style");
  styleEl.textContent = getStyles(config.color);
  shadow.appendChild(styleEl);

  // === Bottom bar ===
  const bar = document.createElement("div");
  bar.className = "ho-bar";

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "ho-close";
  closeBtn.type = "button";
  closeBtn.innerHTML = "&#10005;";
  closeBtn.setAttribute("aria-label", "Close");
  bar.appendChild(closeBtn);

  const barInner = document.createElement("div");
  barInner.className = "ho-bar-inner";

  // Check-in
  const checkinField = document.createElement("div");
  checkinField.className = "ho-field";
  const checkinLabel = document.createElement("span");
  checkinLabel.className = "ho-label";
  checkinLabel.textContent = t.checkin;
  const checkinInput = document.createElement("input");
  checkinInput.type = "date";
  checkinInput.className = "ho-input";
  checkinInput.value = formatDate(getTomorrow());
  checkinInput.min = formatDate(new Date());
  checkinField.appendChild(checkinLabel);
  checkinField.appendChild(checkinInput);

  // Check-out
  const checkoutField = document.createElement("div");
  checkoutField.className = "ho-field";
  const checkoutLabel = document.createElement("span");
  checkoutLabel.className = "ho-label";
  checkoutLabel.textContent = t.checkout;
  const checkoutInput = document.createElement("input");
  checkoutInput.type = "date";
  checkoutInput.className = "ho-input";
  checkoutInput.value = formatDate(getDayAfterTomorrow());
  checkoutInput.min = formatDate(getTomorrow());
  checkoutField.appendChild(checkoutLabel);
  checkoutField.appendChild(checkoutInput);

  // Sync checkout min date when checkin changes
  checkinInput.addEventListener("change", () => {
    const ci = new Date(checkinInput.value);
    ci.setDate(ci.getDate() + 1);
    checkoutInput.min = formatDate(ci);
    if (checkoutInput.value <= checkinInput.value) {
      checkoutInput.value = formatDate(ci);
    }
  });

  // Adults
  const adults = createNumberSelector("adults", t.adults, 2, 1, 10, true);

  // Children
  const children = createNumberSelector("children", t.children, 0, 0, 6, true);

  // CTA button
  const ctaBtn = document.createElement("button");
  ctaBtn.type = "button";
  ctaBtn.className = "ho-btn";
  ctaBtn.textContent = t.cta;

  ctaBtn.addEventListener("click", () => {
    const params = new URLSearchParams({
      checkin: checkinInput.value,
      checkout: checkoutInput.value,
      adults: String(adults.getValue()),
      children: String(children.getValue()),
    });
    const url = `${BOOKING_BASE_URL}/${config.hotel}?${params.toString()}`;
    window.open(url, "_blank", "noopener");
  });

  barInner.appendChild(checkinField);
  barInner.appendChild(checkoutField);
  barInner.appendChild(adults.wrapper);
  barInner.appendChild(children.wrapper);
  barInner.appendChild(ctaBtn);
  bar.appendChild(barInner);

  // === Floating button (minimized state) ===
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "ho-fab ho-hidden";
  fab.innerHTML = `<span class="ho-fab-icon">&#x1F3E8;</span> ${t.fab}`;

  // Toggle states
  closeBtn.addEventListener("click", () => {
    bar.classList.add("ho-hidden");
    fab.classList.remove("ho-hidden");
  });

  fab.addEventListener("click", () => {
    fab.classList.add("ho-hidden");
    bar.classList.remove("ho-hidden");
    // Re-trigger animation
    bar.style.animation = "none";
    // Force reflow
    void bar.offsetHeight;
    bar.style.animation = "";
  });

  shadow.appendChild(bar);
  shadow.appendChild(fab);
}

// Auto-init on DOM ready
function boot(): void {
  const el = document.getElementById("hotelos-widget");
  if (el) {
    initWidget(el);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
