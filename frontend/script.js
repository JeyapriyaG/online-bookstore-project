
const API_BASE_URL = "http://localhost:8080";

// API endpoints from your Spring Boot controllers
const BOOKS_ENDPOINT = "/books";
const CART_ENDPOINT = "/cart";

// HTML elements
const bookList = document.getElementById("bookList");
const statusBox = document.getElementById("status");
const cartItemsElement = document.getElementById("cartItems");
const cartCountElement = document.getElementById("cartCount");
const cartTotalElement = document.getElementById("cartTotal");

// Safely display text from the backend
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Send an HTTP request to Spring Boot
async function apiRequest(endpoint, options = {}) {
    const response = await fetch(API_BASE_URL + endpoint, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    });

    const text = await response.text();

    let result = null;

    if (text.trim()) {
        try {
            result = JSON.parse(text);
        } catch {
            result = text;
        }
    }

    if (!response.ok) {
        const message =
            typeof result === "object" && result !== null
                ? result.message || result.error
                : result;

        throw new Error(message || `HTTP error ${response.status}`);
    }

    return result;
}

// Load and display all books
async function loadBooks() {
    statusBox.textContent = "Loading books...";
    bookList.innerHTML = "";

    try {
        const result = await apiRequest(BOOKS_ENDPOINT);

        const books = Array.isArray(result)
            ? result
            : result?.content || result?.books || [];

        if (!Array.isArray(books) || books.length === 0) {
            statusBox.textContent =
                "No books found. Check your backend and MySQL book table.";
            return;
        }

        bookList.innerHTML = books.map(book => {
            const id = Number(book.id);
            const title = escapeHTML(book.title || "Untitled Book");
            const author = escapeHTML(book.author || "Unknown Author");
            const price = Number(book.price);
            const image = escapeHTML(book.image || "");

            if (!Number.isFinite(id)) {
                return "";
            }

            return `
                <article class="book-card">
                    <img
                        class="book-cover"
                        src="${image || "https://placehold.co/140x190?text=No+Cover"}"
                        alt="${title}"
                        onerror="this.onerror=null;this.src='https://placehold.co/140x190?text=No+Cover';"
                    >

                    <h3 class="book-title">${title}</h3>

                    <p class="book-author">
                        By ${author}
                    </p>

                    <p class="book-price">
                        ${Number.isFinite(price)
                            ? "₹" + price.toFixed(2)
                            : "Price unavailable"}
                    </p>

                    <button
                        type="button"
                        class="add-button"
                        onclick="addToCart(${id})">
                        Add to Cart
                    </button>
                </article>
            `;
        }).join("");

        statusBox.textContent = `Loaded ${books.length} books successfully.`;

    } catch (error) {
        statusBox.textContent =
            "Could not load books: " + error.message;

        console.error("Load books error:", error);
    }
}

// Add a book to the cart
// Your CartController uses @PostMapping on /cart
// and expects a JSON object containing bookId.
async function addToCart(bookId) {
    try {
        await apiRequest(CART_ENDPOINT, {
            method: "POST",
            body: JSON.stringify({
                bookId: Number(bookId)
            })
        });

        alert("Book added to cart successfully!");

        await loadCart();

    } catch (error) {
        console.error("Add to cart error:", error);

        alert(
            "Could not add the book.\n\n" +
            error.message +
            "\n\nCheck that Spring Boot is running on port 8080."
        );
    }
}

// Load the cart from the backend
// Your CartController returns { items: [...], total: ... }
async function loadCart() {
    cartItemsElement.textContent = "Loading cart...";

    try {
        const cart = await apiRequest(CART_ENDPOINT);
        const items = Array.isArray(cart?.items) ? cart.items : [];

        // Update item count
        const count = items.reduce((sum, item) => {
            return sum + Number(item.quantity ?? 1);
        }, 0);

        cartCountElement.textContent = count;

        // Display cart contents
        if (items.length === 0) {
            cartItemsElement.textContent = "Your cart is empty.";
        } else {
            cartItemsElement.innerHTML = items.map(item => {
                const book = item.book || item;

                const title = escapeHTML(
                    book.title || item.title || "Book"
                );

                const quantity = Number(item.quantity ?? 1);
                const price = Number(book.price ?? item.price ?? 0);

                return `
                    <div class="cart-row">
                        <h3>${title}</h3>
                        <p>Quantity: ${quantity}</p>
                        <p>Price: ₹${(price * quantity).toFixed(2)}</p>
                    </div>
                `;
            }).join("");
        }

        // Display total calculated by CartService
        if (cartTotalElement) {
            cartTotalElement.textContent =
                "₹" + Number(cart?.total ?? 0).toFixed(2);
        }

    } catch (error) {
        cartItemsElement.textContent =
            "Could not load cart: " + error.message;

        console.error("Load cart error:", error);
    }
}

// View cart button
document.getElementById("cartButton").addEventListener("click", () => {
    document.getElementById("cartSection").scrollIntoView({
        behavior: "smooth"
    });

    loadCart();
});

// Refresh cart button
document
    .getElementById("refreshCartButton")
    .addEventListener("click", loadCart);

// Initialize page
loadBooks();
loadCart();
