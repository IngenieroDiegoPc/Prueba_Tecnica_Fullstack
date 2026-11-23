package com.example.demo.category;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        CategoryStatus status) {

    public static CategoryResponse from(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getDescription(), c.getStatus());
    }
}