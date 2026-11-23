package com.example.demo.product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String name,
        String description,
        String code,
        BigDecimal price,
        boolean available,
        Long categoryId,
        String categoryName,
        LocalDateTime createdAt) {

    public static ProductResponse from(Product p) {
        return new ProductResponse(p.getId(), p.getName(), p.getDescription(), p.getCode(),
                p.getPrice(), p.isAvailable(), p.getCategory().getId(),
                p.getCategory().getName(), p.getCreatedAt());
    }
}