/* Red de seguridad: si algo del JS falla, mostrar todo el contenido igual */
window.addEventListener("error", () => {
  document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach((el) => {
    el.classList.add("is-visible");
  });
});

const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector("#menu");
const prepSearch = document.querySelector("#prepSearch");
const prepCards = document.querySelectorAll(".prep-card");
const prepCount = document.querySelector("#prepCount");
const profileSearch = document.querySelector("#profileSearch");
const profileCards = document.querySelectorAll(".profile-card");
const profileFilters = document.querySelectorAll("[data-profile-filter]");
const profileCount = document.querySelector("#profileCount");
const osSearch = document.querySelector("#osSearch");
const osItems = document.querySelectorAll(".os-item");
const osNotFound = document.querySelector("#osNotFound");
const revealItems = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
const navLinks = document.querySelectorAll(".nav-menu a[href]");
const studyImages = document.querySelectorAll("img[data-fallback-label]");
const siteHeader = document.querySelector(".site-header");
const whatsappNumber = "5493516662384";
const whatsappDisplay = "+54 9 3516 66-2384";
const whatsappStudies = "5493516653434"; // turnos de estudios complementarios
let refreshPrintCount = null; // la asigna el modo impresión de estudios; el buscador la invoca
const _prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
window.dataLayer = window.dataLayer || [];

function trackEvent(eventName, detail = {}) {
  const payload = {
    event: eventName,
    page: window.location.pathname.split("/").pop() || "index.html",
    ...detail
  };

  window.dataLayer.push(payload);

  if (window.gtag) {
    window.gtag("event", eventName, detail);
  }
}

const appointmentIntents = [
  {
    label: "Consulta médica",
    detail: "Primera consulta, control o derivación.",
    message: "Hola, quiero pedir un turno para una consulta oftalmológica. Mi nombre es "
  },
  {
    label: "Estudio complementario",
    detail: "OCT, campo visual, topografía u otro estudio.",
    message: "Hola, quiero pedir un turno para un estudio oftalmológico. El estudio indicado es ",
    number: whatsappStudies
  },
  {
    label: "Cirugía o tratamiento",
    detail: "Consulta por catarata, retina, láser u otro procedimiento.",
    message: "Hola, quiero consultar por una cirugía o tratamiento oftalmológico. Mi consulta es "
  },
  {
    label: "Obra social",
    detail: "Confirmar cobertura, plan o autorización.",
    message: "Hola, quiero consultar si mi obra social o prepaga tiene cobertura. Mi cobertura es "
  },
  {
    label: "Urgencia",
    detail: "Dolor, golpe, pérdida visual o síntomas recientes.",
    message: "Hola, necesito orientación por una urgencia oftalmológica. Mis síntomas son "
  },
  {
    label: "Recepción",
    detail: "Hablar con el equipo administrativo.",
    message: "Hola, quiero comunicarme con recepción del Instituto Oftalmológico de Córdoba."
  }
];

document.body.classList.remove("preload");

function syncSharedSiteData() {
  document.querySelectorAll('a[href*="wa.me/"]').forEach((link) => {
    const number = link.dataset.whatsapp === "studies" ? whatsappStudies : whatsappNumber;
    const href = link.getAttribute("href") || "";
    link.setAttribute("href", href.replace(/wa\.me\/\d+/, `wa.me/${number}`));
  });

  document.querySelectorAll("[data-whatsapp-display]").forEach((node) => {
    node.textContent = whatsappDisplay;
  });
}

syncSharedSiteData();

if (siteHeader) {
  const setHeaderState = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });
}

studyImages.forEach((image) => {
  const showFallback = () => {
    const frame = image.closest(".study-photo");

    if (frame) {
      frame.classList.add("is-missing");
      frame.dataset.label = image.dataset.fallbackLabel || frame.dataset.label || "Estudio";
    }

    if (image.isConnected) {
      image.remove();
    }
  };

  image.addEventListener("error", showFallback, { once: true });

  if (image.complete && image.naturalWidth === 0) {
    showFallback();
  }
});

