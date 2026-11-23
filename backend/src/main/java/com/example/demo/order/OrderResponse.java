package com.example.demo.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        Long customerId,
        String customerName,
        OrderStatus status,
        BigDecimal total,
        String notes,
        LocalDateTime createdAt,
        List<OrderItemResponse> items) {

    public static OrderResponse from(CustomerOrder o) {
        return new OrderResponse(o.getId(), o.getOrderNumber(), o.getCustomer().getId(),
                o.getCustomer().getFullName(), o.getStatus(), o.getTotal(), o.getNotes(),
                o.getCreatedAt(), o.getItems().stream().map(OrderItemResponse::from).toList());
    }
}