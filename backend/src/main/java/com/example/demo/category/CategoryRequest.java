package com.example.demo.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "Máximo 100 caracteres")
        String name,

        @Size(max = 255, message = "Máximo 255 caracteres")
        String description,

        CategoryStatus status) {
}