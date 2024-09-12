const yearElement = document.getElementById("year");
const aliveTimeElement = document.getElementById("aliveTime");
const copyrightElement = document.getElementById("copyright");
const percentElapsedElement = document.getElementById("percentElapsed");
const birthDate = new Date("2004-05-27");
const lifeExpectancy = 66; // years

function updateYear() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const isBirthday =
    currentDate.getMonth() === 4 && currentDate.getDate() === 27; // May is 4 (0-indexed)

  if (isBirthday) {
    const age = currentYear - birthDate.getFullYear();
    yearElement.textContent = `'${age.toString().slice(-2)}`;
  }
}

function calculateAliveTime() {
  const now = new Date();
  const timeDiff = now - birthDate;

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function calculatePercentElapsed() {
  const now = new Date();
  const timeDiff = now - birthDate;
  const yearsElapsed = timeDiff / (1000 * 60 * 60 * 24 * 365.25);
  const percentElapsed = (yearsElapsed / lifeExpectancy) * 100;
  return percentElapsed.toFixed(6);
}

function updateAliveTime() {
  aliveTimeElement.textContent = calculateAliveTime();
  percentElapsedElement.textContent = `${calculatePercentElapsed()}%`;
}

function updateCopyright() {
  const currentYear = new Date().getFullYear();
  const repoUrl = "https://github.com/Dawit-Sh/Dawit-Sh.github.io";
  copyrightElement.innerHTML = `©${currentYear} Dawit Sharon. <a href="${repoUrl}" target="_blank" style="text-decoration: none; color: inherit;">Code it, remix it, and pass it on!</a>`;
}

// Update year, copyright, and set interval to check daily
updateYear();
updateCopyright();
setInterval(updateYear, 24 * 60 * 60 * 1000);

// Update alive time and percent elapsed every second
setInterval(updateAliveTime, 1000);

// Skills toggle functionality
const skillsToggle = document.getElementById("skills-toggle");
const skillsContainer = document.querySelector(".skills-container");

skillsToggle.addEventListener("click", (e) => {
  e.preventDefault();
  skillsContainer.classList.toggle("show");
});

// Close skills container when clicking outside
document.addEventListener("click", (e) => {
  if (!skillsContainer.contains(e.target) && e.target !== skillsToggle) {
    skillsContainer.classList.remove("show");
  }
});

// Loading animation
window.addEventListener("load", () => {
  const loadingContainer = document.querySelector(".loading-container");
  const loadingText = document.querySelector(".loading-text");
  const text = "UNIX";
  let index = 0;

  function typeText() {
    if (index < text.length) {
      loadingText.textContent += text.charAt(index);
      index++;
      setTimeout(typeText, 200);
    } else {
      setTimeout(() => {
        loadingContainer.style.opacity = "0";
        setTimeout(() => {
          loadingContainer.style.display = "none";
        }, 500);
      }, 1000);
    }
  }

  typeText();
});
