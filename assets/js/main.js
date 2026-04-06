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
  if (!experienceList) return;
  
  try {
    const response = await fetch('assets/data/experience.json');
    if (!response.ok) throw new Error('Failed to load experience data');
    const data = await response.json();
    
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
    experienceList.innerHTML = '<p class="error">Failed to load work experience. Please try again later.</p>';
  }
}

// Load data on initialization
document.addEventListener('DOMContentLoaded', loadExperience);

// About & Experience Panels Toggle
const aboutLink = document.getElementById('about-link');
const aboutPanel = document.getElementById('about-panel');
const experienceLink = document.getElementById('experience-link');
const experiencePanel = document.getElementById('experience-panel');
const backdrop = document.getElementById('backdrop');

function togglePanel(panel, show) {
  if (show) {
    // Close other panels first
    [aboutPanel, experiencePanel].forEach(p => {
      if (p !== panel) p.classList.remove('active');
    });
    
    panel.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden'; 
  } else {
    panel.classList.remove('active');
    // Only remove backdrop if no panels are active
    if (!aboutPanel.classList.contains('active') && !experiencePanel.classList.contains('active')) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

function closeAllPanels() {
  [aboutPanel, experiencePanel].forEach(p => p.classList.remove('active'));
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

if (backdrop) {
  backdrop.addEventListener('click', closeAllPanels);
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllPanels();
  }
});
