
const API = "http://localhost:8080";

// BookNest application
document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    loadCart();
    setupSearch();
    setupTheme();
    setupCheckout();
});

// Convert database image paths to usable frontend paths
function getImagePath(book) {
    if (!book.image || book.image.trim() === "") {
        return "images/book-placeholder.jpg";
    }

    // Keep external image URLs working
    if (/^https?:\/\//i.test(book.image)) {
        return book.image;
    }

    // Local images are stored inside frontend/images/
    const filename = book.image.replace(/^images\//, "");
    return `images/${filename}`;
}

// Load books from Spring Boot
async function loadBooks() {
    const bookGrid = document.getElementById("bookGrid");

    if (!bookGrid) return;

    bookGrid.innerHTML = "<p>Loading books...</p>";

    try {
        const response = await fetch(`${API}/books`);

        if (!response.ok) {
            throw new Error("Could not load books");
        }

        const books = await response.json();

        displayBooks(books);
    } catch (error) {
        console.error("Error loading books:", error);

        bookGrid.innerHTML = `
            <p>Unable to load books.
            Please make sure the Spring Boot backend is running.</p>
        `;
    }
}

// Display book cards
function displayBooks(books) {
    const bookGrid = document.getElementById("bookGrid");

    if (!bookGrid) return;

    if (!books || books.length === 0) {
        bookGrid.innerHTML = "<p>No books found.</p>";
        return;
    }

    bookGrid.innerHTML = books.map(book => {
        const imagePath = getImagePath(book);
        const title = escapeHTML(book.title || "Untitled");
        const author = escapeHTML(book.author || "Unknown author");
        const price = Number(book.price) || 0;

        return `
            <div class="book-card">
                <img
                    class="book-cover"
                    src="${escapeHTML(imagePath)}"
                    alt="${title}"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='images/book-placeholder.jpg';"
                >

                <div class="book-info">
                    <h3>${title}</h3>
                    <p class="book-author">By ${author}</p>
                    <p class="book-price">₹${price.toFixed(2)}</p>

                    <button
                        class="add-to-cart-btn"
                        data-book-id="${Number(book.id)}"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }).join("");

    // Attach Add to Cart handlers
    bookGrid.querySelectorAll(".add-to-cart-btn").forEach(button => {
        button.addEventListener("click", () => {
            const bookId = Number(button.dataset.bookId);
            addToCart(bookId);
        });
    });
}

// Prevent database text from being interpreted as HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Search books by title or author
function setupSearch() {
    const searchInput = document.getElementById("searchInput");

    if (!searchInput) return;

    searchInput.addEventListener("input", async () => {
        const query = searchInput.value.trim().toLowerCase();

        try {
            const response = await fetch(`${API}/books`);

            if (!response.ok) {
                throw new Error("Could not search books");
            }

            const books = await response.json();

            const filteredBooks = books.filter(book =>
                (book.title || "").toLowerCase().includes(query) ||
                (book.author || "").toLowerCase().includes(query)
            );

            displayBooks(filteredBooks);
        } catch (error) {
            console.error("Search error:", error);
        }
    });
}

// Add a book to cart
async function addToCart(bookId) {
    try {
        const response = await fetch(`${API}/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ bookId })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not add book");
        }

        alert(result.message || "Book added to cart!");
        await loadCart();
    } catch (error) {
        console.error("Add to cart error:", error);
        alert("Unable to add the book. Please check the backend.");
    }
}

// Load cart items
async function loadCart() {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    try {
        const response = await fetch(`${API}/cart`);

        if (!response.ok) {
            throw new Error("Could not load cart");
        }

        const cart = await response.json();
        const items = cart.items || [];

        if (cartItems) {
            if (items.length === 0) {
                cartItems.innerHTML = "<p>Your cart is empty.</p>";
            } else {
                cartItems.innerHTML = items.map(item => {
                    const book = item.book || {};
                    const title = escapeHTML(book.title || "Book");
                    const quantity = Number(item.quantity) || 1;
                    const price = Number(book.price) || 0;

                    return `
                        <div class="cart-item">
                            <div>
                                <h4>${title}</h4>
                                <p>₹${price.toFixed(2)} × ${quantity}</p>
                            </div>

                            <button
                                class="remove-cart-btn"
                                data-item-id="${Number(item.id)}"
                            >
                                Remove
                            </button>
                        </div>
                    `;
                }).join("");

                cartItems.querySelectorAll(".remove-cart-btn")
                    .forEach(button => {
                        button.addEventListener("click", () => {
                            removeFromCart(Number(button.dataset.itemId));
                        });
                    });
            }
        }

        if (cartTotal) {
            cartTotal.textContent =
                `₹${(Number(cart.total) || 0).toFixed(2)}`;
        }

        const cartCount = document.getElementById("cartCount");

        if (cartCount) {
            cartCount.textContent = items.reduce(
                (sum, item) => sum + (Number(item.quantity) || 1),
                0
            );
        }
    } catch (error) {
        console.error("Load cart error:", error);

        if (cartItems) {
            cartItems.innerHTML = "<p>Unable to load your cart.</p>";
        }
    }
}

// Remove an item from cart
async function removeFromCart(itemId) {
    try {
        const response = await fetch(`${API}/cart/${itemId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Could not remove item");
        }

        await loadCart();
    } catch (error) {
        console.error("Remove cart error:", error);
        alert("Unable to remove this item.");
    }
}

// Checkout form
function setupCheckout() {
    const checkoutBtn = document.getElementById("checkoutBtn");

    if (!checkoutBtn) return;

    checkoutBtn.addEventListener("click", async () => {
        const name = prompt("Enter your full name:");
        if (!name || !name.trim()) return;

        const email = prompt("Enter your email address:");
        if (!email || !email.trim()) return;

        const address = prompt("Enter your delivery address:");
        if (!address || !address.trim()) return;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            alert("Please enter a valid email address.");
            return;
        }

        checkoutBtn.disabled = true;

        try {
            const response = await fetch(`${API}/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    address: address.trim()
                })
            });

            const result = await response.json();

            if (!response.ok || result.success === false) {
                throw new Error(result.message || "Checkout failed");
            }

            alert(
                `${result.message}\n` +
                `Order ID: ${result.orderId}\n` +
                `Total: ₹${Number(result.total).toFixed(2)}`
            );

            await loadCart();
        } catch (error) {
            console.error("Checkout error:", error);
            alert(error.message || "Unable to complete checkout.");
        } finally {
            checkoutBtn.disabled = false;
        }
    });
}

// Dark mode toggle
function setupTheme() {
    const themeToggle = document.getElementById("themeToggle");

    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
    });
}
