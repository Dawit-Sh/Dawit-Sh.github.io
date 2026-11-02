// Escape text from the data files before it goes into HTML
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function showError(list, what, error) {
  console.error(`Error loading ${what}:`, error);
  list.innerHTML = `
    <li class="error-message">
      <p>Failed to load ${what}.</p>
      <small>${esc(error.message)}</small>
    </li>
  `;
}

function setMeta(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ---------- Folds: one strip open at a time ----------
const folds = [...document.querySelectorAll('.fold')];
const foldOpeners = {};   // id -> callback run the first time a fold opens

function setFold(fold, open) {
  const head = fold.querySelector('.fold-head');
  fold.classList.toggle('is-open', open);
  head.setAttribute('aria-expanded', String(open));
  if (open) {
    // replay the red wipe across the strip
    fold.classList.remove('is-wiping');
    void fold.offsetWidth;
    fold.classList.add('is-wiping');
    if (foldOpeners[fold.id]) {
      foldOpeners[fold.id]();
      delete foldOpeners[fold.id];
    }
  }
}

function openFold(id, scroll) {
  const fold = document.getElementById(id);
  if (!fold || !fold.classList.contains('fold')) return;
  folds.forEach((f) => { if (f !== fold && f.classList.contains('is-open')) setFold(f, false); });
  if (!fold.classList.contains('is-open')) setFold(fold, true);
  if (scroll) {
    // wait for the other strips to fold away before measuring
    setTimeout(() => fold.scrollIntoView({ behavior: 'smooth', block: 'start' }), 380);
  }
}

folds.forEach((fold) => {
  fold.querySelector('.fold-head').addEventListener('click', () => {
    if (fold.classList.contains('is-open')) setFold(fold, false);
    else openFold(fold.id, true);
  });
  fold.addEventListener('animationend', (e) => {
    if (e.animationName === 'wipe') fold.classList.remove('is-wiping');
  });
});

document.querySelectorAll('a[data-fold]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openFold(link.dataset.fold, true);
    history.replaceState(null, '', `#${link.dataset.fold}`);
  });
});

// Number the rows so CSS can stagger them in when a fold opens
function numberRows(list) {
  [...list.children].forEach((child, i) => child.style.setProperty('--i', i));
}

// ---------- Experience ----------
const experienceList = document.getElementById('experience-list');

async function loadExperience() {
  if (!experienceList) return;

  try {
    const data = await loadJSON('assets/data/experience.json');

    if (!Array.isArray(data) || data.length === 0) {
      experienceList.innerHTML = '<li class="info">No work experience found.</li>';
      return;
    }

    experienceList.innerHTML = data.map((exp, i) => `
      <li class="row">
        <span class="row-meta">02.${i + 1}</span>
        <div class="row-main">
          <h3>${esc(exp.role)}</h3>
          <p>${esc(exp.company)}</p>
          ${exp.description ? `<p class="note">${esc(exp.description)}</p>` : ''}
          ${exp.details ? `<ul>${exp.details.map(detail => `<li>${esc(detail)}</li>`).join('')}</ul>` : ''}
        </div>
        <span class="row-side">${esc(exp.date)}</span>
      </li>
    `).join('');
    numberRows(experienceList);

    const years = data.flatMap((exp) => String(exp.date).match(/\d{4}/g) || []).map(Number);
    const present = data.some((exp) => /present/i.test(exp.date));
    const span = years.length ? `${Math.min(...years)}–${present ? 'now' : Math.max(...years)}` : '';
    setMeta('experience-meta', [`${data.length} roles`, span].filter(Boolean).join(' · '));
  } catch (error) {
    showError(experienceList, 'work experience', error);
  }
}

// ---------- Publications ----------
const publicationsList = document.getElementById('publications-list');

async function loadPublications() {
  if (!publicationsList) return;

  try {
    const data = await loadJSON('assets/data/publications.json');

    if (!Array.isArray(data) || data.length === 0) {
      publicationsList.innerHTML = '<li class="info">No publications found.</li>';
      return;
    }

    publicationsList.innerHTML = data.map((pub, i) => {
      const actions = [];
      if (pub.url) {
        actions.push(`<a href="${esc(pub.url)}" target="_blank" rel="noopener noreferrer">View online ↗</a>`);
      }
      if (pub.pdf) {
        actions.push(`<a href="${esc(pub.pdf)}" target="_blank" rel="noopener noreferrer" download>Download PDF ↓</a>`);
      }
      return `
        <li class="row">
          <span class="row-meta">03.${i + 1}</span>
          <div class="row-main">
            <h3>${esc(pub.title)}</h3>
            <p>${esc(pub.venue)}</p>
            ${actions.length > 0 ? `<div class="row-links">${actions.join('')}</div>` : ''}
          </div>
          <span class="row-side"></span>
        </li>
      `;
    }).join('');
    numberRows(publicationsList);

    const years = data.flatMap((pub) => String(pub.venue).match(/\b(19|20)\d{2}\b/g) || []).map(Number);
    setMeta('publications-meta', [`${data.length} ${data.length === 1 ? 'paper' : 'papers'}`,
      years.length ? Math.max(...years) : ''].filter(Boolean).join(' · '));
  } catch (error) {
    showError(publicationsList, 'publications', error);
  }
}

