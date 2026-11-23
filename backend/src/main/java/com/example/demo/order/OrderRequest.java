package com.example.demo.order;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OrderRequest(
        @NotNull(message = "El cliente es obligatorio")
        Long customerId,

        @Size(max = 500, message = "Máximo 500 caracteres")
        String notes,

        @NotEmpty(message = "La orden debe tener al menos un producto")
        @Valid
        List<OrderItemRequest> items) {
}