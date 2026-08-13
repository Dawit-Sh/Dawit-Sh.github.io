// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Add hover effect for nav items (only on devices that support hover)
if (window.matchMedia("(hover: hover)").matches) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("mouseenter", function () {
      this.style.transform = "translateX(10px)";
      setTimeout(() => {
        this.style.transform = "translateX(0)";
      }, 300);
    });
  });
}

// Fetch and render experience data
const experienceList = document.getElementById('experience-list');

async function loadExperience() {
  if (!experienceList) {
    console.error('Experience list container not found');
    return;
  }

  try {
    const response = await fetch('assets/data/experience.json');
    if (!response.ok) {
      throw new Error(`Failed to load experience data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      experienceList.innerHTML = '<p class="info">No work experience found.</p>';
      return;
    }

    experienceList.innerHTML = data.map(exp => `
      <div class="experience-item">
        <div class="exp-dot"></div>
        <div class="exp-info">
          <h3 class="exp-role">${exp.role}</h3>
          <p class="exp-company">${exp.company}</p>
          ${exp.description ? `<p class="exp-description">${exp.description}</p>` : ''}
          ${exp.details ? `<ul class="exp-details">${exp.details.map(detail => `<li>${detail}</li>`).join('')}</ul>` : ''}
        </div>
        <div class="exp-date">${exp.date}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading experience:', error);
    experienceList.innerHTML = `
      <div class="error-message">
        <p>Failed to load work experience.</p>
        <small>${error.message}</small>
      </div>
    `;
  }
}

// Fetch and render publications data
const publicationsList = document.getElementById('publications-list');

async function loadPublications() {
  if (!publicationsList) {
    console.error('Publications list container not found');
    return;
  }

  try {
    const response = await fetch('assets/data/publications.json');
    if (!response.ok) {
      throw new Error(`Failed to load publications data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      publicationsList.innerHTML = '<p class="info">No publications found.</p>';
      return;
    }

    publicationsList.innerHTML = data.map(pub => {
      const actions = [];
      if (pub.url) {
        actions.push(`<a href="${pub.url}" class="pub-action-link" target="_blank" rel="noopener noreferrer">
          <i class="fas fa-external-link-alt"></i> View Online
        </a>`);
      }
      if (pub.pdf) {
        actions.push(`<a href="${pub.pdf}" class="pub-action-link" target="_blank" rel="noopener noreferrer" download>
          <i class="fas fa-file-pdf"></i> Download PDF
        </a>`);
      }
      return `
        <div class="publication-item">
          <div class="pub-dot"></div>
          <div class="pub-info">
            <h3 class="pub-title">${pub.title}</h3>
            <p class="pub-venue">${pub.venue}</p>
            ${actions.length > 0 ? `<div class="pub-actions">${actions.join('')}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading publications:', error);
    publicationsList.innerHTML = `
      <div class="error-message">
        <p>Failed to load publications.</p>
        <small>${error.message}</small>
      </div>
    `;
  }
}

// Load data on initialization
document.addEventListener('DOMContentLoaded', () => {
  loadExperience();
  loadPublications();
});

// About, Experience & Publications Panels Toggle
const aboutLink = document.getElementById('about-link');
const aboutPanel = document.getElementById('about-panel');
const experienceLink = document.getElementById('experience-link');
const experiencePanel = document.getElementById('experience-panel');
const publicationsLink = document.getElementById('publications-link');
const publicationsPanel = document.getElementById('publications-panel');
const backdrop = document.getElementById('backdrop');

const allPanels = [aboutPanel, experiencePanel, publicationsPanel].filter(Boolean);

function togglePanel(panel, show) {
  if (show) {
    // Close other panels first
    allPanels.forEach(p => {
      if (p !== panel) p.classList.remove('active');
    });

    panel.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    panel.classList.remove('active');
    // Only remove backdrop if no panels are active
    if (allPanels.every(p => !p.classList.contains('active'))) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

function closeAllPanels() {
  allPanels.forEach(p => p.classList.remove('active'));
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

if (aboutLink && aboutPanel && backdrop) {
  aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    togglePanel(aboutPanel, !aboutPanel.classList.contains('active'));
  });
}

if (experienceLink && experiencePanel) {
  experienceLink.addEventListener('click', (e) => {
    e.preventDefault();
    togglePanel(experiencePanel, !experiencePanel.classList.contains('active'));
  });
}

if (publicationsLink && publicationsPanel) {
  publicationsLink.addEventListener('click', (e) => {
    e.preventDefault();
    togglePanel(publicationsPanel, !publicationsPanel.classList.contains('active'));
  });
}

if (backdrop) {
  backdrop.addEventListener('click', closeAllPanels);
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllPanels();
  }
});
