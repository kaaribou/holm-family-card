/* holm-family-card — https://github.com/kaaribou/holm-family-card — licence MIT — v1.1.0 */
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
  // ---- HOLM i18n : textes écrits en français, traduits à l'affichage (en, de, es, it, nl, pt, pl) ----
  // Langue : option `language` de la carte, sinon celle du profil Home Assistant ; anglais si la langue n'est pas traduite.
  const HOLM_LANGS = ["en", "de", "es", "it", "nl", "pt", "pl"];
  const LANG_NAMES = { fr: "Français", en: "English", de: "Deutsch", es: "Español", it: "Italiano", nl: "Nederlands", pt: "Português", pl: "Polski" };
  const LOCALES = { fr: "fr-FR", en: "en-GB", de: "de-DE", es: "es-ES", it: "it-IT", nl: "nl-NL", pt: "pt-PT", pl: "pl-PL" };
  const I18N = {
    "Automatique (profil)": ["Automatic (profile)", "Automatisch (Profil)", "Automático (perfil)", "Automatica (profilo)", "Automatisch (profiel)", "Automático (perfil)", "Automatycznie (profil)"],
    "Langue": ["Language", "Sprache", "Idioma", "Lingua", "Taal", "Idioma", "Język"],
    "Titre": ["Title", "Titel", "Título", "Titolo", "Titel", "Título", "Tytuł"],
    "Titre (optionnel)": ["Title (optional)", "Titel (optional)", "Título (opcional)", "Titolo (facoltativo)", "Titel (optioneel)", "Título (opcional)", "Tytuł (opcjonalnie)"],
    "Nom": ["Name", "Name", "Nombre", "Nome", "Naam", "Nome", "Nazwa"],
    "Nom affiché": ["Display name", "Anzeigename", "Nombre mostrado", "Nome visualizzato", "Weergavenaam", "Nome apresentado", "Wyświetlana nazwa"],
    "Icône": ["Icon", "Symbol", "Icono", "Icona", "Pictogram", "Ícone", "Ikona"],
    "Couleur": ["Colour", "Farbe", "Color", "Colore", "Kleur", "Cor", "Kolor"],
    "Couleurs": ["Colours", "Farben", "Colores", "Colori", "Kleuren", "Cores", "Kolory"],
    "Entité": ["Entity", "Entität", "Entidad", "Entità", "Entiteit", "Entidade", "Encja"],
    "Entités": ["Entities", "Entitäten", "Entidades", "Entità", "Entiteiten", "Entidades", "Encje"],
    "Chargement…": ["Loading…", "Wird geladen…", "Cargando…", "Caricamento…", "Laden…", "A carregar…", "Ładowanie…"],
    "Erreur": ["Error", "Fehler", "Error", "Errore", "Fout", "Erro", "Błąd"],
    "Fermer": ["Close", "Schließen", "Cerrar", "Chiudi", "Sluiten", "Fechar", "Zamknij"],
    "Annuler": ["Cancel", "Abbrechen", "Cancelar", "Annulla", "Annuleren", "Cancelar", "Anuluj"],
    "Enregistrer": ["Save", "Speichern", "Guardar", "Salva", "Opslaan", "Guardar", "Zapisz"],
    "Supprimer": ["Delete", "Löschen", "Eliminar", "Elimina", "Verwijderen", "Eliminar", "Usuń"],
    "Ajouter": ["Add", "Hinzufügen", "Añadir", "Aggiungi", "Toevoegen", "Adicionar", "Dodaj"],
    "Monter": ["Move up", "Nach oben", "Subir", "Sposta su", "Omhoog", "Mover para cima", "W górę"],
    "Descendre": ["Move down", "Nach unten", "Bajar", "Sposta giù", "Omlaag", "Mover para baixo", "W dół"],
    "Afficher le cadre de la carte": ["Show the card frame", "Kartenrahmen anzeigen", "Mostrar el marco de la tarjeta", "Mostra la cornice della scheda", "Kaartkader tonen", "Mostrar a moldura do cartão", "Pokaż ramkę karty"],
    "Indisponible": ["Unavailable", "Nicht verfügbar", "No disponible", "Non disponibile", "Niet beschikbaar", "Indisponível", "Niedostępne"],
    "Aujourd'hui": ["Today", "Heute", "Hoy", "Oggi", "Vandaag", "Hoje", "Dziś"],
    "Hier": ["Yesterday", "Gestern", "Ayer", "Ieri", "Gisteren", "Ontem", "Wczoraj"],
    "Demain": ["Tomorrow", "Morgen", "Mañana", "Domani", "Morgen", "Amanhã", "Jutro"],
    "Batterie": ["Battery", "Batterie", "Batería", "Batteria", "Batterij", "Bateria", "Bateria"],
    "Aucune donnée sur cette période.": ["No data for this period.", "Keine Daten für diesen Zeitraum.", "No hay datos en este periodo.", "Nessun dato per questo periodo.", "Geen gegevens voor deze periode.", "Sem dados neste período.", "Brak danych w tym okresie."],
    "à l'instant": ["just now", "gerade eben", "ahora mismo", "proprio ora", "zojuist", "agora mesmo", "przed chwilą"],
    "il y a {n} min": ["{n} min ago", "vor {n} Min.", "hace {n} min", "{n} min fa", "{n} min geleden", "há {n} min", "{n} min temu"],
    "il y a {n} h": ["{n} h ago", "vor {n} Std.", "hace {n} h", "{n} h fa", "{n} u geleden", "há {n} h", "{n} godz. temu"],
    "il y a {n} j": ["{n} d ago", "vor {n} T.", "hace {n} d", "{n} g fa", "{n} d geleden", "há {n} d", "{n} dni temu"],
    "La famille": ["The family", "Die Familie", "La familia", "La famiglia", "Het gezin", "A família", "Rodzina"],
    "il y a {n} h{m}": ["{n} h{m} ago", "vor {n} Std.{m}", "hace {n} h{m}", "{n} h{m} fa", "{n} u{m} geleden", "há {n} h{m}", "{n} godz.{m} temu"],
    "depuis {t}": ["since {t}", "seit {t}", "desde las {t}", "dalle {t}", "sinds {t}", "desde as {t}", "od {t}"],
    "depuis hier {t}": ["since yesterday {t}", "seit gestern {t}", "desde ayer a las {t}", "da ieri alle {t}", "sinds gisteren {t}", "desde ontem às {t}", "od wczoraj {t}"],
    "depuis le {d}": ["since {d}", "seit dem {d}", "desde el {d}", "dal {d}", "sinds {d}", "desde {d}", "od {d}"],
    "se rapproche": ["getting closer", "kommt näher", "se acerca", "si avvicina", "komt dichterbij", "aproxima-se", "zbliża się"],
    "s'éloigne": ["moving away", "entfernt sich", "se aleja", "si allontana", "gaat verder weg", "afasta-se", "oddala się"],
    "immobile": ["stationary", "unbewegt", "inmóvil", "fermo", "stilstaand", "parado", "w miejscu"],
    "arrivé(e)": ["arrived", "angekommen", "ha llegado", "arrivato/a", "aangekomen", "chegou", "na miejscu"],
    "à la maison": ["at home", "zu Hause", "en casa", "a casa", "thuis", "em casa", "w domu"],
    "en déplacement": ["away", "unterwegs", "fuera", "fuori casa", "onderweg", "fora", "poza domem"],
    "À la maison": ["At home", "Zu Hause", "En casa", "A casa", "Thuis", "Em casa", "W domu"],
    "En déplacement": ["Away", "Unterwegs", "Fuera", "Fuori casa", "Onderweg", "Fora", "Poza domem"],
    "Position inconnue": ["Unknown location", "Standort unbekannt", "Ubicación desconocida", "Posizione sconosciuta", "Locatie onbekend", "Localização desconhecida", "Nieznana lokalizacja"],
    "Entité introuvable": ["Entity not found", "Entität nicht gefunden", "Entidad no encontrada", "Entità non trovata", "Entiteit niet gevonden", "Entidade não encontrada", "Nie znaleziono encji"],
    "Wi-Fi de la maison": ["Home Wi-Fi", "WLAN zu Hause", "Wi-Fi de casa", "Wi-Fi di casa", "Wifi thuis", "Wi-Fi de casa", "Wi-Fi w domu"],
    "GPS {x}": ["GPS {x}", "GPS {x}", "GPS {x}", "GPS {x}", "GPS {x}", "GPS {x}", "GPS {x}"],
    "Dernière position : {p}, {a} — suivi coupé": ["Last location: {p}, {a} — tracking off", "Letzter Standort: {p}, {a} — Ortung aus", "Última ubicación: {p}, {a} — seguimiento desactivado", "Ultima posizione: {p}, {a} — tracciamento disattivato", "Laatste locatie: {p}, {a} — volgen uit", "Última localização: {p}, {a} — seguimento desligado", "Ostatnia lokalizacja: {p}, {a} — śledzenie wyłączone"],
    "L'application Home Assistant du téléphone ne répond plus": ["The phone's Home Assistant app is not responding", "Die Home-Assistant-App des Telefons antwortet nicht mehr", "La aplicación Home Assistant del teléfono no responde", "L'app Home Assistant del telefono non risponde", "De Home Assistant-app van de telefoon reageert niet meer", "A aplicação Home Assistant do telemóvel não responde", "Aplikacja Home Assistant w telefonie nie odpowiada"],
    "{n} à la maison": ["{n} at home", "{n} zu Hause", "{n} en casa", "{n} a casa", "{n} thuis", "{n} em casa", "{n} w domu"],
    "{n} dehors": ["{n} out", "{n} unterwegs", "{n} fuera", "{n} fuori", "{n} weg", "{n} fora", "{n} poza domem"],
    "Position trop ancienne après (heures)": ["Location too old after (hours)", "Standort veraltet nach (Stunden)", "Ubicación demasiado antigua tras (horas)", "Posizione troppo vecchia dopo (ore)", "Locatie te oud na (uren)", "Localização demasiado antiga após (horas)", "Lokalizacja nieaktualna po (godz.)"],
    "Afficher l'adresse": ["Show the address", "Adresse anzeigen", "Mostrar la dirección", "Mostra l'indirizzo", "Adres tonen", "Mostrar a morada", "Pokaż adres"],
    "Personne": ["Person", "Person", "Persona", "Persona", "Persoon", "Pessoa", "Osoba"],
    "Traqueurs Wi-Fi (routeur) du téléphone": ["Phone Wi-Fi trackers (router)", "WLAN-Tracker des Telefons (Router)", "Rastreadores Wi-Fi (router) del teléfono", "Tracker Wi-Fi (router) del telefono", "Wifi-trackers (router) van de telefoon", "Rastreadores Wi-Fi (router) do telemóvel", "Trackery Wi-Fi (router) telefonu"],
    "Batterie (vide = auto)": ["Battery (empty = auto)", "Batterie (leer = automatisch)", "Batería (vacío = auto)", "Batteria (vuoto = auto)", "Batterij (leeg = automatisch)", "Bateria (vazio = auto)", "Bateria (puste = auto)"],
    "Adresse (vide = auto)": ["Address (empty = auto)", "Adresse (leer = automatisch)", "Dirección (vacío = auto)", "Indirizzo (vuoto = auto)", "Adres (leeg = automatisch)", "Morada (vazio = auto)", "Adres (puste = auto)"],
    "Distance (vide = auto)": ["Distance (empty = auto)", "Entfernung (leer = automatisch)", "Distancia (vacío = auto)", "Distanza (vuoto = auto)", "Afstand (leeg = automatisch)", "Distância (vazio = auto)", "Odległość (puste = auto)"],
    "Sens du déplacement (vide = auto)": ["Direction of travel (empty = auto)", "Bewegungsrichtung (leer = automatisch)", "Sentido del desplazamiento (vacío = auto)", "Direzione di spostamento (vuoto = auto)", "Reisrichting (leeg = automatisch)", "Sentido da deslocação (vazio = auto)", "Kierunek ruchu (puste = auto)"],
    "Capteurs (détectés automatiquement)": ["Sensors (detected automatically)", "Sensoren (automatisch erkannt)", "Sensores (detectados automáticamente)", "Sensori (rilevati automaticamente)", "Sensoren (automatisch gedetecteerd)", "Sensores (detetados automaticamente)", "Czujniki (wykrywane automatycznie)"],
    "+ Ajouter une personne": ["+ Add a person", "+ Person hinzufügen", "+ Añadir una persona", "+ Aggiungi una persona", "+ Persoon toevoegen", "+ Adicionar uma pessoa", "+ Dodaj osobę"],
    "Personne {n}": ["Person {n}", "Person {n}", "Persona {n}", "Persona {n}", "Persoon {n}", "Pessoa {n}", "Osoba {n}"],
    "HOLM – La famille": ["HOLM – The family", "HOLM – Die Familie", "HOLM – La familia", "HOLM – La famiglia", "HOLM – Het gezin", "HOLM – A família", "HOLM – Rodzina"],
    "Présence, lieu, distance, batterie et source (GPS / Wi-Fi) de chaque membre de la famille": ["Presence, location, distance, battery and source (GPS / Wi-Fi) of each family member", "Anwesenheit, Ort, Entfernung, Akku und Quelle (GPS / WLAN) jedes Familienmitglieds", "Presencia, lugar, distancia, batería y fuente (GPS / Wi-Fi) de cada miembro de la familia", "Presenza, luogo, distanza, batteria e fonte (GPS / Wi-Fi) di ogni membro della famiglia", "Aanwezigheid, locatie, afstand, batterij en bron (GPS / wifi) van elk gezinslid", "Presença, local, distância, bateria e fonte (GPS / Wi-Fi) de cada membro da família", "Obecność, miejsce, odległość, bateria i źródło (GPS / Wi-Fi) każdego członka rodziny"]
  };
  let LANG = "fr", NUMLOC = "fr-FR";
  const langOf = (hass, c) => { const l = String((c && c.language) || (hass && ((hass.locale && hass.locale.language) || hass.language)) || navigator.language || "en").toLowerCase().split(/[-_]/)[0]; return l === "fr" || HOLM_LANGS.includes(l) ? l : "en"; };
  const setLang = (hass, c) => { LANG = langOf(hass, c); const p = hass && hass.locale && hass.locale.language; NUMLOC = !(c && c.language) && p && p.toLowerCase().startsWith(LANG) ? p : LOCALES[LANG]; return LANG; };
  const _ = (s, v) => { let o = LANG === "fr" ? s : ((I18N[s] && I18N[s][HOLM_LANGS.indexOf(LANG)]) || s); if (v) for (const k in v) o = o.split("{" + k + "}").join(v[k]); return o; };
  // champ « Langue » pour les éditeurs visuels (ha-form)
  const langField = () => ({ name: "language", selector: { select: { mode: "dropdown", options: [{ value: "", label: _("Automatique (profil)") }, ...Object.entries(LANG_NAMES).map(([value, label]) => ({ value, label }))] } } });
  // traduit les titres de sections et les libellés d'options d'un schéma ha-form (écrits en français)
  const locSchema = (sc) => (sc || []).map((x) => { const o = { ...x }; if (o.title) o.title = _(o.title); if (o.schema) o.schema = locSchema(o.schema);
    if (o.selector && o.selector.select && o.name !== "language") o.selector = { ...o.selector, select: { ...o.selector.select, options: (o.selector.select.options || []).map((op) => (typeof op === "string" ? op : { ...op, label: _(op.label) })) } };
    if (o.name === "language" && o.selector && o.selector.select) o.selector = { ...o.selector, select: { ...o.selector.select, options: o.selector.select.options.map((op) => (op.value ? op : { ...op, label: _("Automatique (profil)") })) } };
    return o; });
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
const fr = (v, d = 1) => Number(v).toLocaleString(NUMLOC, { minimumFractionDigits: d, maximumFractionDigits: d });
const PAL = ["#0abfbf", "#e05a8a", "#e3a21a", "#9b6fd6", "#4a90d9", "#1fce8a"];
const HOME = "#1fce8a";
const ago = (t) => {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 90) return _("à l'instant");
  if (s < 3600) return _("il y a {n} min", { n: Math.round(s / 60) });
  if (s < 86400) return _("il y a {n} h{m}", { n: Math.floor(s / 3600), m: Math.round((s % 3600) / 60) ? String(Math.round((s % 3600) / 60)).padStart(2, "0") : "" });
  return _("il y a {n} j", { n: Math.round(s / 86400) });
};
const since = (t) => {
  const d = new Date(t), now = new Date();
  const hm = d.toLocaleTimeString(NUMLOC, { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return _("depuis {t}", { t: hm });
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return _("depuis hier {t}", { t: hm });
  return _("depuis le {d}", { d: d.toLocaleDateString(NUMLOC, { day: "numeric", month: "short" }) });
};
const DIR = { towards: ["mdi:arrow-down-bold", _("se rapproche"), "#1fce8a"], away_from: ["mdi:arrow-up-bold", _("s'éloigne"), "#e3a21a"], stationary: ["mdi:pause", _("immobile"), ""], arrived: ["mdi:home-import-outline", _("arrivé(e)"), "#1fce8a"] };

class HolmFamilyCard extends HTMLElement {
  setConfig(c) {
    if (!c || !Array.isArray(c.persons) || !c.persons.length) throw new Error("holm-family-card : 'persons' est requis");
    this._c = { stale_hours: 3, show_address: true, show_frame: true, ...c };
    this._sig = null;
    if (this._hass) this._render();
  }
  set hass(h) {
    this._hass = h;
    if (setLang(h, this._c) !== this._lang) { this._lang = LANG; this._sig = null; }
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
    if (stale && !wifiHome) { last = homeZ.has(state) ? _("à la maison") : state === "not_home" ? _("en déplacement") : state; home = false; }
    const trk = (s.attributes.device_trackers || []).map((t) => h.states[t]).filter(Boolean);
    const offline = trk.length && trk.every((t) => t.state === "unavailable" || t.state === "unknown");
    const unknown = !!last || (!home && (state === "unknown" || state === "unavailable"));
    const num = (id) => { const v = parseFloat(h.states[id]?.state); return isNaN(v) ? null : v; };
    const distU = a.distance ? h.states[a.distance]?.attributes.unit_of_measurement || "km" : "";
    return {
      p, s, color, home, unknown, stale, via, gpsAge, wifiHome, last, offline,
      zone: home ? _("À la maison") : state === "not_home" ? _("En déplacement") : unknown ? _("Position inconnue") : state,
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
    setLang(this._hass, this._c);
    const c = this._c, homeZ = this._homeZones();
    const P = c.persons.map((p, i) => this._person(p, i, homeZ));
    const nHome = P.filter((x) => x.home).length, nOut = P.filter((x) => !x.home && !x.unknown && !x.missing).length;
    const row = (x) => {
      if (x.missing) return `<div class="row"><div class="av" style="--c:#888"><ha-icon icon="mdi:account-question"></ha-icon></div><div class="tx"><div class="nm">${x.p.entity}</div><div class="st">${_("Entité introuvable")}</div></div></div>`;
      const ring = x.home ? HOME : x.unknown ? "rgba(127,127,127,.5)" : x.color;
      const initials = (x.name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      const badge = x.home ? (x.via === "wifi" ? "mdi:wifi" : "mdi:home") : x.unknown ? "mdi:help" : x.dir && DIR[x.dir] && x.dir !== "stationary" ? DIR[x.dir][0] : "mdi:map-marker";
      const chips = [];
      if (!x.home && x.dist != null && x.dist > 0) chips.push(`<span class="ch"><ha-icon icon="mdi:map-marker-distance"></ha-icon>${fr(x.dist, x.dist < 10 ? 1 : 0)} ${x.distU}</span>`);
      if (!x.home && x.dir && DIR[x.dir] && x.dir !== "stationary") chips.push(`<span class="ch" style="--k:${DIR[x.dir][2]}"><ha-icon icon="${DIR[x.dir][0]}"></ha-icon>${_(DIR[x.dir][1])}</span>`);
      if (x.battery != null) {
        const b = x.battery, ic = b > 90 ? "mdi:battery" : b < 10 ? "mdi:battery-outline" : `mdi:battery-${Math.round(b / 10) * 10}`;
        chips.push(`<span class="ch bat ${b <= 20 ? "low" : ""}" data-e="${x.batteryId}"><ha-icon icon="${ic}"></ha-icon>${fr(b, 0)} %</span>`);
      }
      const srcTxt = x.via === "wifi" ? _("Wi-Fi de la maison") : x.via === "gps" ? _("GPS {x}", { x: ago(Date.now() - x.gpsAge) }) : "";
      const addr = c.show_address !== false && x.address && !x.home && x.address !== "unknown" && x.address !== "unavailable" ? x.address : "";
      return `<div class="row ${x.home ? "home" : ""} ${x.unknown ? "unk" : ""}" data-e="${x.p.entity}">
        <div class="av" style="--c:${ring}">${x.pic ? `<img src="${x.pic}" alt="">` : `<span>${initials}</span>`}<i class="bd" style="--c:${ring}"><ha-icon icon="${badge}"></ha-icon></i></div>
        <div class="tx"><div class="nm">${x.name}</div>
          <div class="st"><b style="color:${x.home ? HOME : x.unknown ? "var(--secondary-text-color)" : "var(--primary-text-color)"}">${x.zone}</b> <span>${x.unknown ? "" : since(x.since)}</span></div>
          ${addr ? `<div class="ad"><ha-icon icon="mdi:map-marker-outline"></ha-icon>${addr}</div>` : ""}
          ${x.last ? `<div class="wn"><ha-icon icon="mdi:clock-alert-outline"></ha-icon>${_("Dernière position : {p}, {a} — suivi coupé", { p: x.last, a: ago(Date.now() - x.gpsAge) })}</div>`
            : x.offline && x.unknown ? `<div class="wn"><ha-icon icon="mdi:cellphone-off"></ha-icon>${_("L'application Home Assistant du téléphone ne répond plus")}</div>`
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
      <div class="hd"><div class="tt">${c.title === undefined ? _("La famille") : _(c.title)}</div>
        <div class="sm"><span><i style="background:${HOME}"></i>${_("{n} à la maison", { n: `<b>${nHome}</b>` })}</span><span><i style="background:${PAL[0]}"></i>${_("{n} dehors", { n: `<b>${nOut}</b>` })}</span></div></div>
      ${P.map(row).join("")}
    </ha-card>`;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const e = new Event("hass-more-info", { bubbles: true, composed: true }); e.detail = { entityId: el.dataset.e }; this.dispatchEvent(e);
    }));
  }
  static getConfigElement() { return document.createElement("holm-family-card-editor"); }
  static getStubConfig(h) { setLang(h); return { title: _("La famille"), persons: Object.keys(h?.states || {}).filter((e) => e.startsWith("person.")).slice(0, 4).map((entity) => ({ entity })) }; }
  getCardSize() { return 1 + this._c.persons.length * 1.5; }
  getGridOptions() { return { columns: 12, rows: "auto", min_columns: 4 }; }
}

const L = { language: _("Langue"), title: _("Titre"), stale_hours: _("Position trop ancienne après (heures)"), show_address: _("Afficher l'adresse"), show_frame: _("Afficher le cadre de la carte"),
  entity: _("Personne"), name: _("Nom affiché"), color: _("Couleur"), wifi: _("Traqueurs Wi-Fi (routeur) du téléphone"), battery: _("Batterie (vide = auto)"), address: _("Adresse (vide = auto)"),
  distance: _("Distance (vide = auto)"), direction: _("Sens du déplacement (vide = auto)") };
const hex2rgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return undefined; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb2hex = (a) => Array.isArray(a) ? "#" + a.map((v) => Number(v).toString(16).padStart(2, "0")).join("") : a;
const GEN = [ { name: "title", selector: { text: {} } }, { type: "grid", name: "", schema: [
  { name: "stale_hours", selector: { number: { min: 1, max: 48, mode: "box" } } }, { name: "show_address", selector: { boolean: {} } }, { name: "show_frame", selector: { boolean: {} } } ] }, langField() ];
const PER = [
  { type: "grid", name: "", schema: [ { name: "entity", required: true, selector: { entity: { domain: ["person"] } } }, { name: "name", selector: { text: {} } } ] },
  { name: "wifi", selector: { entity: { multiple: true, domain: ["device_tracker"] } } },
  { type: "expandable", title: _("Capteurs (détectés automatiquement)"), flatten: true, schema: [ { type: "grid", name: "", schema: [
    { name: "battery", selector: { entity: { domain: ["sensor"] } } }, { name: "address", selector: { entity: { domain: ["sensor"] } } },
    { name: "distance", selector: { entity: { domain: ["sensor"] } } }, { name: "direction", selector: { entity: { domain: ["sensor"] } } },
    { name: "color", selector: { color_rgb: {} } } ] } ] },
];
class HolmFamilyCardEditor extends HTMLElement {
  setConfig(c) { const j = JSON.stringify(c); this._config = JSON.parse(j); if (j === this._last && this._built) return; this._build(); }
  set hass(h) { this._hass = h; if (!this._built) this._build(); else this.querySelectorAll("ha-form").forEach((f) => (f.hass = h)); }
  _emit() { this._last = JSON.stringify(this._config); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: JSON.parse(this._last) }, bubbles: true, composed: true })); }
  _form(schema, data, cb) { const f = document.createElement("ha-form"); f.hass = this._hass; f.schema = locSchema(schema); f.data = data; f.computeLabel = (s) => (L[s.name] ? _(L[s.name]) : s.name);
    f.addEventListener("value-changed", (ev) => { ev.stopPropagation(); cb(ev.detail.value); }); return f; }
  _build() {
    if (!this._hass || !this._config) return;
    this._built = true; const c = this._config; c.persons = c.persons || []; setLang(this._hass, c);
    this.innerHTML = `<style>.it{border:1px solid var(--divider-color);border-radius:12px;padding:8px 12px 4px;margin:10px 0}.ih{display:flex;justify-content:space-between;font-weight:600;margin-bottom:4px}
      .ih span{display:flex;gap:4px} button{cursor:pointer;background:none;border:1px solid var(--divider-color);color:var(--primary-text-color);border-radius:8px;padding:4px 8px}.add{width:100%;padding:8px}</style>
      <div class="gen"></div><div class="items"></div><button class="add">${_("+ Ajouter une personne")}</button>`;
    this.querySelector(".gen").appendChild(this._form(GEN, { stale_hours: 3, show_address: true, show_frame: true, language: "", ...c }, (v) => {
      const relang = (v.language || "") !== (this._config.language || ""); Object.assign(this._config, v); if (!v.language) delete this._config.language; if (relang) setTimeout(() => this._build()); if (v.stale_hours === 3) delete this._config.stale_hours; if (v.show_address !== false) delete this._config.show_address; if (v.show_frame !== false) delete this._config.show_frame; this._emit(); }));
    const box = this.querySelector(".items");
    c.persons.forEach((p, i) => {
      const w = document.createElement("div"); w.className = "it";
      w.innerHTML = `<div class="ih">${p.name || p.entity || _("Personne {n}", { n: i + 1 })}<span><button data-a="up">▲</button><button data-a="down">▼</button><button data-a="del">✕</button></span></div>`;
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
setLang(document.querySelector("home-assistant")?.hass);
window.customCards.push({ type: "holm-family-card", name: _("HOLM – La famille"), description: _("Présence, lieu, distance, batterie et source (GPS / Wi-Fi) de chaque membre de la famille"), preview: false });
})();

console.info("%c HOLM-FAMILY %c 1.1.0 ", "background:#1fce8a;color:#111;border-radius:3px 0 0 3px", "background:#123;color:#fff;border-radius:0 3px 3px 0");
