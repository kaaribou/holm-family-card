/* holm-family-card — https://github.com/kaaribou/holm-family-card — licence MIT — v1.0.1 */
// holm-family-card — qui est où : présence, lieu, distance, batterie, source (GPS / Wi-Fi)
// Tout est détecté à partir des entités « person » : traqueurs, batterie et adresse du téléphone,
// capteurs de l'intégration Proximité (distance, sens du déplacement).
// type: custom:holm-family-card
// title: La famille
// stale_hours: 3          (au-delà : « dernière position il y a … »)
// show_address: true      show_frame: true
// persons:
//   - entity: person.alice
//     name: Alice   color: "#e05a8a"
//     battery: sensor.xxx   address: sensor.xxx   distance: sensor.xxx   direction: sensor.xxx   (optionnels, sinon auto)
//     wifi: [device_tracker.xxx]   (traqueurs du routeur : « à la maison » dès que le téléphone est sur le Wi-Fi)
(() => {
// Garde la position de défilement pendant un nouveau rendu complet de la carte (iPhone / iPad : WebKit n'a pas de
// « scroll anchoring » et la page remontait d'un coup). On fige la hauteur de la carte et on remet le défilement en place.
const keepScroll = (host, fn) => {
  const saved = [];
  let n = host;
  while (n) {
    n = n.assignedSlot || n.parentNode || n.host;
    if (n && n.nodeType === 1 && n.scrollHeight > n.clientHeight) saved.push([n, n.scrollTop]);
  }
  const se = document.scrollingElement;
  if (se) saved.push([se, se.scrollTop]);
  const h = host.offsetHeight;
  if (h) host.style.minHeight = `${h}px`;
  try { return fn(); } finally {
    const restore = () => saved.forEach(([el, t]) => { if (Math.abs(el.scrollTop - t) > 1) el.scrollTop = t; });
    restore();
    requestAnimationFrame(() => { restore(); host.style.minHeight = ""; requestAnimationFrame(restore); });
    setTimeout(() => { host.style.minHeight = ""; }, 500);   // page en arrière-plan : pas d'image affichée, donc pas de requestAnimationFrame
  }
};
const fr = (v, d = 1) => Number(v).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const PAL = ["#0abfbf", "#e05a8a", "#e3a21a", "#9b6fd6", "#4a90d9", "#1fce8a"];
const HOME = "#1fce8a";
const ago = (t) => {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 90) return "à l'instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h${Math.round((s % 3600) / 60) ? String(Math.round((s % 3600) / 60)).padStart(2, "0") : ""}`;
  return `il y a ${Math.round(s / 86400)} j`;
};
const since = (t) => {
  const d = new Date(t), now = new Date();
  const hm = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `depuis ${hm}`;
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `depuis hier ${hm}`;
  return `depuis le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
};
const DIR = { towards: ["mdi:arrow-down-bold", "se rapproche", "#1fce8a"], away_from: ["mdi:arrow-up-bold", "s'éloigne", "#e3a21a"], stationary: ["mdi:pause", "immobile", ""], arrived: ["mdi:home-import-outline", "arrivé(e)", "#1fce8a"] };

class HolmFamilyCard extends HTMLElement {
  setConfig(c) {
    if (!c || !Array.isArray(c.persons) || !c.persons.length) throw new Error("holm-family-card : 'persons' est requis");
    this._c = { title: "La famille", stale_hours: 3, show_address: true, show_frame: true, ...c };
    this._sig = null;
    if (this._hass) this._render();
  }
  set hass(h) {
    this._hass = h;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const ids = this._watch();
    const sig = ids.map((i) => { const s = h.states[i]; return s ? s.state + s.last_changed : ""; }).join("|");
    if (sig !== this._sig) { this._sig = sig; this._render(); }
  }
  connectedCallback() { clearInterval(this._tk); this._tk = setInterval(() => this._render(), 60000); }
  disconnectedCallback() { clearInterval(this._tk); }
  _slug(p) { return p.entity.split(".")[1]; }
  // entités liées au téléphone (même appareil que le traqueur) et à la Proximité
  _auto(p) {
    const h = this._hass, st = h.states[p.entity], ents = h.entities || {};
    const trackers = st?.attributes.device_trackers || [];
    const devs = new Set(trackers.map((t) => ents[t]?.device_id).filter(Boolean));
    const onDev = (test) => Object.values(ents).filter((e) => e.device_id && devs.has(e.device_id) && test(e)).map((e) => e.entity_id)
      .sort((a, b) => (h.states[b]?.last_updated || "").localeCompare(h.states[a]?.last_updated || ""));
    const slug = this._slug(p);
    const prox = Object.values(ents).filter((e) => e.platform === "proximity" && (e.entity_id.endsWith("_" + slug) || e.entity_id.includes("_" + slug + "_")));
    const pick = (list, re) => (list.find((e) => re.test(e.translation_key || "") || re.test(e.entity_id)) || {}).entity_id;
    return {
      battery: p.battery || onDev((e) => /battery_level$/.test(e.entity_id) && h.states[e.entity_id] && !isNaN(parseFloat(h.states[e.entity_id].state)))[0],
      address: p.address || onDev((e) => /geocoded_location/.test(e.entity_id) && h.states[e.entity_id])[0],
      distance: p.distance || pick(prox, /dist_to_zone|distance/),
      direction: p.direction || pick(prox, /dir_of_travel|direction/),
    };
  }
  _watch() {
    const out = [];
    for (const p of this._c.persons) {
      out.push(p.entity, ...(p.wifi || []));
      if (this._hass.entities) { const a = this._auto(p); out.push(a.battery, a.address, a.distance, a.direction); }
      const src = this._hass.states[p.entity]?.attributes.source; if (src) out.push(src);
    }
    return out.filter(Boolean);
  }
  _homeZones() {
    const h = this._hass, home = h.states["zone.home"];
    const names = new Set(["home"]);
    if (!home) return names;
    const { latitude: la, longitude: lo } = home.attributes;
    for (const [id, s] of Object.entries(h.states)) {
      if (!id.startsWith("zone.") || id === "zone.home") continue;
      const dy = (s.attributes.latitude - la) * 111000, dx = (s.attributes.longitude - lo) * 111000 * Math.cos((la * Math.PI) / 180);
      if (Math.hypot(dx, dy) < 250) names.add(s.attributes.friendly_name);
    }
    (this._c.home_zones || []).forEach((z) => names.add(z));
    return names;
  }
  _person(p, i, homeZ) {
    const h = this._hass, s = h.states[p.entity];
    const color = p.color || PAL[i % PAL.length];
    if (!s) return { p, color, missing: true };
    const a = this._auto(p);
    const src = h.states[s.attributes.source];
    const srcType = src?.attributes.source_type;
    const wifiHome = (p.wifi || []).some((w) => h.states[w]?.state === "home");
    let state = s.state, home = homeZ.has(state);
    let via = srcType === "router" ? "wifi" : srcType === "gps" ? "gps" : srcType || "";
    if (!home && wifiHome) { home = true; via = "wifi"; }
    const gpsAge = src && srcType === "gps" ? Date.now() - new Date(src.last_updated).getTime() : 0;
    const stale = via === "gps" && gpsAge > (Number(this._c.stale_hours) || 3) * 3600000;
    // position GPS trop ancienne et pas de Wi-Fi : on n'affirme plus rien, on affiche la dernière position connue
    let last = null;
    if (stale && !wifiHome) { last = homeZ.has(state) ? "à la maison" : state === "not_home" ? "en déplacement" : state; home = false; }
    const trk = (s.attributes.device_trackers || []).map((t) => h.states[t]).filter(Boolean);
    const offline = trk.length && trk.every((t) => t.state === "unavailable" || t.state === "unknown");
    const unknown = !!last || (!home && (state === "unknown" || state === "unavailable"));
    const num = (id) => { const v = parseFloat(h.states[id]?.state); return isNaN(v) ? null : v; };
    const distU = a.distance ? h.states[a.distance]?.attributes.unit_of_measurement || "km" : "";
    return {
      p, s, color, home, unknown, stale, via, gpsAge, wifiHome, last, offline,
      zone: home ? "À la maison" : state === "not_home" ? "En déplacement" : unknown ? "Position inconnue" : state,
      since: new Date(wifiHome && !homeZ.has(s.state) ? h.states[(p.wifi || []).find((w) => h.states[w]?.state === "home")].last_changed : s.last_changed).getTime(),
      battery: num(a.battery), batteryId: a.battery,
      address: a.address ? h.states[a.address]?.state : null,
      dist: num(a.distance), distU, dir: a.direction ? h.states[a.direction]?.state : null,
      name: p.name || s.attributes.friendly_name, pic: s.attributes.entity_picture,
    };
  }
  _render() {
    return keepScroll(this, () => this._renderNow());
  }
  _renderNow() {
    if (!this.shadowRoot || !this._c || !this._hass) return;
    const c = this._c, homeZ = this._homeZones();
    const P = c.persons.map((p, i) => this._person(p, i, homeZ));
    const nHome = P.filter((x) => x.home).length, nOut = P.filter((x) => !x.home && !x.unknown && !x.missing).length;
    const row = (x) => {
      if (x.missing) return `<div class="row"><div class="av" style="--c:#888"><ha-icon icon="mdi:account-question"></ha-icon></div><div class="tx"><div class="nm">${x.p.entity}</div><div class="st">Entité introuvable</div></div></div>`;
      const ring = x.home ? HOME : x.unknown ? "rgba(127,127,127,.5)" : x.color;
      const initials = (x.name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      const badge = x.home ? (x.via === "wifi" ? "mdi:wifi" : "mdi:home") : x.unknown ? "mdi:help" : x.dir && DIR[x.dir] && x.dir !== "stationary" ? DIR[x.dir][0] : "mdi:map-marker";
      const chips = [];
      if (!x.home && x.dist != null && x.dist > 0) chips.push(`<span class="ch"><ha-icon icon="mdi:map-marker-distance"></ha-icon>${fr(x.dist, x.dist < 10 ? 1 : 0)} ${x.distU}</span>`);
      if (!x.home && x.dir && DIR[x.dir] && x.dir !== "stationary") chips.push(`<span class="ch" style="--k:${DIR[x.dir][2]}"><ha-icon icon="${DIR[x.dir][0]}"></ha-icon>${DIR[x.dir][1]}</span>`);
      if (x.battery != null) {
        const b = x.battery, ic = b > 90 ? "mdi:battery" : b < 10 ? "mdi:battery-outline" : `mdi:battery-${Math.round(b / 10) * 10}`;
        chips.push(`<span class="ch bat ${b <= 20 ? "low" : ""}" data-e="${x.batteryId}"><ha-icon icon="${ic}"></ha-icon>${fr(b, 0)} %</span>`);
      }
      const srcTxt = x.via === "wifi" ? "Wi-Fi de la maison" : x.via === "gps" ? `GPS ${ago(Date.now() - x.gpsAge)}` : "";
      const addr = c.show_address !== false && x.address && !x.home && x.address !== "unknown" && x.address !== "unavailable" ? x.address : "";
      return `<div class="row ${x.home ? "home" : ""} ${x.unknown ? "unk" : ""}" data-e="${x.p.entity}">
        <div class="av" style="--c:${ring}">${x.pic ? `<img src="${x.pic}" alt="">` : `<span>${initials}</span>`}<i class="bd" style="--c:${ring}"><ha-icon icon="${badge}"></ha-icon></i></div>
        <div class="tx"><div class="nm">${x.name}</div>
          <div class="st"><b style="color:${x.home ? HOME : x.unknown ? "var(--secondary-text-color)" : "var(--primary-text-color)"}">${x.zone}</b> <span>${x.unknown ? "" : since(x.since)}</span></div>
          ${addr ? `<div class="ad"><ha-icon icon="mdi:map-marker-outline"></ha-icon>${addr}</div>` : ""}
          ${x.last ? `<div class="wn"><ha-icon icon="mdi:clock-alert-outline"></ha-icon>Dernière position : ${x.last}, ${ago(Date.now() - x.gpsAge)} — suivi coupé</div>`
            : x.offline && x.unknown ? `<div class="wn"><ha-icon icon="mdi:cellphone-off"></ha-icon>L'application Home Assistant du téléphone ne répond plus</div>`
            : srcTxt ? `<div class="sr">${srcTxt}</div>` : ""}
        </div>
        <div class="chs">${chips.join("")}</div></div>`;
    };
    this.shadowRoot.innerHTML = `
    <style>
      :host { display:block; }
      ha-card { display:block; padding:14px 16px 10px; box-sizing:border-box; height:100%; container-type:inline-size; }
      ha-card.noframe { background:none !important; box-shadow:none !important; border:none !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important; }
      ha-card.noframe::before, ha-card.noframe::after { content:none !important; display:none !important; }
      .hd { display:flex; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:8px; }
      .tt { font-size:16px; font-weight:600; color:var(--primary-text-color); }
      .sm { font-size:12px; color:var(--secondary-text-color); display:flex; gap:10px; }
      .sm b { color:var(--primary-text-color); font-weight:700; }
      .sm i { width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:4px; vertical-align:1px; }
      .row { display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; padding:10px 6px; border-radius:14px; cursor:pointer;
             border-bottom:1px solid color-mix(in srgb, var(--primary-text-color) 6%, transparent); }
      .row:last-child { border-bottom:none; }
      .row:hover { background:color-mix(in srgb, var(--primary-text-color) 5%, transparent); }
      .row.unk { opacity:.7; }
      .av { position:relative; width:50px; height:50px; border-radius:50%; flex:none; box-shadow:0 0 0 2.5px var(--c), 0 0 14px color-mix(in srgb, var(--c) 35%, transparent);
            background:color-mix(in srgb, var(--c) 18%, transparent); display:flex; align-items:center; justify-content:center; }
      .av img { width:100%; height:100%; border-radius:50%; object-fit:cover; }
      .av span { font-weight:700; color:var(--primary-text-color); font-size:17px; }
      .av > ha-icon { --mdc-icon-size:26px; color:var(--secondary-text-color); }
      .bd { position:absolute; right:-4px; bottom:-4px; width:22px; height:22px; border-radius:50%; background:var(--c); display:flex; align-items:center; justify-content:center;
            box-shadow:0 0 0 2px var(--card-background-color, #111); }
      .bd ha-icon { --mdc-icon-size:13px; color:#fff; }
      .tx { min-width:0; }
      .nm { font-size:15px; font-weight:600; color:var(--primary-text-color); }
      .st { font-size:13px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .st b { font-weight:600; }
      .ad, .sr, .wn { font-size:11.5px; color:var(--secondary-text-color); display:flex; align-items:center; gap:4px; margin-top:2px; min-width:0; }
      .ad { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
      .ad ha-icon, .wn ha-icon { --mdc-icon-size:13px; vertical-align:-2px; margin-right:2px; }
      .wn { color:#e3a21a; }
      .chs { display:flex; flex-wrap:wrap; gap:5px; justify-content:flex-end; max-width:220px; }
      .ch { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; color:var(--primary-text-color); white-space:nowrap;
            padding:3px 8px; border-radius:999px; background:color-mix(in srgb, var(--k, var(--primary-text-color)) 10%, transparent); }
      .ch ha-icon { --mdc-icon-size:14px; color:var(--k, var(--secondary-text-color)); }
      .ch.bat.low { --k:#f06478; }
      @container (max-width: 420px) { .row { grid-template-columns:auto 1fr; } .chs { grid-column:2; justify-content:flex-start; max-width:none; } }
    </style>
    <ha-card class="${c.show_frame === false ? "noframe" : ""}">
      <div class="hd"><div class="tt">${c.title || ""}</div>
        <div class="sm"><span><i style="background:${HOME}"></i><b>${nHome}</b> à la maison</span><span><i style="background:${PAL[0]}"></i><b>${nOut}</b> dehors</span></div></div>
      ${P.map(row).join("")}
    </ha-card>`;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const e = new Event("hass-more-info", { bubbles: true, composed: true }); e.detail = { entityId: el.dataset.e }; this.dispatchEvent(e);
    }));
  }
  static getConfigElement() { return document.createElement("holm-family-card-editor"); }
  static getStubConfig(h) { return { title: "La famille", persons: Object.keys(h?.states || {}).filter((e) => e.startsWith("person.")).slice(0, 4).map((entity) => ({ entity })) }; }
  getCardSize() { return 1 + this._c.persons.length * 1.5; }
  getGridOptions() { return { columns: 12, rows: "auto", min_columns: 4 }; }
}

const L = { title: "Titre", stale_hours: "Position trop ancienne après (heures)", show_address: "Afficher l'adresse", show_frame: "Afficher le cadre de la carte",
  entity: "Personne", name: "Nom affiché", color: "Couleur", wifi: "Traqueurs Wi-Fi (routeur) du téléphone", battery: "Batterie (vide = auto)", address: "Adresse (vide = auto)",
  distance: "Distance (vide = auto)", direction: "Sens du déplacement (vide = auto)" };
const hex2rgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return undefined; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb2hex = (a) => Array.isArray(a) ? "#" + a.map((v) => Number(v).toString(16).padStart(2, "0")).join("") : a;
const GEN = [ { name: "title", selector: { text: {} } }, { type: "grid", name: "", schema: [
  { name: "stale_hours", selector: { number: { min: 1, max: 48, mode: "box" } } }, { name: "show_address", selector: { boolean: {} } }, { name: "show_frame", selector: { boolean: {} } } ] } ];
const PER = [
  { type: "grid", name: "", schema: [ { name: "entity", required: true, selector: { entity: { domain: ["person"] } } }, { name: "name", selector: { text: {} } } ] },
  { name: "wifi", selector: { entity: { multiple: true, domain: ["device_tracker"] } } },
  { type: "expandable", title: "Capteurs (détectés automatiquement)", flatten: true, schema: [ { type: "grid", name: "", schema: [
    { name: "battery", selector: { entity: { domain: ["sensor"] } } }, { name: "address", selector: { entity: { domain: ["sensor"] } } },
    { name: "distance", selector: { entity: { domain: ["sensor"] } } }, { name: "direction", selector: { entity: { domain: ["sensor"] } } },
    { name: "color", selector: { color_rgb: {} } } ] } ] },
];
class HolmFamilyCardEditor extends HTMLElement {
  setConfig(c) { const j = JSON.stringify(c); this._config = JSON.parse(j); if (j === this._last && this._built) return; this._build(); }
  set hass(h) { this._hass = h; if (!this._built) this._build(); else this.querySelectorAll("ha-form").forEach((f) => (f.hass = h)); }
  _emit() { this._last = JSON.stringify(this._config); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: JSON.parse(this._last) }, bubbles: true, composed: true })); }
  _form(schema, data, cb) { const f = document.createElement("ha-form"); f.hass = this._hass; f.schema = schema; f.data = data; f.computeLabel = (s) => L[s.name] || s.name;
    f.addEventListener("value-changed", (ev) => { ev.stopPropagation(); cb(ev.detail.value); }); return f; }
  _build() {
    if (!this._hass || !this._config) return;
    this._built = true; const c = this._config; c.persons = c.persons || [];
    this.innerHTML = `<style>.it{border:1px solid var(--divider-color);border-radius:12px;padding:8px 12px 4px;margin:10px 0}.ih{display:flex;justify-content:space-between;font-weight:600;margin-bottom:4px}
      .ih span{display:flex;gap:4px} button{cursor:pointer;background:none;border:1px solid var(--divider-color);color:var(--primary-text-color);border-radius:8px;padding:4px 8px}.add{width:100%;padding:8px}</style>
      <div class="gen"></div><div class="items"></div><button class="add">+ Ajouter une personne</button>`;
    this.querySelector(".gen").appendChild(this._form(GEN, { stale_hours: 3, show_address: true, show_frame: true, ...c }, (v) => {
      Object.assign(this._config, v); if (v.stale_hours === 3) delete this._config.stale_hours; if (v.show_address !== false) delete this._config.show_address; if (v.show_frame !== false) delete this._config.show_frame; this._emit(); }));
    const box = this.querySelector(".items");
    c.persons.forEach((p, i) => {
      const w = document.createElement("div"); w.className = "it";
      w.innerHTML = `<div class="ih">${p.name || p.entity || "Personne " + (i + 1)}<span><button data-a="up">▲</button><button data-a="down">▼</button><button data-a="del">✕</button></span></div>`;
      w.appendChild(this._form(PER, { ...p, color: hex2rgb(p.color) }, (v) => {
        const o = {}; for (const [k, val] of Object.entries(v)) { if (val === "" || val == null || (Array.isArray(val) && !val.length)) continue; o[k] = k === "color" ? rgb2hex(val) : val; }
        this._config.persons[i] = o; this._emit(); }));
      w.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { const a = b.dataset.a, arr = this._config.persons;
        if (a === "del") arr.splice(i, 1); if (a === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; if (a === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
        this._emit(); this._build(); }));
      box.appendChild(w);
    });
    this.querySelector(".add").addEventListener("click", () => { this._config.persons.push({ entity: "" }); this._emit(); this._build(); });
  }
}
if (!customElements.get("holm-family-card-editor")) customElements.define("holm-family-card-editor", HolmFamilyCardEditor);
if (!customElements.get("holm-family-card")) customElements.define("holm-family-card", HolmFamilyCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "holm-family-card", name: "HOLM – La famille", description: "Présence, lieu, distance, batterie et source (GPS / Wi-Fi) de chaque membre de la famille", preview: false });
})();

console.info("%c HOLM-FAMILY %c 1.0.1 ", "background:#1fce8a;color:#111;border-radius:3px 0 0 3px", "background:#123;color:#fff;border-radius:0 3px 3px 0");