navLinks.forEach((link) => {
  const href = link.getAttribute("href");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  if (
    href === currentPage ||
    (currentPage === "" && href === "index.html") ||
    (["aparatologia.html", "estudios.html"].includes(currentPage) && href === "servicios.html") ||
    (["historia.html", "obras-sociales.html"].includes(currentPage) && href === "informacion.html") ||
    (["profesionales.html", "residentes.html"].includes(currentPage) && href === "quienes-somos.html")
  ) {
    link.classList.add("is-active");
    if (!link.classList.contains("nav-cta")) {
      link.setAttribute("aria-current", "page");
    }
  }
});

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (prepSearch && prepCards.length) {
  const updatePrepList = () => {
    const term = normalizeText(prepSearch.value.trim());
    let visible = 0;

    prepCards.forEach((card) => {
      const haystack = normalizeText(`${card.textContent} ${card.dataset.study}`);
      const isVisible = term.length === 0 || haystack.includes(term);
      card.classList.toggle("is-hidden", !isVisible);
      if (isVisible) visible += 1;
    });

    if (prepCount) {
      prepCount.textContent = `${visible} estudio${visible === 1 ? "" : "s"} visible${visible === 1 ? "" : "s"}`;
    }

    if (refreshPrintCount) {
      refreshPrintCount();
    }
  };

  prepSearch.addEventListener("input", () => {
    updatePrepList();
    trackEvent("study_search", { search_term: prepSearch.value.trim() });
  });

  updatePrepList();
}

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

