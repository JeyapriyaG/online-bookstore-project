package com.bookstore.controller;

import com.bookstore.model.Book;
import com.bookstore.service.BookService;
import com.bookstore.service.CartService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private final CartService cartService;
    private final BookService bookService;

    public CartController(CartService cartService, BookService bookService) {
        this.cartService = cartService;
        this.bookService = bookService;
    }

    @GetMapping
    public Map<String, Object> getCart() {
        return Map.of(
                "items", cartService.getCart(),
                "total", cartService.getTotal()
        );
    }

    @PostMapping
    public Map<String, String> addToCart(@RequestBody Map<String, Long> request) {

        Book book = bookService.getBookById(request.get("bookId"));

        if (book == null) {
            throw new IllegalArgumentException("Book not found");
        }

        cartService.addToCart(book);

        return Map.of("message", "Book added to cart");
    }

    @DeleteMapping("/{id}")
    public Map<String, String> remove(@PathVariable Long id) {

        cartService.removeFromCart(id);

        return Map.of("message", "Item removed");
    }
}