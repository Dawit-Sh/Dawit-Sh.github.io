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
