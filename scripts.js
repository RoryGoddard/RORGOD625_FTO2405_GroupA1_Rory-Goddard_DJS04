/**
 * @ts-check
 */

import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

let page = 1;
let matches = books;

//Call helper functions within


/**
 * Initialises the web page by calling helper functions within to set up fields, books, colour scheme, and event listeners
 */
function init() {
  //Generate book button previews
  generateBookPreviews()

  //Generate author field names
  generateOptionsFieldNames("[data-search-authors]", authors, "All Authors");

  //Generate genre field names
  generateOptionsFieldNames("[data-search-genres]", genres, "All Genres");

  //Check user preference and set light/dark mode with function call
  const prefersDarkScheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setLightOrDarkMode(prefersDarkScheme ? "night" : "day");

  //Setup all event listeners on page
  setupEventListeners()

  //Setup "Show more" button on page load to reflect number of books remaining dynamically
  const showMoreButton = document.querySelector("[data-list-button]");
  const remaining = books.length - BOOKS_PER_PAGE;
  showMoreButton.innerHTML = `
    <span>Show more</span>
    <span class="list__remaining"> (${remaining > 0 ? remaining : 0})</span>
  `;
  showMoreButton.disabled = remaining <= 0;
}

init()

/**
 * Sets up event listeners for all interactive elements on the page such as user settings, search filters, and book elements
 */
function setupEventListeners() {
  document.querySelector("[data-search-cancel]").addEventListener("click", () => {
    document.querySelector("[data-search-overlay]").open = false;
  });

  document.querySelector("[data-settings-cancel]").addEventListener("click", () => {
    document.querySelector("[data-settings-overlay]").open = false;
  });

  document.querySelector("[data-header-search]").addEventListener("click", () => {
    document.querySelector("[data-search-overlay]").open = true;
    document.querySelector("[data-search-title]").focus();
  });

  document.querySelector("[data-header-settings]").addEventListener("click", () => {
    document.querySelector("[data-settings-overlay]").open = true;
  });

  document.querySelector("[data-list-close]").addEventListener("click", () => {
    document.querySelector("[data-list-active]").open = false;
  });

  document.querySelector("[data-settings-form]").addEventListener("submit", (event) => {
    event.preventDefault();

    //Grab form data
    const formData = new FormData(event.target);

    //Create theme object from form data
    const { theme } = Object.fromEntries(formData);

    //Call helper function to set light or dark mode based on theme object
    setLightOrDarkMode(theme);

    //Close settings modal window
    document.querySelector("[data-settings-overlay]").open = false;
  });

  document.querySelector("[data-search-form]").addEventListener("submit", (event) => {
    event.preventDefault();

    //Grab form data from search fields
    const formData = new FormData(event.target);

    //Create filters object based on form data from search fields
    const filters = Object.fromEntries(formData);

    //Call helper function to filter books based on above filters from form
    matches = filterBooks(filters);
    page = 1;
    
    //Handle cases where there are no search results, displays message informing user there are no results and filters may be too narrow
    if (matches.length === 0) {
      document.querySelector("[data-list-message]").classList.add("list__message_show");
    } else {
      document.querySelector("[data-list-message]").classList.remove("list__message_show");
    }

    //Call helper function to display results, passing in filtered books
    displayBookSearchResults(matches)

    //Scroll to the top of the page on search and close the data search overlay
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector("[data-search-overlay]").open = false;
  });

  //Show more books when button clicked
  document.querySelector("[data-list-button]").addEventListener("click", () => {
    //Create fragment and iterate through next portion of books, adding them to fragment
    const fragment = document.createDocumentFragment();
    for (const book of matches.slice(page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE)) {
      fragment.appendChild(createBookPreviewButton(book));
    }

    //Append fragment with next page of books to the DOM, increment page by 1
    document.querySelector("[data-list-items]").appendChild(fragment);
    page += 1;

    // Update "Show more" button
    const remaining = matches.length - page * BOOKS_PER_PAGE;
    const showMoreButton = document.querySelector("[data-list-button]");
    showMoreButton.disabled = remaining <= 0;
    showMoreButton.innerHTML = `
      <span>Show more</span>
      <span class="list__remaining"> (${remaining > 0 ? remaining : 0})</span>
    `;  
  });

  // Event listener that opens book previews on book preview button click, displaying that books data
  document.querySelector("[data-list-items]").addEventListener("click", (event) => {
    const button = event.target.closest("[data-preview]");
    if (button) {
      displayBookDetails(button.getAttribute("data-preview"));
    }
  });
}

/**
 * 
 * @param {string} selector The field to generate the options for
 * @param {object} options The options to populate the selector with
 * @param {string} defaultOption Optional argument that defines a default or placeholder option for the dropdown menu
 * 
 * Creates option fields for dropdown menus based on arguments passed in
 */
