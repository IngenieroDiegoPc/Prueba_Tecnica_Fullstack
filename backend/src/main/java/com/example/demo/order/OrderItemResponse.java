package com.example.demo.order;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        String productName,
        String productCode,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal) {

    public static OrderItemResponse from(OrderItem i) {
        return new OrderItemResponse(i.getProduct().getId(), i.getProduct().getName(),
                i.getProduct().getCode(), i.getQuantity(), i.getUnitPrice(), i.getSubtotal());
    }
}