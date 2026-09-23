const ARTIST_STORES = [
  ["spotify", "Spotify"],
  ["appleMusic", "Apple Music"],
  ["youtube", "YouTube"],
];

const RELEASE_STORES = [
  ...ARTIST_STORES,
  ["hyperfollow", "Hyperfollow"],
];

const GROUPS = [
  { id: "albums", type: "album", title: "Albums" },
  { id: "eps", type: "ep", title: "EPs" },
  {
    id: "singles",
    type: "single",
    title: "Singles only",
    note: "Standalone singles only. A track that belongs to an album or EP is listed with that release, not here.",
  },
];

const TYPE_LABEL = {
  album: "Album",
  ep: "EP",
  single: "Single",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const app = document.querySelector("[data-page]");
const PAGE_TURN_MS = 250;
const TURN_KEY = "qr-page-turn";
let pageTurnPending = false;
let turnSettled = false;

document.addEventListener("click", onCatalogClick, true);
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  clearTurnKey();
  pageTurnPending = false;
  const root = document.documentElement;
  root.classList.add("is-page-instant");
  root.classList.remove(
    "is-page-out",
    "is-page-in",
    "is-page-settled",
    "to-back",
    "to-forward",
    "from-back",
    "from-forward"
  );
  requestAnimationFrame(() => root.classList.remove("is-page-instant"));
});

document.addEventListener("DOMContentLoaded", () => {
  const turnFallback = window.setTimeout(settlePageTurn, 160);
  loadCatalog()
    .then((catalog) => {
      if (app.dataset.page === "artist") renderArtist(catalog);
      else renderHome(catalog);
      app.setAttribute("aria-busy", "false");
    })
    .catch((error) => {
      console.error(error);
      app.setAttribute("aria-busy", "false");
      app.replaceChildren(notice(
        "Catalog unavailable",
        "data/catalog.json could not be loaded. Preview this folder with a local web server, then open the site from that server."
      ));
    })
    .finally(() => {
      window.clearTimeout(turnFallback);
      settlePageTurn();
    });
});

