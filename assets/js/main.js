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

// Fetch and render experience data
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
  } catch (error) {
    showError(experienceList, 'work experience', error);
  }
}

// Fetch and render publications data
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
  } catch (error) {
    showError(publicationsList, 'publications', error);
  }
}

// ---------- Playlists: a list of Spotify links played through one embed ----------
const playlistList = document.getElementById('playlist-list');
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

let entries = [];
let current = 0;
let controller = null;
let spotifyAPI = null;
let isPaused = true;

// "https://open.spotify.com/album/ID?si=..." -> "spotify:album:ID"
function spotifyURI(link) {
  const match = String(link).match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
  return match ? `spotify:${match[1]}:${match[2]}` : null;
}

function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function showEntry(index) {
  const entry = entries[index];
  if (!entry) return;
  deck.title.textContent = entry.title;
  deck.by.textContent = [entry.by, entry.type].filter(Boolean).join(' · ');
  deck.count.textContent = `04.${index + 1} / ${entries.length}`;
  playlistList.querySelectorAll('.row').forEach((row, i) => row.classList.toggle('is-active', i === index));
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
  } else if (spotifyAPI) {
    createController(autoplay);
  }
}

function createController(autoplay) {
  const element = document.getElementById('spotify-embed');
  if (!element || !entries.length) return;
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
  if (entries.length) createController(false);
};

async function loadPlaylists() {
  if (!playlistList) return;

  try {
    const data = await loadJSON('assets/data/playlists.json');
    entries = (Array.isArray(data) ? data : [])
      .map((entry) => ({ ...entry, uri: spotifyURI(entry.spotify) }))
      .filter((entry) => entry.uri);

    if (!entries.length) {
      playlistList.innerHTML = '<li class="info">No playlists yet.</li>';
      return;
    }

    playlistList.innerHTML = entries.map((entry, i) => `
      <li class="row" data-index="${i}">
        <span class="row-meta">04.${i + 1}</span>
        <div class="row-main">
          <h3><button type="button" class="row-play">${esc(entry.title)}</button></h3>
          <p>${esc(entry.by)}</p>
          ${entry.note ? `<p class="note">${esc(entry.note)}</p>` : ''}
        </div>
        <span class="row-side">${esc(entry.type || entry.uri.split(':')[1])} ▶</span>
      </li>
    `).join('');

    playlistList.addEventListener('click', (e) => {
      const row = e.target.closest('.row');
      if (row) select(Number(row.dataset.index), true);
    });

    showEntry(0);
    if (spotifyAPI) createController(false);
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

// Recommend a song: opens the visitor's email, addressed to Dawit
const recommendForm = document.getElementById('recommend');

recommendForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(recommendForm);
  const subject = `Song for you: ${f.get('song')} by ${f.get('artist')}`;
  const body = [
    `Song: ${f.get('song')}`,
    `Artist: ${f.get('artist')}`,
    f.get('why') ? `Why: ${f.get('why')}` : '',
    '',
    f.get('name') ? `From ${f.get('name')}` : '',
  ].filter((line, i, all) => line || (i > 0 && all[i - 1])).join('\n');
  window.location.href = `mailto:civiliandavid0@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

// Load data on initialization
document.addEventListener('DOMContentLoaded', () => {
  loadExperience();
  loadPublications();
  loadPlaylists();
});
