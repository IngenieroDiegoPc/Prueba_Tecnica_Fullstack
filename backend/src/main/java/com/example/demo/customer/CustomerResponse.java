package com.example.demo.customer;

import java.time.LocalDateTime;

public record CustomerResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        boolean active,
        LocalDateTime createdAt) {

    public static CustomerResponse from(Customer c) {
        return new CustomerResponse(c.getId(), c.getFullName(), c.getEmail(),
                c.getPhone(), c.isActive(), c.getCreatedAt());
    }
}