// ---------- Socials: assets/data/socials.json, links left empty stay hidden ----------
async function loadSocials() {
  const lists = document.querySelectorAll('[data-socials]');
  if (!lists.length) return;

  try {
    const data = (await loadJSON('assets/data/socials.json')).filter((s) => s.url);
    lists.forEach((list) => {
      const labels = list.hasAttribute('data-labels');
      list.innerHTML = data.map((s, i) => `
        <li style="--i:${i}">
          <a class="social" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.name)}" title="${esc(s.name)}">
            <span class="ico" style="-webkit-mask-image:url('assets/icons/${esc(s.icon)}.svg');mask-image:url('assets/icons/${esc(s.icon)}.svg')" aria-hidden="true"></span>
            ${labels ? `<span class="social-name">${esc(s.name)}</span>` : ''}
          </a>
        </li>
      `).join('');
    });
  } catch (error) {
    console.error('Error loading socials:', error);
  }
}

// ---------- Playlists: Spotify links, played through one embed ----------
// assets/data/playlists.json takes plain links or {"spotify": link, "by": "...", "note": "..."}.
// Titles and cover art come from Spotify's public oEmbed and are cached in the browser.
const playlistList = document.getElementById('playlist-list');
const playlistFilters = document.getElementById('pl-filters');
const deck = {
  title: document.getElementById('deck-title'),
  by: document.getElementById('deck-by'),
  count: document.getElementById('deck-count'),
  play: document.getElementById('deck-play'),
  prev: document.getElementById('deck-prev'),
  next: document.getElementById('deck-next'),
  bar: document.getElementById('deck-bar'),
  time: document.getElementById('deck-time'),
};

const TYPE_LABELS = { track: 'Song', album: 'Album', playlist: 'Playlist', artist: 'Artist', episode: 'Episode', show: 'Podcast' };
const CACHE_DAYS = 14;

let entries = [];
let current = 0;
let controller = null;
let spotifyAPI = null;
let deckWanted = false;   // the embed is only built once the fold has been opened
let isPaused = true;

// "https://open.spotify.com/intl-de/album/ID?si=..." -> { type: "album", id: "ID" }
function parseSpotify(link) {
  const match = String(link).match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
  return match ? { type: match[1], id: match[2] } : null;
}

function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function readCache(key) {
  try {
    const hit = JSON.parse(localStorage.getItem(key) || 'null');
    return hit && Date.now() - hit.at < CACHE_DAYS * 864e5 ? hit : null;
  } catch {
    return null;
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...value, at: Date.now() }));
  } catch {
    // private mode or storage full: just fetch again next time
  }
}

async function fetchSpotifyMeta(entry) {
  const key = `oembed:${entry.type}:${entry.id}`;
  const cached = readCache(key);
  if (cached) return cached;
  const url = `https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/${entry.type}/${entry.id}`)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`oEmbed ${response.status}`);
  const data = await response.json();
  const meta = { title: data.title, image: data.thumbnail_url };
  writeCache(key, meta);
  return meta;
}

function entryBy(entry) {
  return entry.by || TYPE_LABELS[entry.type];
}

function showEntry(index) {
  const entry = entries[index];
  if (!entry) return;
  deck.title.textContent = entry.title || TYPE_LABELS[entry.type];
  deck.by.textContent = [entry.by, TYPE_LABELS[entry.type]].filter(Boolean).join(' · ');
  deck.count.textContent = `04.${index + 1} / ${entries.length}`;
  playlistList.querySelectorAll('.cover').forEach((cover, i) => {
    cover.classList.toggle('is-active', i === index);
    cover.setAttribute('aria-pressed', String(i === index));
  });
}

function select(index, autoplay) {
  if (!entries.length) return;
  current = (index + entries.length) % entries.length;
  showEntry(current);
  deck.bar.style.width = '0';
  deck.time.textContent = '0:00';
  if (controller) {
    controller.loadUri(entries[current].uri);
    if (autoplay) controller.play();
  } else {
    buildDeck(autoplay);
  }
}

function buildDeck(autoplay) {
  const element = document.getElementById('spotify-embed');
  if (!spotifyAPI || !deckWanted || controller || !element || !entries.length) return;
  spotifyAPI.createController(element, { uri: entries[current].uri, width: '100%', height: 152 }, (ctrl) => {
    controller = ctrl;
    controller.addListener('playback_update', (e) => {
      isPaused = e.data.isPaused;
      deck.play.textContent = isPaused ? '▶' : '❚❚';
      deck.play.setAttribute('aria-label', isPaused ? 'Play' : 'Pause');
      if (e.data.duration) {
        deck.bar.style.width = `${Math.min(100, (e.data.position / e.data.duration) * 100)}%`;
        deck.time.textContent = formatTime(e.data.position);
      }
    });
    if (autoplay) controller.play();
  });
}

