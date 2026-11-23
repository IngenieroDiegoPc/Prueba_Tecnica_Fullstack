package com.example.demo.product;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 150, message = "Máximo 150 caracteres")
        String name,

        @Size(max = 500, message = "Máximo 500 caracteres")
        String description,

        @NotBlank(message = "El código es obligatorio")
        @Size(max = 50, message = "Máximo 50 caracteres")
        String code,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0")
        @Digits(integer = 10, fraction = 2, message = "Precio inválido (máximo 2 decimales)")
        BigDecimal price,

        Boolean available,

        @NotNull(message = "La categoría es obligatoria")
        Long categoryId) {
}