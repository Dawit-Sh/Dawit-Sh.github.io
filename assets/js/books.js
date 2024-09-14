async function fetchBooks() {
  try {
    const response = await fetch("books.json");
    const books = await response.json();
    const gallery = document.getElementById("book-gallery");

    books.forEach((book, index) => {
      const bookDiv = document.createElement("div");
      bookDiv.classList.add("book");
      bookDiv.setAttribute("data-category", book.category);
      bookDiv.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;

      bookDiv.innerHTML = `
                    <img src="${book.image}" alt="${book.title}">
                    <div class="book-info">
                        <h2>${book.title}</h2>
                        <p>${book.author}</p>
                    </div>
                `;
      gallery.appendChild(bookDiv);
    });

    updateBookCount("all");
  } catch (error) {
    console.error("Error fetching books:", error);
  }
}

function updateBookCount(filter) {
  const books = document.querySelectorAll(".book");
  let count = 0;

  books.forEach((book) => {
    if (filter === "all" || book.getAttribute("data-category") === filter) {
      count++;
    }
  });

  const bookCountDiv = document.getElementById("book-count");
  bookCountDiv.textContent = `Total Books: ${count}`;
}

window.onload = fetchBooks;

// Filter
document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", function () {
    

    document
      .querySelectorAll(".filter-button")
      .forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");

    const filter = this.getAttribute("data-filter");
    document.querySelectorAll(".book").forEach((book, index) => {
      if (filter === "all" || book.getAttribute("data-category") === filter) {
        book.style.display = "";
        book.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;
      } else {
        book.style.display = "none";
      }
    });

    updateBookCount(filter);
  });
});