async function loadCatalog() {
  const url = new URL("data/catalog.json", document.baseURI);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Catalog request failed (${response.status})`);
  }
  const catalog = await response.json();
  if (!catalog || !Array.isArray(catalog.artists)) {
    throw new Error("Catalog is missing artists.");
  }
  return catalog;
}

function renderHome(catalog) {
  const label = catalog.label || {};
  const name = label.name || "QueryRecords";
  document.title = name;

  const hero = el("header", "hero");
  const credit = creditLine(label);
  if (credit) {
    const line = el("p", "hero-credit");
    line.textContent = credit;
    hero.append(line);
  }
  hero.append(wordmark(name));
  const lede = el("p", "lede");
  lede.textContent = label.description || "Albums, EPs, and singles.";
  hero.append(lede);

  const rosterHead = sectionHead("Roster", String(catalog.artists.length));
  const list = el("ol", "roster");
  catalog.artists.forEach((artist, index) => list.append(rosterItem(artist, index)));
  const rosterCol = el("section", "roster-col");
  rosterCol.append(rosterHead, list);

  const featureCol = el("aside", "feature-col");
  featureCol.append(latestCard(catalog));

  const layout = el("div", "home-layout");
  layout.append(rosterCol, featureCol);
  app.replaceChildren(hero, layout);
}

function renderArtist(catalog) {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("artist");
  const artist = catalog.artists.find((entry) => entry.slug === slug);
  const labelName = (catalog.label && catalog.label.name) || "QueryRecords";

  if (!artist) {
    document.title = `Artist not found · ${labelName}`;
    const missing = notice(
      "Artist not in the catalog",
      "That address does not match an artist in data/catalog.json."
    );
    const back = el("p");
    back.append(textLink("index.html", "Back to the roster"));
    missing.append(back);
    app.replaceChildren(crumb(labelName), missing);
    return;
  }

  document.title = `${artist.name} · ${labelName}`;

  const header = el("header", "artist-head");
  header.append(eyebrow("Artist"));
  const title = el("h1", "artist-title");
  title.textContent = artist.name;
  header.append(title);
  header.append(storeList(artist.links, ARTIST_STORES));
  header.append(jumpNav());

  const page = [crumb(labelName, artist.name), header];
  GROUPS.forEach((group) => page.push(releaseGroup(artist, group)));
  app.replaceChildren(...page);
}

function rosterItem(artist, index) {
  const item = el("li");
  const link = document.createElement("a");
  link.href = artistHref(artist.slug);

  const indexLabel = el("span", "index");
  indexLabel.setAttribute("aria-hidden", "true");
  indexLabel.textContent = String(index + 1).padStart(2, "0");

  const who = el("span", "who");
  const name = el("span", "name");
  name.textContent = artist.name;
  const meta = el("span", "meta");
  meta.textContent = rosterSummary(artist);
  who.append(name, meta);

  const go = el("span", "go");
  go.setAttribute("aria-hidden", "true");
  go.textContent = "→";

  link.append(indexLabel, who, go);
  item.append(link);
  return item;
}

function latestCard(catalog) {
  const pairs = catalog.artists.flatMap((artist) =>
    (artist.releases || []).map((release) => ({ artist, release }))
  );
  pairs.sort((a, b) => {
    const byDate = releaseSortKey(b.release).localeCompare(releaseSortKey(a.release));
    if (byDate !== 0) return byDate;
    return (a.release.title || "").localeCompare(b.release.title || "");
  });

  const wrap = el("div");
  if (!pairs.length) {
    wrap.append(sectionHead("Latest release", "0"));
    const empty = el("p", "empty");
    empty.textContent = "None confirmed yet.";
    wrap.append(empty);
    return wrap;
  }

  const { artist, release } = pairs[0];
  const card = el("article", "feature");
  card.append(coverElement(release, artist));
  card.append(eyebrow("Latest release"));

  const title = el("h2");
  title.append(textLink(artistHref(artist.slug), release.title));
  const by = el("p", "artist-line");
  by.append(textLink(artistHref(artist.slug), artist.name));
  const meta = el("p", "kicker");
  meta.append(typeYear(release));
  card.append(title, by, meta);

  const street = streetLine(release);
  if (street) {
    const line = el("p", "street");
    line.textContent = street;
    card.append(line);
  }
  card.append(storeList(release.links, RELEASE_STORES));
  wrap.append(card);
  return wrap;
}

function releaseGroup(artist, group) {
  const releases = (artist.releases || [])
    .filter((release) => release.type === group.type)
    .sort((a, b) => {
      const byDate = releaseSortKey(b).localeCompare(releaseSortKey(a));
      if (byDate !== 0) return byDate;
      return (a.title || "").localeCompare(b.title || "");
    });

  const section = el("section", "group");
  section.id = group.id;
  const head = el("div", "group-head");
  const title = document.createElement("h2");
  title.textContent = group.title;
  const count = el("span", "count");
  count.textContent = String(releases.length);
  head.append(title, count);
  section.append(head);

  if (group.note) {
    const note = el("p", "section-note");
    note.textContent = group.note;
    section.append(note);
  }

  if (!releases.length) {
    const empty = el("p", "empty");
    empty.textContent = "None confirmed yet.";
    section.append(empty);
    return section;
  }

  const list = el("div", "release-list");
  releases.forEach((release) => list.append(releaseCard(release, artist)));
  section.append(list);
  return section;
}

function releaseCard(release, artist) {
  const card = el("article", "release");
  const body = el("div", "release-body");
  const meta = el("p", "kicker");
  meta.append(typeYear(release));
  const title = document.createElement("h3");
  title.textContent = release.title || "Untitled";
  body.append(meta, title);

  const street = streetLine(release);
  if (street) {
    const line = el("p", "street");
    line.textContent = street;
    body.append(line);
  }
  body.append(storeList(release.links, RELEASE_STORES));
  card.append(coverElement(release, artist), body);
  return card;
}

function typeYear(release) {
  const fragment = document.createDocumentFragment();
  fragment.append(document.createTextNode(TYPE_LABEL[release.type] || "Release"));
  const dot = el("span", "dot");
  dot.setAttribute("aria-hidden", "true");
  dot.textContent = "·";
  fragment.append(dot);
  fragment.append(document.createTextNode(yearLabel(release)));
  return fragment;
}

function yearLabel(release) {
  return Number.isInteger(release.year) ? String(release.year) : "Year TBD";
}

function streetLine(release) {
  const formatted = formatStreetDate(release.streetDate, release.streetDateApproximate);
  if (!formatted) return "";
  const distributor = typeof release.distributor === "string" ? release.distributor.trim() : "";
  return distributor ? `${distributor} street date · ${formatted}` : `Street date · ${formatted}`;
}

function formatStreetDate(iso, approximate) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return "";
  const text = `${day} ${MONTHS[month - 1]} ${year}`;
  return approximate ? `~${text}` : text;
}

function releaseSortKey(release) {
  if (typeof release.streetDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(release.streetDate)) {
    return release.streetDate;
  }
  if (Number.isInteger(release.year)) return `${release.year}-00-00`;
  return "0000-00-00";
}

function rosterSummary(artist) {
  const releases = artist.releases || [];
  if (!releases.length) return "No releases confirmed";
  const parts = GROUPS.map((group) => {
    const count = releases.filter((release) => release.type === group.type).length;
    if (!count) return "";
    if (group.type === "album") return `${count} ${count === 1 ? "album" : "albums"}`;
    if (group.type === "ep") return `${count} ${count === 1 ? "EP" : "EPs"}`;
    return `${count} ${count === 1 ? "single" : "singles"}`;
  }).filter(Boolean);
  return parts.join(" · ");
}

function storeList(links, stores) {
  const list = el("ul", "stores");
  stores.forEach(([key, label]) => {
    const item = document.createElement("li");
    const href = safeUrl(links && links[key]);
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = label;
      const arrow = el("span", "ext");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      const sr = el("span", "sr-only");
      sr.textContent = " (opens in a new tab)";
      link.append(arrow, sr);
      item.append(link);
    } else {
      const tbd = el("span", "tbd");
      tbd.textContent = `${label} · TBD`;
      item.append(tbd);
    }
    list.append(item);
  });
  return list;
}

function coverElement(release, artist) {
  const pending = pendingCover(release, artist);
  const src = safeCover(release.cover);
  if (!src) return pending;

  const frame = el("div", "cover");
  const img = document.createElement("img");
  img.className = "cover-img";
  img.alt = `${release.title || "Release"} cover`;
  img.src = /^https?:\/\//i.test(src) ? src : new URL(src, document.baseURI).href;
  img.addEventListener("error", () => frame.replaceWith(pending));
  frame.append(img);
  return frame;
}

function pendingCover(release, artist) {
  const frame = el("div", "cover is-pending");
  frame.setAttribute("role", "img");
  frame.setAttribute("aria-label", `Cover artwork pending for ${release.title || "this release"}`);
  const mono = el("span", "mono");
  mono.setAttribute("aria-hidden", "true");
  mono.textContent = initials(artist.name);
  const cap = el("span", "cap");
  cap.setAttribute("aria-hidden", "true");
  cap.textContent = "Artwork pending";
  frame.append(mono, cap);
  return frame;
}

function jumpNav() {
  const nav = el("nav", "jump");
  nav.setAttribute("aria-label", "Release groups");
  GROUPS.forEach((group, index) => {
    if (index > 0) {
      const dot = el("span", "dot");
      dot.setAttribute("aria-hidden", "true");
      dot.textContent = "·";
      nav.append(dot);
    }
    nav.append(textLink(`#${group.id}`, group.title));
  });
  return nav;
}