if (profileCards.length) {
  let activeProfileFilter = "all";
  const profileGrid = document.querySelector(".profile-grid");
  const getSortableProfileName = (card) =>
    (card.querySelector("h3")?.textContent?.trim() || "").replace(/^(Dr\.|Dra\.)\s+/i, "");
  const byProfileName = (a, b) =>
    getSortableProfileName(a).localeCompare(getSortableProfileName(b), "es", { sensitivity: "base" });
  /* Socios primero y staff después (pedido institucional), alfabético dentro de cada grupo */
  const socioProfileCards = Array.from(profileCards).filter((card) => card.dataset.role !== "staff").sort(byProfileName);
  const staffProfileCards = Array.from(profileCards).filter((card) => card.dataset.role === "staff").sort(byProfileName);
  const sortedProfileCards = socioProfileCards.concat(staffProfileCards);

  const makeProfileGroupLabel = (text) => {
    const label = document.createElement("div");
    label.className = "profile-group-label";
    label.textContent = text;
    return label;
  };
  const socioGroupLabel = makeProfileGroupLabel("Socios");
  const staffGroupLabel = makeProfileGroupLabel("Staff");

  if (profileGrid && profileGrid.classList.contains("resident-grid")) {
    /* Residentes: grupos por año de residencia, alfabético dentro de cada año */
    [["1", "Primer año"], ["2", "Segundo año"], ["3", "Tercer año"]].forEach(([year, title]) => {
      const yearCards = Array.from(profileCards).filter((card) => card.dataset.year === year).sort(byProfileName);
      if (!yearCards.length) return;
      profileGrid.appendChild(makeProfileGroupLabel(title));
      yearCards.forEach((card) => profileGrid.appendChild(card));
    });
  } else if (profileGrid) {
    if (socioProfileCards.length) profileGrid.appendChild(socioGroupLabel);
    socioProfileCards.forEach((card) => profileGrid.appendChild(card));
    if (staffProfileCards.length) profileGrid.appendChild(staffGroupLabel);
    staffProfileCards.forEach((card) => profileGrid.appendChild(card));
  }

  sortedProfileCards.forEach((card) => {
    const name = card.querySelector("h3")?.textContent?.trim() || "el profesional";
    const bio = card.querySelector("ul");

    if (bio && bio.children.length > 3) {
      const toggle = document.createElement("button");
      bio.classList.add("profile-bio", "is-collapsed");
      toggle.className = "profile-bio-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Ver más";
      toggle.addEventListener("click", () => {
        const expanded = !bio.classList.contains("is-collapsed");
        bio.classList.toggle("is-collapsed", expanded);
        toggle.setAttribute("aria-expanded", String(!expanded));
        toggle.textContent = expanded ? "Ver más" : "Ver menos";
      });
      bio.insertAdjacentElement("afterend", toggle);
    }

    const action = document.createElement("a");
    action.className = "button ghost profile-card-action";
    action.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, quiero pedir un turno con ${name}. Mi nombre es `)}`;
    action.target = "_blank";
    action.rel = "noopener";
    action.dataset.whatsappDirect = "true";
    action.textContent = `Pedir turno`;
    card.appendChild(action);
  });

  /* Deep-link desde Servicios: ?area=KEY pre-filtra por especialidad (OR de varios tokens). */
  const AREA_MAP = {
    "cataratas-cornea-refractiva": { label: "Cataratas, córnea y refractiva", tokens: ["segmento", "catarata", "refractiva", "cornea", "trasplante"] },
    "glaucoma": { label: "Glaucoma", tokens: ["glaucoma"] },
    "retina": { label: "Retina y mácula", tokens: ["retina", "vitreo"] },
    "neuro": { label: "Neurooftalmología", tokens: ["neuro"] },
    "pediatrica": { label: "Oftalmología pediátrica", tokens: ["pediatrica", "estrabismo"] },
    "parpados": { label: "Párpados y vías lagrimales", tokens: ["oculoplastica", "parpados"] }
  };
  let activeAreaTokens = null;
  let areaBanner = null;
  const cardSpecialtyTokens = (card) => (card.dataset.specialty || "").toLowerCase().split(/\s+/).filter(Boolean);

  const updateProfileList = () => {
    const term = normalizeText(profileSearch ? profileSearch.value.trim() : "");
    let visible = 0;

    sortedProfileCards.forEach((card) => {
      const specialties = normalizeText(card.dataset.specialty || "");
      const haystack = normalizeText(`${card.textContent} ${specialties}`);
      const matchesSearch = !term || haystack.includes(term);
      const matchesFilter = activeAreaTokens
        ? activeAreaTokens.some((t) => cardSpecialtyTokens(card).includes(t))
        : (activeProfileFilter === "all" || specialties.includes(activeProfileFilter));
      const isVisible = matchesSearch && matchesFilter;

      card.classList.toggle("is-hidden", !isVisible);
      if (isVisible) visible += 1;
    });

    socioGroupLabel.classList.toggle("is-hidden", !socioProfileCards.some((card) => !card.classList.contains("is-hidden")));
    staffGroupLabel.classList.toggle("is-hidden", !staffProfileCards.some((card) => !card.classList.contains("is-hidden")));

    if (profileCount) {
      profileCount.textContent = `${visible} profesional${visible === 1 ? "" : "es"} visible${visible === 1 ? "" : "s"}`;
    }
  };

  if (profileSearch) {
    profileSearch.addEventListener("input", () => {
      updateProfileList();
      trackEvent("professional_search", { search_term: profileSearch.value.trim() });
    });
  }

  profileFilters.forEach((button) => {
    button.addEventListener("click", () => {
      if (activeAreaTokens) { activeAreaTokens = null; if (areaBanner) { areaBanner.remove(); areaBanner = null; } }
      activeProfileFilter = button.dataset.profileFilter || "all";
      profileFilters.forEach((item) => item.classList.toggle("is-active", item === button));
      updateProfileList();
      trackEvent("professional_filter", { filter: activeProfileFilter });
    });
  });

  updateProfileList();

  /* Aplicar ?area= cuando el visitante llega desde una tarjeta de Servicios. */
  const clearArea = () => {
    activeAreaTokens = null;
    if (areaBanner) { areaBanner.remove(); areaBanner = null; }
    activeProfileFilter = "all";
    profileFilters.forEach((item) => item.classList.toggle("is-active", item.dataset.profileFilter === "all"));
    updateProfileList();
  };

  try {
    const areaKey = new URLSearchParams(window.location.search).get("area");
    const area = areaKey ? AREA_MAP[areaKey] : null;
    if (area && profileGrid) {
      activeAreaTokens = area.tokens;
      profileFilters.forEach((item) => item.classList.remove("is-active"));
      const filtersBar = document.querySelector(".profile-filters");
      areaBanner = document.createElement("div");
      areaBanner.className = "area-banner";
      areaBanner.innerHTML = "Mostrando especialistas en <strong></strong>";
      areaBanner.querySelector("strong").textContent = area.label;
      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "area-clear";
      clearBtn.textContent = "Ver todos ✕";
      clearBtn.addEventListener("click", clearArea);
      areaBanner.appendChild(clearBtn);
      if (filtersBar) filtersBar.insertAdjacentElement("beforebegin", areaBanner);
      updateProfileList();
      trackEvent("service_to_specialists", { area: areaKey });
      const target = filtersBar || profileGrid;
      requestAnimationFrame(() => {
        const y = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: _prefersReducedMotion ? "auto" : "smooth" });
      });
    }
  } catch (e) {}
}

