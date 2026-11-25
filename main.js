const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const toggle = document.querySelector("[data-nav-toggle]");
const form = document.querySelector("[data-form]");
const access = document.querySelector(".access");
const error = document.querySelector("[data-error]");
const success = document.querySelector("[data-success]");

const onScroll = () => {
  header.classList.toggle("is-stuck", window.scrollY > 8);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  });
});

const links = [...nav.querySelectorAll("a")];
const storyIds = new Set(["#matieres", "#fiches", "#progression"]);
const sections = links
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter((section) => section && !section.closest("[data-story]"));

const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === id));
    });
  },
  { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 }
);
sections.forEach((section) => spy.observe(section));

const story = document.querySelector("[data-story]");
const panes = [...story.querySelectorAll(".story-pane")];
const phones = [...story.querySelectorAll(".story-phone")];
const ticks = [...story.querySelectorAll(".story-progress span")];
const desktop = window.matchMedia("(min-width: 981px)");

const setStoryStep = (index) => {
  panes.forEach((pane, i) => pane.classList.toggle("is-on", i === index));
  phones.forEach((phone, i) => phone.classList.toggle("is-on", i === index));
  ticks.forEach((tick, i) => tick.classList.toggle("is-on", i === index));
  const id = `#${panes[index].id}`;
  const box = story.getBoundingClientRect();
  const storyVisible = box.top < window.innerHeight * 0.45 && box.bottom > window.innerHeight * 0.55;
  if (!storyVisible) return;
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (storyIds.has(href)) link.classList.toggle("is-active", href === id);
  });
};

const onStoryScroll = () => {
  if (!desktop.matches) return;
  const box = story.getBoundingClientRect();
  const scrollable = story.offsetHeight - window.innerHeight;
  const passed = Math.min(Math.max(-box.top, 0), scrollable);
  const progress = scrollable > 0 ? passed / scrollable : 0;
  const index = Math.min(panes.length - 1, Math.floor(progress * panes.length));
  setStoryStep(index);
};

onStoryScroll();
window.addEventListener("scroll", onStoryScroll, { passive: true });
window.addEventListener("resize", onStoryScroll);

document.querySelectorAll('a[href="#matieres"], a[href="#fiches"], a[href="#progression"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!desktop.matches) return;
    event.preventDefault();
    const id = link.getAttribute("href").slice(1);
    const index = Math.max(0, panes.findIndex((pane) => pane.id === id));
    const scrollable = story.offsetHeight - window.innerHeight;
    const top = window.scrollY + story.getBoundingClientRect().top + ((index + 0.12) / panes.length) * scrollable;
    window.scrollTo({ top, behavior: "smooth" });
  });
});

const storageKey = "asclea-acces";

const showSuccess = (entry) => {
  access.classList.add("is-done");
  form.hidden = true;
  success.hidden = false;
  success.querySelector("[data-success-title]").textContent = `${entry.prenom}, c’est noté.`;
  success.querySelector("[data-success-copy]").textContent =
    `On te prévient à ${entry.email} dès que les places ${entry.cycle} ouvrent.`;
};

const saved = localStorage.getItem(storageKey);
if (saved) {
  try {
    showSuccess(JSON.parse(saved));
  } catch {
    localStorage.removeItem(storageKey);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "");
  if (!data.prenom.trim() || !emailOk || !data.cycle) {
    error.hidden = false;
    return;
  }
  error.hidden = true;
  const entry = {
    prenom: data.prenom.trim(),
    email: data.email.trim(),
    cycle: data.cycle,
    faculte: (data.faculte || "").trim(),
  };
  localStorage.setItem(storageKey, JSON.stringify(entry));
  showSuccess(entry);
});

const stats = document.querySelector(".stats");
const counters = [...document.querySelectorAll(".stats-grid strong")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const formatCount = (value) =>
  Math.round(value).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, "\u00a0");

const runCount = (el) => {
  const target = Number(el.dataset.count);
  const duration = 1300;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = formatCount(target * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = "0";
  requestAnimationFrame(tick);
};

if (stats && counters.length && !reduceMotion) {
  counters.forEach((el) => {
    el.dataset.count = el.textContent.replace(/\D/g, "");
  });
  const statsSpy = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      counters.forEach(runCount);
      statsSpy.disconnect();
    },
    { threshold: 0.5 }
  );
  statsSpy.observe(stats);
}
