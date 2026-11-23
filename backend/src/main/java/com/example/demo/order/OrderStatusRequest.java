package com.example.demo.order;

import jakarta.validation.constraints.NotNull;

public record OrderStatusRequest(
        @NotNull(message = "El estado es obligatorio")
        OrderStatus status) {
}