function crumb(labelName, current) {
  const nav = el("nav", "crumb");
  nav.setAttribute("aria-label", "Breadcrumb");
  nav.append(textLink("index.html", labelName || "Catalog"));
  if (current) {
    const sep = el("span");
    sep.setAttribute("aria-hidden", "true");
    sep.textContent = "/";
    const here = el("span");
    here.textContent = current;
    nav.append(sep, here);
  }
  return nav;
}

function sectionHead(title, countText) {
  const head = el("div", "section-head");
  const heading = document.createElement("h2");
  heading.textContent = title;
  const count = el("span", "count");
  count.textContent = countText;
  head.append(heading, count);
  return head;
}

function wordmark(name) {
  const heading = el("h1", "wordmark");
  heading.setAttribute("aria-label", name);
  const parts = name.endsWith("Records") && name.length > "Records".length
    ? [name.slice(0, -"Records".length), "Records"]
    : [name];
  parts.forEach((part) => {
    const line = document.createElement("span");
    line.setAttribute("aria-hidden", "true");
    line.textContent = part;
    heading.append(line);
  });
  return heading;
}

function creditLine(label) {
  return [label.imprint, label.founder].filter((part) => typeof part === "string" && part.trim()).join(" · ");
}

function eyebrow(text) {
  const node = el("p", "eyebrow");
  node.textContent = text;
  return node;
}

