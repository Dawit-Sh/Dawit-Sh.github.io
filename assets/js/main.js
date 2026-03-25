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

// Add hover effect for nav items
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("mouseenter", function () {
    this.style.transform = "translateX(10px)";
    setTimeout(() => {
      this.style.transform = "translateX(0)";
    }, 300);
  });
});

// About Me Panel Toggle
const aboutLink = document.getElementById('about-link');
const aboutPanel = document.getElementById('about-panel');
const backdrop = document.getElementById('backdrop');

function toggleAbout(show) {
  if (show) {
    aboutPanel.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when open
  } else {
    aboutPanel.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

if (aboutLink && aboutPanel && backdrop) {
  aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAbout(true);
  });

  backdrop.addEventListener('click', () => {
    toggleAbout(false);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutPanel.classList.contains('active')) {
      toggleAbout(false);
    }
  });
}