if (osSearch && osItems.length) {
  const updateInsuranceList = () => {
    const term = normalizeText(osSearch.value.trim());
    let visible = 0;

    osItems.forEach((item) => {
      const match = !term || normalizeText(item.textContent).includes(term);
      item.hidden = !match;
      if (match) visible += 1;
    });

    if (osNotFound) {
      osNotFound.hidden = visible > 0 || !term;
    }
  };

  osSearch.addEventListener("input", () => {
    updateInsuranceList();
    trackEvent("insurance_search", { search_term: osSearch.value.trim() });
  });

  updateInsuranceList();
}

const contactForm = document.querySelector("#contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.querySelector("#formNombre").value.trim();
    const telefono = document.querySelector("#formTelefono").value.trim();
    const tipo = document.querySelector("#formTipo").value;
    const mensaje = document.querySelector("#formMensaje").value.trim();

    if (!nombre || !telefono || !tipo) return;

    let text = `Hola, soy ${nombre}. Mi teléfono es ${telefono}. Consulta: ${tipo}`;
    if (mensaje) text += `. ${mensaje}`;

    trackEvent("contact_form_whatsapp", { consultation_type: tipo });
    const number = tipo === "Estudio complementario" ? whatsappStudies : whatsappNumber;
    openWhatsapp(text, number);
  });
}

