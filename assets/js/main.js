// dawitsh.dev, design D (2026-11-17). Everything on the page comes from assets/data/*.json.

// Escape text from the data files before it goes into HTML
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function loadJSON(path) {
  // revalidate every visit so edited lists show up right away (GitHub Pages caches for 10 minutes)
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  return response.json();
}

function showError(el, what, error) {
  console.error(`Error loading ${what}:`, error);
  el.innerHTML = `<li class="info">Couldn't load ${esc(what)} right now.</li>`;
}

function domain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

// ---------- Theme: dark by default, the visitor's choice is remembered ----------
const root = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');

function paintThemeButton() {
  const dark = root.dataset.theme !== 'light';
  themeBtn.querySelector('.theme-label').textContent = dark ? 'Light' : 'Dark';
  themeBtn.setAttribute('aria-label', dark ? 'Switch to the light theme' : 'Switch to the dark theme');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f1012' : '#f7f7f8');
}

function setTheme(next) {
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch { /* fine: it just won't be remembered */ }
  paintThemeButton();
}

// The switch fades the whole page from one theme to the other (a view transition where the
// browser has it, a colour transition on every element where it doesn't, nothing for reduced motion)
themeBtn?.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) {
    setTheme(next);
  } else if (document.startViewTransition) {
    document.startViewTransition(() => setTheme(next));
  } else {
    root.classList.add('theming');
    setTheme(next);
    setTimeout(() => root.classList.remove('theming'), 600);
  }
  recolorPlayer();
});
if (themeBtn) paintThemeButton();

// ---------- The section list on the left follows the scroll ----------
const tocLinks = [...document.querySelectorAll('.toc a')];
const sections = tocLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

if (sections.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      tocLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  sections.forEach((s) => io.observe(s));
}

// ---------- Work (assets/data/experience.json) ----------
async function loadExperience() {
  const list = document.getElementById('experience-list');
  if (!list) return;
  try {
    const rows = await loadJSON('assets/data/experience.json');
    list.innerHTML = rows.map((r) => `
      <li class="job">
        <span class="yr">${esc(String(r.date || '').replace(/\s*-\s*/g, ' – ').replace(/Present/i, 'Now'))}</span>
        <div><div class="ro">${esc(r.role)}</div><div class="co">${esc(r.company)}</div></div>
      </li>`).join('');
  } catch (error) {
    showError(list, 'work experience', error);
  }
}

// ---------- Publications (publications.json) ----------
async function loadPublications() {
  const list = document.getElementById('publications-list');
  if (!list) return;
  try {
    const pubs = await loadJSON('assets/data/publications.json');
    list.innerHTML = pubs.map((p) => {
      const year = (String(p.venue || '').match(/(19|20)\d{2}(?!.*\d{4})/) || [''])[0];
      const venue = String(p.venue || '').replace(/,?\s*(19|20)\d{2}\s*$/, '');
      return `<li><a href="${esc(p.url || p.pdf || '#')}" target="_blank" rel="noopener">
        <span class="t">${esc(p.title)}<span class="v">${esc(venue)}</span></span><span class="y">${esc(year)}</span></a></li>`;
    }).join('') || '<li class="info">Nothing here yet.</li>';
  } catch (error) {
    showError(list, 'publications', error);
  }
}

// ---------- Music (playlists.json; tracklists filled by tools/bandcamp-tracks.py) ----------
const albumsEl = document.getElementById('albums');
let albums = [];
let playing = null;   // { a: album index, track: track id or null }

