const I18N = {
  sr: {
    title: "Planer učenja",
    subject: "Naziv predmeta",
    date: "Datum ispita",
    hours: "Sati nedeljno za učenje",
    submit: "Napravi plan",
    tabActive: "Aktivni",
    tabFinished: "Završeni",
    emptyActive: "Nema aktivnih planova.",
    emptyFinished: "Nema završenih planova.",
    del: "Obriši",
    confirmDel: "Da li sigurno želiš da obrišeš ovaj plan?",
    info: (p) => `ispit: ${p.exam_date} · ${p.days_left} dana · ${p.weeks} nedelja · ${p.hours_per_week} h/ned`,
    week: "Nedelja",
    progress: (d, n) => `Završeno: ${d} / ${n}`,
    h: "h",
    network: "Greška u vezi sa serverom.",
    learn_main: "Učenje gradiva: {s} (nove lekcije)",
    learn_second: "Pravljenje beleški i rezimea: {s}",
    practice_main: "Vežbanje zadataka: {s}",
    practice_second: "Rešavanje prethodnih ispita: {s}",
    revise_main: "Ponavljanje celog gradiva: {s}",
    revise_second: "Ponavljanje najtežih delova: {s}",
    final_main: "Završno ponavljanje i probni test: {s}",
    final_second: "Odmor i lagano pregledanje beleški: {s}",
    finish: "Označi kao završeno",
    reopen: "Ponovo otvori",
  },
  hu: {
    title: "Tanulási tervező",
    subject: "Tantárgy neve",
    date: "Vizsga időpontja",
    hours: "Heti tanulásra szánt órák",
    submit: "Terv készítése",
    tabActive: "Aktív",
    tabFinished: "Befejezett",
    emptyActive: "Nincs aktív terv.",
    emptyFinished: "Nincs befejezett terv.",
    del: "Törlés",
    confirmDel: "Biztosan törlöd ezt a tervet?",
    info: (p) => `vizsga: ${p.exam_date} · ${p.days_left} nap · ${p.weeks} hét · ${p.hours_per_week} óra/hét`,
    week: "Hét",
    progress: (d, n) => `Kész: ${d} / ${n}`,
    h: "óra",
    network: "Hiba a szerverrel való kapcsolatban.",
    learn_main: "Tananyag tanulása: {s} (új leckék)",
    learn_second: "Jegyzetek és összefoglaló készítése: {s}",
    practice_main: "Feladatok gyakorlása: {s}",
    practice_second: "Korábbi vizsgák megoldása: {s}",
    revise_main: "Teljes anyag ismétlése: {s}",
    revise_second: "A legnehezebb részek ismétlése: {s}",
    final_main: "Záró ismétlés és próbateszt: {s}",
    final_second: "Pihenés és könnyed jegyzetátnézés: {s}",
    finish: "Befejezettnek jelölöm",
    reopen: "Újranyitás",
  },

    en: {
    title: "Study planner",
    subject: "Subject name",
    date: "Exam date",
    hours: "Hours per week available for studying",
    submit: "Create plan",
    tabActive: "Active",
    tabFinished: "Finished",
    emptyActive: "No active plans.",
    emptyFinished: "No finished plans.",
    del: "Delete",
    confirmDel: "Are you sure you want to delete this plan?",
    info: (p) => `exam: ${p.exam_date} · ${p.days_left} days · ${p.weeks} weeks · ${p.hours_per_week} h/week`,
    week: "Week",
    progress: (d, n) => `Done: ${d} / ${n}`,
    h: "h",
    network: "Error connecting to the server.",
    learn_main: "Study the material: {s} (new lessons)",
    learn_second: "Make notes and a summary: {s}",
    practice_main: "Practice exercises: {s}",
    practice_second: "Solve past exams: {s}",
    revise_main: "Review all material: {s}",
    revise_second: "Review the hardest parts: {s}",
    final_main: "Final review and mock test: {s}",
    final_second: "Rest and light review of notes: {s}",
    finish: "Mark as finished",
    reopen: "Reopen",
  },
};

let lang = localStorage.getItem("lang") || "sr";
let plans = []; // legújabb elöl

let tab = "active";

const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const isFinished = (p) =>
  p.finished || p.activities.every((a) => a.done) || p.exam_date < todayStr();

const $ = (id) => document.getElementById(id);
const t = (key) => I18N[lang][key];

function saveIds() {
  localStorage.setItem("planIds", JSON.stringify(plans.map((p) => p.id)));
}

function setMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n) => String(n).padStart(2, "0");
  $("exam_date").min = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function applyLang() {
  document.documentElement.lang = lang;
  $("t-title").textContent = t("title");
  $("t-subject").textContent = t("subject");
  $("t-date").textContent = t("date");
  $("t-hours").textContent = t("hours");
  $("t-submit").textContent = t("submit");
  document.querySelectorAll(".lang-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.lang === lang));
  renderAll();
}

function buildCard(plan) {
  const card = document.createElement("section");
  card.className = "card";
  card.dataset.id = plan.id;

  const head = document.createElement("div");
  head.className = "plan-head";
  const titleBox = document.createElement("div");
  const h2 = document.createElement("h2");
  h2.textContent = plan.subject;
  const info = document.createElement("p");
  info.className = "muted";
  info.textContent = t("info")(plan);
  titleBox.append(h2, info);
  const del = document.createElement("button");
  del.className = "delete-btn";
  del.textContent = t("del");
  del.addEventListener("click", () => removePlan(plan.id));
  const actions = document.createElement("div");
  actions.className = "plan-actions";
  // gomb csak akkor kell, ha aktív a terv, vagy kézzel lett lezárva
  if (!isFinished(plan) || plan.finished) {
    const fin = document.createElement("button");
    fin.className = "finish-btn";
    fin.textContent = plan.finished ? t("reopen") : t("finish");
    fin.addEventListener("click", () => setFinished(plan.id));
    actions.appendChild(fin);
  }
  actions.appendChild(del);
  head.append(titleBox, actions);
  card.appendChild(head);

  const done = plan.activities.filter((a) => a.done).length;
  const total = plan.activities.length;
  const prog = document.createElement("div");
  prog.className = "progress";
  const bar = document.createElement("div");
  bar.id = "progress-bar";
  bar.style.width = `${(done / total) * 100}%`;
  prog.appendChild(bar);
  const ptxt = document.createElement("p");
  ptxt.className = "muted";
  ptxt.textContent = t("progress")(done, total);
  card.append(prog, ptxt);

  const weeks = {};
  plan.activities.forEach((a) => (weeks[a.week] = weeks[a.week] || []).push(a));
  Object.keys(weeks).forEach((w) => {
    const div = document.createElement("div");
    div.className = "week";
    const h3 = document.createElement("h3");
    h3.textContent = `${t("week")} ${w} (${weeks[w][0].week_start})`;
    div.appendChild(h3);
    weeks[w].forEach((a) => {
      const row = document.createElement("label");
      row.className = "activity" + (a.done ? " done" : "");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = a.done;
      cb.addEventListener("change", () => toggle(plan.id, a.id));
      const txt = document.createElement("span");
      txt.className = "txt";
      txt.textContent = t(`${a.phase}_${a.part}`).replace("{s}", plan.subject);
      const hrs = document.createElement("span");
      hrs.className = "hrs";
      hrs.textContent = `${a.hours} ${t("h")}`;
      row.append(cb, txt, hrs);
      div.appendChild(row);
    });
    card.appendChild(div);
  });
  return card;
}

function renderAll() {
  const fin = plans.filter(isFinished);
  const act = plans.filter((p) => !isFinished(p));
  $("tab-active").textContent = `${t("tabActive")} (${act.length})`;
  $("tab-finished").textContent = `${t("tabFinished")} (${fin.length})`;
  document.querySelectorAll(".tab").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === tab));
  const list = tab === "active" ? act : fin;
  $("empty").textContent = list.length ? "" : t(tab === "active" ? "emptyActive" : "emptyFinished");
  const box = $("plans");
  box.innerHTML = "";
  list.forEach((p) => box.appendChild(buildCard(p)));
}

async function toggle(planId, actId) {
  try {
    const r = await fetch(`/api/plan/${planId}/activity/${actId}/toggle?lang=${lang}`, { method: "POST" });
    const updated = await r.json();
    const i = plans.findIndex((p) => p.id === planId);
    if (i >= 0) plans[i] = updated;
    const y = window.scrollY;
    renderAll();
    window.scrollTo(0, y);
  } catch (e) {
    $("error").textContent = t("network");
  }
}

async function setFinished(planId) {
  try {
    const r = await fetch(`/api/plan/${planId}/finish?lang=${lang}`, { method: "POST" });
    const updated = await r.json();
    const i = plans.findIndex((p) => p.id === planId);
    if (i >= 0) plans[i] = updated;
    const y = window.scrollY;
    renderAll();
    window.scrollTo(0, y);
  } catch (e) {
    $("error").textContent = t("network");
  }
}

async function removePlan(planId) {
  if (!confirm(t("confirmDel"))) return;
  try {
    await fetch(`/api/plan/${planId}`, { method: "DELETE" });
  } catch (e) { /* a helyi listából akkor is töröljük */ }
  plans = plans.filter((p) => p.id !== planId);
  saveIds();
  renderAll();
}

$("plan-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("error").textContent = "";
  try {
    const r = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: $("subject").value,
        exam_date: $("exam_date").value,
        hours_per_week: $("hours").value,
        lang,
      }),
    });
    const data = await r.json();
    if (!r.ok) { $("error").textContent = data.error; return; }
    plans.unshift(data);
    tab = "active";
    saveIds();
    renderAll();
    $("plan-form").reset();
    document.querySelector(`[data-id="${data.id}"]`).scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    $("error").textContent = t("network");
  }
});

document.querySelectorAll(".tab").forEach((b) =>
  b.addEventListener("click", () => {
    tab = b.dataset.tab;
    renderAll();
  }));

document.querySelectorAll(".lang-btn").forEach((b) =>
  b.addEventListener("click", () => {
    lang = b.dataset.lang;
    localStorage.setItem("lang", lang);
    applyLang();
  }));

async function init() {
  setMinDate();
  applyLang();
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem("planIds") || "[]"); } catch (e) {}
  // régi, egyterves verzió azonosítója
  const old = localStorage.getItem("planId");
  if (old && !ids.includes(old)) ids.push(old);
  localStorage.removeItem("planId");

  const results = await Promise.all(ids.map(async (id) => {
    try {
      const r = await fetch(`/api/plan/${id}?lang=${lang}`);
      return r.ok ? await r.json() : null;
    } catch (e) { return null; }
  }));
  plans = results.filter(Boolean);
  saveIds();
  renderAll();
}
init();