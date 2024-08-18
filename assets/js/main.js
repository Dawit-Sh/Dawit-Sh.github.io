const telegramBtn = document.getElementById("telegram-btn");
const githubBtn = document.getElementById("github-btn");
const linkedinBtn = document.getElementById("linkedin-btn");
const blogBtn = document.getElementById("blog-btn");
const bookshelfBtn = document.getElementById("bookshelf-btn");

const project1Btn = document.getElementById("project1-btn");
const project2Btn = document.getElementById("project2-btn");

const telegramPopup = document.getElementById("telegram-popup");
const githubPopup = document.getElementById("github-popup");
const linkedinPopup = document.getElementById("linkedin-popup");
const blogPopup = document.getElementById("blog-popup");
const bookshelfPopup = document.getElementById("bookshelf-popup");

const project1Popup = document.getElementById("project1-popup");
const project2Popup = document.getElementById("project2-popup");

const overlay = document.querySelector(".overlay");
const popupCloseBtns = document.querySelectorAll(".popup-close");

telegramBtn.addEventListener("click", () => openPopup(telegramPopup));
githubBtn.addEventListener("click", () => openPopup(githubPopup));
linkedinBtn.addEventListener("click", () => openPopup(linkedinPopup));
blogBtn.addEventListener("click", () => openPopup(blogPopup));
bookshelfBtn.addEventListener("click", () => openPopup(bookshelfPopup));

project1Btn.addEventListener("click", () => openPopup(project1Popup));
project2Btn.addEventListener("click", () => openPopup(project2Popup));

overlay.addEventListener("click", closeAllPopups);

popupCloseBtns.forEach((btn) => {
  btn.addEventListener("click", closeAllPopups);
});

function openPopup(popup) {
  popup.classList.add("active");
  overlay.classList.add("active");
}

function closeAllPopups() {
  document
    .querySelectorAll(".popup")
    .forEach((popup) => popup.classList.remove("active"));
  overlay.classList.remove("active");
}