function mmss(secs) {
  const s = Math.max(0, Math.round(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function niceDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function isNew(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return !isNaN(d) && (Date.now() - d) / 864e5 < 45;
}

function playerSrc(album, track) {
  const css = getComputedStyle(root);
  const bg = css.getPropertyValue('--bc-bg').trim() || '333333';
  const link = css.getPropertyValue('--bc-link').trim() || 'ff3b1f';
  return `https://bandcamp.com/EmbeddedPlayer/album=${album}/size=large/bgcol=${bg}/linkcol=${link}/tracklist=false/artwork=small/${track ? `track=${track}/` : ''}transparent=true/`;
}

// Every album is one collapsed row (cover, title, details); its tracklist opens on click.
// Newest release first, so a new album just goes to the top of the stack.
function renderAlbums() {
  albumsEl.innerHTML = albums.map((a, i) => {
    const tracks = a.tracks || [];
    const total = tracks.reduce((sum, t) => sum + (t.secs || 0), 0);
    const meta = [
      i === 0 && a.released && isNew(a.released) ? '<span class="new">Out now</span>' : '',
      a.by ? esc(a.by) : '',
      a.released ? esc(niceDate(a.released)) : '',
      tracks.length ? `${tracks.length} tracks` : '',
      total ? mmss(total) : '',
    ].filter(Boolean).join(' · ');
    return `
      <article class="alb" data-i="${i}">
        <button type="button" class="art" data-play aria-label="Play ${esc(a.title)}">
          <img src="${esc(a.image || '')}" alt="" loading="lazy" decoding="async"><span class="pl" aria-hidden="true">▶</span>
        </button>
        <div class="alb-body">
          <button type="button" class="alb-head" aria-expanded="false" aria-controls="tl-${i}">
            <span class="ttl eth">${esc(a.title)}</span>
            <span class="meta">${meta}</span>
            <span class="tog"><span class="tog-label">Tracklist</span><span class="chev" aria-hidden="true"></span></span>
          </button>
          <div class="player" hidden></div>
          <div class="tl-wrap" id="tl-${i}" hidden>
            <ol class="tl">
              ${tracks.map((t) => `
                <li><button type="button" data-track="${t.id}">
                  <span class="n">${String(t.n).padStart(2, '0')}</span><span class="t">${esc(t.title)}</span><span class="d">${mmss(t.secs)}</span>
                </button></li>`).join('')}
            </ol>
            <a class="bc-link" href="${esc(a.bandcamp)}" target="_blank" rel="noopener">Open on Bandcamp ↗</a>
          </div>
        </div>
      </article>`;
  }).join('');
}

function setOpen(el, open) {
  const head = el.querySelector('.alb-head');
  el.classList.toggle('open', open);
  head.setAttribute('aria-expanded', String(open));
  head.querySelector('.tog-label').textContent = open ? 'Hide tracklist' : 'Tracklist';
  el.querySelector('.tl-wrap').hidden = !open;
}

// Bandcamp's own player plays the album (or the picked track); only one is ever on the page
function play(i, track) {
  const same = playing && playing.a === i && playing.track === (track || null);
  albumsEl.querySelectorAll('.alb').forEach((el) => {
    el.classList.remove('on');
    const p = el.querySelector('.player');
    p.hidden = true;
    p.innerHTML = '';
  });
  albumsEl.querySelectorAll('.tl button.cur').forEach((b) => b.classList.remove('cur'));
  if (same) {   // a second click on the same thing puts the player away
    playing = null;
    return;
  }
  playing = { a: i, track: track || null };
  const el = albumsEl.querySelector(`.alb[data-i="${i}"]`);
  const a = albums[i];
  el.classList.add('on');
  if (track) el.querySelector(`[data-track="${track}"]`)?.classList.add('cur');
  const p = el.querySelector('.player');
  p.hidden = false;
  p.innerHTML = `<iframe src="${playerSrc(a.album, track)}" title="${esc(a.title)} on Bandcamp" loading="lazy" allow="autoplay" seamless></iframe>
    <p>Press play in the player. It's Bandcamp's own, so the album supports me directly.</p>`;
}

function recolorPlayer() {
  if (!playing) return;
  const frame = albumsEl.querySelector(`.alb[data-i="${playing.a}"] .player iframe`);
  if (frame) frame.src = playerSrc(albums[playing.a].album, playing.track);
}

albumsEl?.addEventListener('click', (e) => {
  const el = e.target.closest('.alb');
  if (!el) return;
  const i = Number(el.dataset.i);
  const trackBtn = e.target.closest('[data-track]');
  if (trackBtn) return play(i, Number(trackBtn.dataset.track));
  if (e.target.closest('[data-play]')) return play(i, null);
  if (e.target.closest('.alb-head')) setOpen(el, !el.classList.contains('open'));
});

async function loadMusic() {
  if (!albumsEl) return;
  try {
    const data = await loadJSON('assets/data/playlists.json');
    albums = (Array.isArray(data) ? data : [])
      .filter((a) => a && a.bandcamp && a.album)
      .sort((x, y) => String(y.released || '').localeCompare(String(x.released || '')));
    if (!albums.length) {
      albumsEl.innerHTML = '<p class="info">New music soon.</p>';
      return;
    }
    renderAlbums();
  } catch (error) {
    console.error('Error loading music:', error);
    albumsEl.innerHTML = '<p class="info">Couldn\'t load the music right now.</p>';
  }
}

// ---------- Network (network.json): just the names ----------
async function loadNetwork() {
  const list = document.getElementById('network-list');
  if (!list) return;
  try {
    const people = (await loadJSON('assets/data/network.json'))
      .map((p) => (typeof p === 'string' ? { url: p } : p))
      .filter((p) => p && p.url);
    list.innerHTML = people.map((p) => `
      <li><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name || domain(p.url))}</a></li>`).join('')
      || '<li class="info">Coming soon.</li>';
  } catch (error) {
    showError(list, 'the network', error);
  }
}

// ---------- Socials (socials.json): the ones with a url ----------
async function loadSocials() {
  try {
    const socials = await loadJSON('assets/data/socials.json');
    const live = socials.filter((s) => s.url);
    document.querySelectorAll('[data-socials]').forEach((ul) => {
      ul.innerHTML = live.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join('');
    });
    return socials;
  } catch (error) {
    console.error('Error loading socials:', error);
    return [];
  }
}

// ---------- Addis Ababa now: the time (and the Ethiopian clock) and the weather ----------
const ADDIS = { tz: 'Africa/Addis_Ababa', lat: 9.03, lon: 38.74 };
const nowTime = document.getElementById('now-time');
const nowEth = document.getElementById('now-eth');
const nowWx = document.getElementById('now-wx');

function addisClock() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: ADDIS.tz, hour: 'numeric', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const h = Number(parts.hour) % 24;
  const m = parts.minute;
  nowTime.textContent = `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
  // the Ethiopian clock starts the day at sunrise: 7 AM is 1 o'clock
  nowEth.textContent = `${(h + 18) % 12 || 12}:${m} in Ethiopian time`;
}

// WMO weather codes, as Open-Meteo sends them
function weatherWords(code) {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly cloudy';
  if (code === 3) return 'overcast';
  if (code <= 48) return 'fog';
  if (code <= 57) return 'drizzle';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'showers';
  if (code <= 86) return 'snow showers';
  return 'thunderstorm';
}

async function addisWeather() {
  const KEY = 'addis-weather';
  let w = null;
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (cached && Date.now() - cached.at < 15 * 60 * 1000) w = cached;
  } catch { /* storage blocked: fetch fresh */ }

  if (!w) {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${ADDIS.lat}&longitude=${ADDIS.lon}`
        + `&current=temperature_2m,weather_code&timezone=${encodeURIComponent(ADDIS.tz)}`);
      if (!res.ok) throw new Error(res.status);
      const { current } = await res.json();
      w = { at: Date.now(), temp: Math.round(current.temperature_2m), code: current.weather_code };
      try { localStorage.setItem(KEY, JSON.stringify(w)); } catch { /* fine without the cache */ }
    } catch (error) {
      console.warn('Weather unavailable:', error);
      return;
    }
  }
  nowWx.textContent = ` · ${w.temp}°C, ${weatherWords(w.code)}`;
}

if (nowTime) {
  addisClock();
  setInterval(addisClock, 15 * 1000);
  addisWeather();
  setInterval(addisWeather, 15 * 60 * 1000);
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Load everything ----------
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadExperience(), loadPublications(), loadMusic(), loadNetwork(), loadSocials()]);
});