function generateOptionsFieldNames(selector, options, defaultOption) {
  const fragment = document.createDocumentFragment();
  const firstElement = document.createElement("option");
  firstElement.value = "any";
  firstElement.innerText = defaultOption;
  fragment.appendChild(firstElement);

  for (const [id, name] of Object.entries(options)) {
    const optionElement = document.createElement("option");
    optionElement.value = id;
    optionElement.innerText = name;
    fragment.appendChild(optionElement);
  }

  document.querySelector(selector).appendChild(fragment);
}

/**
 * Generate book previews on initialisation based on book data within data.js
 */
function generateBookPreviews() {
  const fragment = document.createDocumentFragment();
  for (const book of matches.slice(0, BOOKS_PER_PAGE)) {
    fragment.appendChild(createBookPreviewButton(book));
  }
  document.querySelector("[data-list-items]").appendChild(fragment);
}

/**
 * 
 * @param {string} bookId Book ID references book details in data.js
 * Display book details depending on corresponding ID
 * 
 */
function displayBookDetails(bookId) {
  const book = books.find(b => b.id === bookId);

  if (book) {
    document.querySelector("[data-list-active]").open = true;
    document.querySelector("[data-list-blur]").src = book.image;
    document.querySelector("[data-list-image]").src = book.image;
    document.querySelector("[data-list-title]").innerText = book.title;
    document.querySelector("[data-list-subtitle]").innerText = `${authors[book.author]} (${new Date(book.published).getFullYear()})`;
    document.querySelector("[data-list-description]").innerText = book.description;
  }
}

//This is an abstraction whereby this function can be called to handle when results need to be displayed when a user searches for specific books
/**
 * 
 * @param {object} results Object of books that match the filtered search 
 * 
 * Displays search results of searches for books based on filters
 */
function displayBookSearchResults(results) {
  const listItems = document.querySelector("[data-list-items]");
  listItems.innerHTML = ""; //Clearing the innerhtml in order to display the books from the search within

  //Create fragment to hold the resulting books within
  const fragment = document.createDocumentFragment();
  for (const book of results.slice(0, BOOKS_PER_PAGE)) {
    fragment.appendChild(createBookPreviewButton(book));
  }

  //Append the resulting books fragment to the previously cleared list
  listItems.appendChild(fragment);

  //Modify button according to the amount of remaining books - ie disable it if the results are less than one page
  // Update "Show more" button
  const remaining = results.length - BOOKS_PER_PAGE;
  const showMoreButton = document.querySelector("[data-list-button]");
  showMoreButton.disabled = remaining <= 0;
  showMoreButton.innerHTML = `
    <span>Show more</span>
    <span class="list__remaining"> (${remaining > 0 ? remaining : 0})</span>
  `;
}

//Helper function to filter books based on search criteria, returns an array of filtered books by genre title and author
/**
 * 
 * @param {string} genre Chosen genre to filter books by
 * @param {string} title Chosen keywords to filter books by
 * @param {string} author Chosen author to filter books by
 * 
 * @returns filtered books array based on the filter arguments that were passed in 
 */
function filterBooks({genre, title, author}) {
  return books.filter(book => {
    const genreMatch = genre === "any" || book.genres.includes(genre);
    const titleMatch = !title.trim() || book.title.toLowerCase().includes(title.toLowerCase());
    const authorMatch = author === "any" || book.author === author;
    
    return genreMatch && titleMatch && authorMatch;
  });
}

//Helper function to create button previews on the individual books
/**
 * 
 * @param {string} author Author name from destructured book object
 * @param {string} id Book id as per data.js
 * @param {string} image Book image path from destructured book object
 * @param {string} title Book title from destructured book object
 * 
 * @returns Book preview html button element
 */
function createBookPreviewButton({ author, id, image, title }) {
  const element = document.createElement("button");
  element.classList = "preview";
  element.setAttribute("data-preview", id);
  element.innerHTML = `
    <img class="preview__image" src="${image}" />
    <div class="preview__info">
      <h3 class="preview__title">${title}</h3>
      <div class="preview__author">${authors[author]}</div>
    </div>
  `;
  return element;
}

/**
 * 
 * @param {string} theme Theme string to be passed in to determine the theme of the application
 * 
 * function abstraction that changes the theme of the application
 */
function setLightOrDarkMode(theme) {
  console.log(typeof(theme))
  const colorConfig = theme === "night" 
    ? { dark: "255, 255, 255", light: "10, 10, 20" }
    : { dark: "10, 10, 20", light: "255, 255, 255" };

  document.documentElement.style.setProperty("--color-dark", colorConfig.dark);
  document.documentElement.style.setProperty("--color-light", colorConfig.light);
  document.querySelector("[data-settings-theme]").value = theme;
}
