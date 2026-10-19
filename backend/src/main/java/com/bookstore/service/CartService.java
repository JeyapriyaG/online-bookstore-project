package com.bookstore.service;

import com.bookstore.model.Book;
import com.bookstore.model.CartItem;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class CartService {
    private final List<CartItem> cart = new ArrayList<>();
    private long nextId = 1;

    public List<CartItem> getCart() {
        return cart;
    }

    public void addToCart(Book book) {
        for (CartItem item : cart) {
            if (item.getBook().getId().equals(book.getId())) {
                item.setQuantity(item.getQuantity() + 1);
                return;
            }
        }
        cart.add(new CartItem(nextId++, book, 1));
    }

    public boolean removeFromCart(Long id) {
        return cart.removeIf(item -> item.getId().equals(id));
    }

    public double getTotal() {
        return cart.stream()
                .mapToDouble(item -> item.getBook().getPrice() * item.getQuantity())
                .sum();
    }

    public void clear() {
        cart.clear();
    }
}