// Called by Spotify's iframe API script once it has loaded
window.onSpotifyIframeApiReady = (IFrameAPI) => {
  spotifyAPI = IFrameAPI;
  buildDeck(false);
};

foldOpeners.playlists = () => {
  deckWanted = true;
  buildDeck(false);
};

function renderFilters() {
  const types = [...new Set(entries.map((e) => e.type))];
  if (types.length < 2) {
    playlistFilters.hidden = true;
    return;
  }
  playlistFilters.innerHTML = ['all', ...types].map((type) => `
    <button type="button" class="chip${type === 'all' ? ' is-on' : ''}" data-type="${type}">
      ${type === 'all' ? 'All' : `${TYPE_LABELS[type]}s`}
      <span>${type === 'all' ? entries.length : entries.filter((e) => e.type === type).length}</span>
    </button>
  `).join('');
  playlistFilters.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    playlistFilters.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === chip));
    playlistList.querySelectorAll('li').forEach((li) => {
      li.hidden = chip.dataset.type !== 'all' && li.dataset.type !== chip.dataset.type;
    });
  });
}

function paintCover(index) {
  const entry = entries[index];
  const li = playlistList.children[index];
  if (!li) return;
  li.querySelector('.cover-title').textContent = entry.title || TYPE_LABELS[entry.type];
  if (entry.image) {
    li.querySelector('img').src = entry.image;
    li.classList.add('has-art');
  }
  if (index === current) showEntry(current);
}

async function loadPlaylists() {
  if (!playlistList) return;

  try {
    const data = await loadJSON('assets/data/playlists.json');
    entries = (Array.isArray(data) ? data : [])
      .map((item) => (typeof item === 'string' ? { spotify: item } : item))
      .map((item) => ({ ...item, ...parseSpotify(item.spotify) }))
      .filter((item) => item.id)
      .map((item) => ({ ...item, uri: `spotify:${item.type}:${item.id}` }));

    if (!entries.length) {
      playlistList.innerHTML = '<li class="info">No playlists yet.</li>';
      setMeta('playlists-meta', 'Coming soon');
      return;
    }

    playlistList.innerHTML = entries.map((entry, i) => `
      <li data-type="${entry.type}" style="--i:${Math.min(i, 24)}">
        <button type="button" class="cover" data-index="${i}" aria-pressed="false">
          <span class="cover-art"><img alt="" loading="lazy" decoding="async"></span>
          <span class="cover-text">
            <span class="cover-title">${esc(entry.title || TYPE_LABELS[entry.type])}</span>
            <span class="cover-by">${esc(entryBy(entry))}</span>
          </span>
          <span class="cover-num">${String(i + 1).padStart(2, '0')}</span>
        </button>
      </li>
    `).join('');

    playlistList.addEventListener('click', (e) => {
      const cover = e.target.closest('.cover');
      if (cover) select(Number(cover.dataset.index), true);
    });

    renderFilters();
    showEntry(0);
    setMeta('playlists-meta', `${entries.length} on rotation · Spotify`);

    // Fill in titles and covers as Spotify answers (an explicit "title" in the file wins)
    entries.forEach((entry, i) => {
      fetchSpotifyMeta(entry)
        .then((meta) => {
          entry.title = entry.title || meta.title;
          entry.image = meta.image;
          paintCover(i);
        })
        .catch((error) => console.warn('Spotify details unavailable for', entry.spotify, error.message));
    });
  } catch (error) {
    showError(playlistList, 'playlists', error);
  }
}

deck.play?.addEventListener('click', () => {
  if (controller) controller.togglePlay();
  else select(current, true);
});
deck.prev?.addEventListener('click', () => select(current - 1, !isPaused));
deck.next?.addEventListener('click', () => select(current + 1, !isPaused));

// Recommend a song: opens the visitor's email, addressed to the form's data-to
const recommendForm = document.getElementById('recommend');

recommendForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const to = recommendForm.dataset.to;
  if (!to) return;
  const f = new FormData(recommendForm);
  const subject = `Song for you: ${f.get('song')} by ${f.get('artist')}`;
  const body = [
    `Song: ${f.get('song')}`,
    `Artist: ${f.get('artist')}`,
    f.get('why') ? `Why: ${f.get('why')}` : '',
    '',
    f.get('name') ? `From ${f.get('name')}` : '',
  ].filter((line, i, all) => line || (i > 0 && all[i - 1])).join('\n');
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

// Load data on initialization, then open a fold named in the address (#playlists etc.)
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadExperience(), loadPublications(), loadPlaylists(), loadSocials()]);
  const id = location.hash.slice(1);
  if (id && folds.some((f) => f.id === id)) openFold(id, true);
});