function openWhatsapp(message, number) {
  trackEvent("whatsapp_open", { message_preview: message.slice(0, 80) });
  window.open(`https://wa.me/${number || whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}

function createAppointmentModal() {
  const modal = document.createElement("div");
  modal.className = "appointment-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="appointment-backdrop" data-appointment-close></div>
    <section class="appointment-dialog" role="dialog" aria-modal="true" aria-labelledby="appointmentTitle">
      <button class="appointment-close" type="button" aria-label="Cerrar" data-appointment-close>×</button>
      <p class="eyebrow">Turnos y consultas</p>
      <h2 id="appointmentTitle">Elegí cómo querés comunicarte</h2>
      <p>Te abrimos WhatsApp con el mensaje preparado para que recepción pueda orientarte más rápido.</p>
      <div class="appointment-options"></div>
    </section>
  `;

  const options = modal.querySelector(".appointment-options");
  appointmentIntents.forEach((intent) => {
    const button = document.createElement("button");
    button.className = "appointment-option";
    button.type = "button";
    button.innerHTML = `<strong>${intent.label}</strong><span>${intent.detail}</span>`;
    button.addEventListener("click", () => {
      closeAppointmentModal();
      trackEvent("appointment_intent", { intent: intent.label });
      openWhatsapp(intent.message, intent.number);
    });
    options.appendChild(button);
  });

  document.body.appendChild(modal);
  return modal;
}

let appointmentModal;
let lastAppointmentTrigger;

function getAppointmentModal() {
  if (!appointmentModal) {
    appointmentModal = createAppointmentModal();

    appointmentModal.addEventListener("click", (event) => {
      if (event.target.closest("[data-appointment-close]")) {
        closeAppointmentModal();
      }
    });
  }

  return appointmentModal;
}

function openAppointmentModal(trigger) {
  lastAppointmentTrigger = trigger || document.activeElement;
  const modal = getAppointmentModal();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("appointment-open");
  const firstOption = modal.querySelector(".appointment-option");
  if (firstOption) firstOption.focus();
}

function closeAppointmentModal() {
  if (!appointmentModal) return;
  appointmentModal.classList.remove("is-open");
  appointmentModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("appointment-open");

  if (lastAppointmentTrigger && typeof lastAppointmentTrigger.focus === "function") {
    lastAppointmentTrigger.focus();
  }
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link) return;

  const href = link.getAttribute("href") || "";
  const text = (link.textContent || "").trim().toLowerCase();
  const isTurnoLink =
    href.includes(`wa.me/${whatsappNumber}`) &&
    link.dataset.whatsappDirect !== "true" &&
    (link.classList.contains("nav-cta") ||
      link.classList.contains("floating-whatsapp") ||
      text.includes("pedir turno") ||
      text.includes("escribir por whatsapp") ||
      text.includes("consultar cobertura"));

  if (!isTurnoLink) return;

  event.preventDefault();
  trackEvent("appointment_modal_open", { label: text, href });
  openAppointmentModal(link);
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("a[href]");
  if (!target) return;

  const href = target.getAttribute("href") || "";

  if (target.dataset.whatsappDirect === "true") {
    trackEvent("professional_whatsapp", {
      label: target.closest(".profile-card")?.querySelector("h3")?.textContent?.trim() || ""
    });
  } else if (href.includes("google.com/maps")) {
    trackEvent("map_click", { href });
  } else if (href.includes("instagram.com")) {
    trackEvent("instagram_click", { href });
  } else if (href.includes("miportal.sanatorioallende.com")) {
    trackEvent("patient_portal_click", { href });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAppointmentModal();
  }
});

// Testimonial carousel
const testimonialCarousel = document.querySelector("#testimonialCarousel");
if (testimonialCarousel) {
  const cards = Array.from(testimonialCarousel.querySelectorAll(".testimonial-card"));
  let current = 0;
  let autoTimer;

  function goTo(index) {
    cards[current].classList.remove("is-active");
    cards[current].setAttribute("aria-hidden", "true");
    current = (index + cards.length) % cards.length;
    cards[current].classList.add("is-active");
    cards[current].setAttribute("aria-hidden", "false");
  }

  function startTimer() {
    if (_prefersReducedMotion) return;
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5200);
  }

  testimonialCarousel.addEventListener("mouseenter", () => clearInterval(autoTimer));
  testimonialCarousel.addEventListener("focusin", () => clearInterval(autoTimer));
  testimonialCarousel.addEventListener("mouseleave", startTimer);
  testimonialCarousel.addEventListener("focusout", startTimer);

  startTimer();
}

