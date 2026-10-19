
package com.bookstore.controller;

import com.bookstore.service.CartService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/checkout")
@CrossOrigin(origins = "*")
public class CheckoutController {

    private final CartService cartService;

    public CheckoutController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping
    public Map<String, Object> checkout(
            @RequestBody Map<String, String> customer) {

        // Get customer details
        String name = customer.get("name");
        String email = customer.get("email");
        String address = customer.get("address");

        // Validate customer details
        if (name == null || name.isBlank()
                || email == null || email.isBlank()
                || address == null || address.isBlank()) {

            return Map.of(
                    "success", false,
                    "message", "Please enter name, email, and address"
            );
        }

        // Validate email
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return Map.of(
                    "success", false,
                    "message", "Please enter a valid email address"
            );
        }

        // Check cart
        if (cartService.getCart().isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Your cart is empty. Add books before checkout."
            );
        }

        // Calculate total before clearing the cart
        double total = cartService.getTotal();

        // Generate order ID
        String orderId = UUID.randomUUID()
                .toString()
                .substring(0, 8)
                .toUpperCase();

        // Clear cart after successful checkout processing
        cartService.clear();

        // Return order confirmation
        return Map.of(
                "success", true,
                "message", "Order placed successfully!",
                "orderId", orderId,
                "customerName", name.trim(),
                "email", email.trim(),
                "total", total
        );
    }
}