function notice(title, message) {
  const box = el("div", "notice");
  const heading = document.createElement("h1");
  heading.textContent = title;
  const copy = el("p", "lede");
  copy.textContent = message;
  box.append(heading, copy);
  return box;
}

function textLink(href, text) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = text;
  return link;
}

function artistHref(slug) {
  return `artist.html?artist=${encodeURIComponent(slug)}`;
}

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function safeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.href;
  } catch {
    return "";
  }
}

function safeCover(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/")) return "";
  if (/^https?:\/\//i.test(trimmed)) return safeUrl(trimmed);
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return "";
  return trimmed;
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clearTurnKey() {
  try {
    sessionStorage.removeItem(TURN_KEY);
  } catch {
    /* Private browsing can block storage; the flip still runs once. */
  }
}

function settlePageTurn() {
  if (turnSettled) return;
  turnSettled = true;
  const root = document.documentElement;
  if (prefersReducedMotion() || !root.classList.contains("is-page-in")) {
    clearTurnKey();
    root.classList.remove("is-page-in", "is-page-settled", "from-back", "from-forward");
    return;
  }
  clearTurnKey();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.add("is-page-settled"));
  });
  window.setTimeout(() => {
    root.classList.add("is-page-instant");
    root.classList.remove("is-page-in", "is-page-settled", "from-back", "from-forward");
    requestAnimationFrame(() => root.classList.remove("is-page-instant"));
  }, PAGE_TURN_MS + 80);
}

function catalogPageKind(url) {
  const file = url.pathname.split("/").pop();
  if (file === "artist.html") return "artist";
  if (file === "index.html" || file === "") return "home";
  return "";
}

function onCatalogClick(event) {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (prefersReducedMotion() || pageTurnPending) return;
  const target = event.target instanceof Element ? event.target : event.target && event.target.parentElement;
  if (!target) return;
  const anchor = target.closest("a[href]");
  if (!anchor || anchor.hasAttribute("download")) return;
  if (anchor.target && anchor.target !== "_self") return;

  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return;
  }
  if (url.origin !== window.location.origin) return;

  const dest = catalogPageKind(url);
  const here = app && app.dataset.page === "artist" ? "artist" : "home";
  if ((dest !== "home" && dest !== "artist") || dest === here) return;

  event.preventDefault();
  pageTurnPending = true;
  try {
    const back = dest === "home";
    try {
      sessionStorage.setItem(TURN_KEY, back ? "back" : "forward");
    } catch {
      /* Navigation still proceeds if storage is unavailable. */
    }
    document.documentElement.classList.remove("is-page-in", "is-page-settled", "from-back", "from-forward");
    document.documentElement.classList.add("is-page-out", back ? "to-back" : "to-forward");

    const from = window.location.href;
    window.setTimeout(() => {
      window.location.href = url.href;
    }, PAGE_TURN_MS);
    window.setTimeout(() => {
      if (window.location.href !== from) return;
      pageTurnPending = false;
      clearTurnKey();
      const root = document.documentElement;
      root.classList.add("is-page-instant");
      root.classList.remove("is-page-out", "to-back", "to-forward");
      requestAnimationFrame(() => root.classList.remove("is-page-instant"));
    }, 4000);
  } catch {
    window.location.href = url.href;
  }
}