if ("IntersectionObserver" in window && revealItems.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    /* threshold 0: una sección más alta que el viewport (ej. 18 fichas apiladas
       en móvil) nunca alcanza un ratio de 0.06, y quedaría invisible. */
    { threshold: 0, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

/* ═══════════════════════════════════════════════════════════════ */
/* ══ AESTHETIC UPGRADE LAYER — micro-interactions ══════════════ */
/* Additive behaviours: cursor halo on hero, animated counters,    */
/* scroll progress bar. All guards check for support + motion pref. */
/* ═══════════════════════════════════════════════════════════════ */

/* — 1. Hero cursor halo (desktop / fine pointer only) — */
const _heroEl = document.querySelector(".hero");
if (_heroEl && !_prefersReducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  let _haloRaf = null;
  let _haloX = 30;
  let _haloY = 40;
  const _flushHalo = () => {
    _heroEl.style.setProperty("--mx", _haloX + "%");
    _heroEl.style.setProperty("--my", _haloY + "%");
    _haloRaf = null;
  };
  _heroEl.addEventListener("pointermove", (e) => {
    const rect = _heroEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    _haloX = ((e.clientX - rect.left) / rect.width) * 100;
    _haloY = ((e.clientY - rect.top) / rect.height) * 100;
    if (_haloRaf === null) _haloRaf = requestAnimationFrame(_flushHalo);
  }, { passive: true });
  _heroEl.addEventListener("pointerleave", () => {
    if (_haloRaf !== null) {
      cancelAnimationFrame(_haloRaf);
      _haloRaf = null;
    }
    _haloX = 30;
    _haloY = 40;
    _flushHalo();
  });
}

/* — 2. Animated stat counters (counts up when entering viewport) — */
const _statTargets = document.querySelectorAll(".stats a strong, .history-stats > div > strong");
if ("IntersectionObserver" in window && _statTargets.length) {
  const _animateCount = (el) => {
    const raw = (el.textContent || "").trim();
    const match = raw.match(/^(\d{1,6})(\+?.*)$/);
    if (!match) return;
    const target = parseInt(match[1], 10);
    const suffix = match[2] || "";
    if (_prefersReducedMotion || target === 0) {
      el.textContent = target + suffix;
      return;
    }
    const duration = Math.min(1700, 700 + target * 0.6);
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const _statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = "1";
          _animateCount(entry.target);
          _statObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.55 }
  );

  _statTargets.forEach((el) => _statObserver.observe(el));
}

/* — Impresión: selector de estudios + botón "Imprimir indicaciones" — */
const printStudies = document.querySelector("#printStudies");
if (printStudies) {
  let printBar = null;

  const updatePrintCount = () => {
    if (!printBar) return;
    const count = document.querySelectorAll(".prep-card.print-selected:not(.is-hidden)").length;
    const goButton = printBar.querySelector("[data-print-go]");
    goButton.textContent = count === 1 ? "Imprimir 1 estudio" : `Imprimir ${count} estudios`;
    goButton.disabled = count === 0;
  };

  refreshPrintCount = updatePrintCount;

  const exitPrintMode = () => {
    document.body.classList.remove("print-select-mode");
    if (printBar) printBar.hidden = true;
  };

  const enterPrintMode = () => {
    document.body.classList.add("print-select-mode");

    document.querySelectorAll(".prep-card").forEach((card) => {
      if (!card.querySelector(".prep-pick")) {
        const label = document.createElement("label");
        label.className = "prep-pick";
        const box = document.createElement("input");
        box.type = "checkbox";
        box.checked = true;
        box.addEventListener("change", () => {
          card.classList.toggle("print-selected", box.checked);
          updatePrintCount();
        });
        label.appendChild(box);
        label.appendChild(document.createTextNode("Imprimir este estudio"));
        card.prepend(label);
      }
      card.classList.add("print-selected");
      card.querySelector(".prep-pick input").checked = true;
    });

    if (!printBar) {
      printBar = document.createElement("div");
      printBar.className = "print-bar";
      printBar.innerHTML = `
        <p>Destildá los estudios que no necesites y después tocá imprimir.</p>
        <div class="print-bar-actions">
          <button type="button" class="button primary" data-print-go>Imprimir estudios</button>
          <button type="button" class="button ghost" data-print-cancel>Cancelar</button>
        </div>
      `;
      const toolbar = printStudies.closest(".prep-toolbar");
      if (toolbar) toolbar.insertAdjacentElement("afterend", printBar);

      printBar.querySelector("[data-print-go]").addEventListener("click", () => {
        trackEvent("print_studies", {
          selected: document.querySelectorAll(".prep-card.print-selected:not(.is-hidden)").length,
          search_term: prepSearch ? prepSearch.value.trim() : ""
        });
        window.print();
      });
      printBar.querySelector("[data-print-cancel]").addEventListener("click", exitPrintMode);
    }

    printBar.hidden = false;
    updatePrintCount();
    printBar.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  printStudies.addEventListener("click", () => {
    if (document.body.classList.contains("print-select-mode")) {
      exitPrintMode();
    } else {
      trackEvent("print_mode_open", {});
      enterPrintMode();
    }
  });

  window.addEventListener("afterprint", exitPrintMode);
}

/* — Impresión: abrir todos los <details> para que se imprima su contenido — */
window.addEventListener("beforeprint", () => {
  document.querySelectorAll("details:not([open])").forEach((detail) => {
    detail.dataset.printOpened = "1";
    detail.open = true;
  });
});

window.addEventListener("afterprint", () => {
  document.querySelectorAll("details[data-print-opened]").forEach((detail) => {
    delete detail.dataset.printOpened;
    detail.open = false;
  });
});

/* — 3. Scroll progress bar (a thin gradient line at top) — */
(() => {
  if (_prefersReducedMotion) return;
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  let scrollRaf = null;
  const update = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
    bar.style.width = pct + "%";
    scrollRaf = null;
  };
  window.addEventListener("scroll", () => {
    if (scrollRaf === null) scrollRaf = requestAnimationFrame(update);
  }, { passive: true });
  update();
})();


/* ── Carrusel de novedades (portada): auto-avance + flechas ── */
const newsTrack = document.querySelector(".news-track");
if (newsTrack) {
  const newsStep = () => {
    const card = newsTrack.querySelector(".news-card");
    return card ? card.getBoundingClientRect().width + 18 : newsTrack.clientWidth;
  };
  const newsAtEnd = () =>
    newsTrack.scrollLeft + newsTrack.clientWidth >= newsTrack.scrollWidth - 12;
  const newsGo = (dir) => {
    if (dir > 0 && newsAtEnd()) {
      newsTrack.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    newsTrack.scrollBy({ left: dir * newsStep(), behavior: "smooth" });
  };

  document.querySelector("[data-news-prev]")?.addEventListener("click", () => newsGo(-1));
  document.querySelector("[data-news-next]")?.addEventListener("click", () => newsGo(1));

  const featuredDotsHost = document.querySelector(".featured-dots");
  if (featuredDotsHost && newsTrack.classList.contains("featured-track")) {
    const featuredSlides = Array.from(newsTrack.children);
    const featuredDots = featuredSlides.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "featured-dot";
      dot.setAttribute("aria-label", `Ver campaña ${i + 1} de ${featuredSlides.length}`);
      dot.addEventListener("click", () =>
        newsTrack.scrollTo({ left: i * newsTrack.clientWidth, behavior: "smooth" })
      );
      featuredDotsHost.appendChild(dot);
      return dot;
    });
    const syncFeaturedDots = () => {
      const idx = Math.round(newsTrack.scrollLeft / Math.max(1, newsTrack.clientWidth));
      featuredDots.forEach((dot, i) => dot.classList.toggle("is-active", i === idx));
    };
    syncFeaturedDots();
    newsTrack.addEventListener("scroll", syncFeaturedDots, { passive: true });
  }

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const newsInterval = parseInt(newsTrack.dataset.newsInterval || "4500", 10);
    let newsTimer = setInterval(() => newsGo(1), newsInterval);
    const newsStop = () => clearInterval(newsTimer);
    const newsStart = () => {
      newsStop();
      newsTimer = setInterval(() => newsGo(1), newsInterval);
    };
    ["mouseenter", "focusin", "touchstart", "pointerdown"].forEach((ev) =>
      newsTrack.addEventListener(ev, newsStop, { passive: true })
    );
    ["mouseleave", "focusout"].forEach((ev) => newsTrack.addEventListener(ev, newsStart));
  }
}


/* ── Invitación a reseñar en Google: estrella flotante + modal suave ── */
(function () {
  var REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJY-UuEI6iMpQRd2V8UBE54po";
  var SEEN_KEY = "iocReviewAutoSeen";
  if (document.body.classList.contains("redirect-stub")) return;

  function seen() { try { return localStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) {} }

  var starPath = "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
  function starsSVG(cls) {
    var s = '<div class="' + cls + '" role="img" aria-label="Calificá al Instituto">';
    for (var i = 1; i <= 5; i++) {
      s += '<button type="button" class="review-star" data-star="' + i + '" aria-label="' + i + ' estrella' + (i > 1 ? 's' : '') + '">' +
           '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="' + starPath + '"/></svg></button>';
    }
    return s + '</div>';
  }

  function openGoogle() { window.open(REVIEW_URL, "_blank", "noopener"); }

  /* ---- Modal ---- */
  var overlay = document.createElement("div");
  overlay.className = "review-modal-overlay";
  overlay.setAttribute("hidden", "");
  overlay.innerHTML =
    '<div class="review-modal" role="dialog" aria-modal="true" aria-labelledby="reviewModalTitle">' +
      '<button type="button" class="review-modal-close" aria-label="Cerrar">&times;</button>' +
      starsSVG("review-modal-stars") +
      '<h2 id="reviewModalTitle">¿Nos ayudás a crecer?</h2>' +
      '<p>Tu reseña ayuda a que más personas confíen en el IOC para cuidar su salud visual. Son solo dos minutos.</p>' +
      '<button type="button" class="button primary review-modal-go">Dejar mi reseña en Google</button>' +
      '<button type="button" class="review-modal-later">Ahora no</button>' +
    '</div>';
  document.body.appendChild(overlay);

  var modalCard = overlay.querySelector(".review-modal");
  function openModal() { overlay.removeAttribute("hidden"); document.body.classList.add("review-modal-open"); markSeen(); }
  function closeModal() { overlay.setAttribute("hidden", ""); document.body.classList.remove("review-modal-open"); }

  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
  overlay.querySelector(".review-modal-close").addEventListener("click", closeModal);
  overlay.querySelector(".review-modal-later").addEventListener("click", closeModal);
  overlay.querySelector(".review-modal-go").addEventListener("click", function () { openGoogle(); closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !overlay.hasAttribute("hidden")) closeModal(); });

  /* estrellas: hover rellena, click abre Google */
  var modalStars = Array.prototype.slice.call(overlay.querySelectorAll(".review-modal-stars .review-star"));
  function paint(host, upto) {
    Array.prototype.forEach.call(host.querySelectorAll(".review-star"), function (b) {
      b.classList.toggle("is-lit", parseInt(b.dataset.star, 10) <= upto);
    });
  }
  modalStars.forEach(function (btn) {
    btn.addEventListener("mouseenter", function () { paint(btn.parentNode, parseInt(btn.dataset.star, 10)); });
    btn.addEventListener("click", function () { openGoogle(); closeModal(); });
  });
  overlay.querySelector(".review-modal-stars").addEventListener("mouseleave", function () { paint(this, 0); });

  /* ---- Estrella flotante (siempre disponible, esquina inferior izquierda) ---- */
  var fab = document.createElement("button");
  fab.type = "button";
  fab.className = "review-fab";
  fab.setAttribute("aria-label", "Dejá tu reseña en Google");
  fab.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="' + starPath + '"/></svg><span>Reseñá</span>';
  fab.addEventListener("click", openModal);
  document.body.appendChild(fab);

  /* ---- Disparador automático a los ~13 s, una sola vez por visitante ---- */
  if (!seen()) {
    setTimeout(function () { if (!seen() && document.visibilityState === "visible") openModal(); }, 13000);
  }
})();



/* ---- Fotos de las cintas de retratos (quienes-somos) ----
   La cinta se anima con transform y el lazy-load nativo de iOS calcula la
   posicion SIN la animacion: nunca dispara la carga de los retratos lejanos.
   Cuando la seccion se acerca al viewport, pasamos sus fotos a carga inmediata. */
(function () {
  var carousels = document.querySelectorAll(".people-carousel");
  if (!carousels.length) return;

  function eagerLoad(root) {
    Array.prototype.forEach.call(root.querySelectorAll('img[loading="lazy"]'), function (img) {
      img.removeAttribute("loading");
    });
  }

  if (!("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(carousels, eagerLoad);
    return;
  }

  var portraitObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      eagerLoad(entry.target);
      portraitObserver.unobserve(entry.target);
    });
  }, { rootMargin: "600px 0px" });

  Array.prototype.forEach.call(carousels, function (c) { portraitObserver.observe(c); });
})();
