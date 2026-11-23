package com.example.demo.order;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.common.ConflictException;
import com.example.demo.common.NotFoundException;
import com.example.demo.customer.Customer;
import com.example.demo.customer.CustomerRepository;
import com.example.demo.product.Product;
import com.example.demo.product.ProductRepository;

import jakarta.persistence.criteria.Predicate;

@Service
public class OrderService {

    private final OrderRepository repository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository repository, CustomerRepository customerRepository,
            ProductRepository productRepository) {
        this.repository = repository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> list(String search, OrderStatus status, Long customerId, Pageable pageable) {
        Specification<CustomerOrder> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("orderNumber")), "%" + search.trim().toLowerCase() + "%"));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return repository.findAll(spec, pageable).map(OrderResponse::from);
    }

    @Transactional(readOnly = true)
    public OrderResponse get(Long id) {
        return OrderResponse.from(find(id));
    }

    // Todo ocurre en una sola transacción: si un producto falla, no queda nada guardado.
    @Transactional
    public OrderResponse create(OrderRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .filter(Customer::isActive)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado: " + request.customerId()));

        CustomerOrder order = new CustomerOrder();
        order.setCustomer(customer);
        order.setNotes(request.notes());
        order.setOrderNumber(nextOrderNumber());
        fillItems(order, request.items());
        return OrderResponse.from(repository.save(order));
    }

    // Solo se puede modificar una orden en estado CREATED; el total se recalcula.
    @Transactional
    public OrderResponse update(Long id, OrderRequest request) {
        CustomerOrder order = find(id);
        if (order.getStatus() != OrderStatus.CREATED) {
            throw new ConflictException("Una orden " + order.getStatus() + " ya no se puede modificar");
        }
        if (!order.getCustomer().getId().equals(request.customerId())) {
            throw new ConflictException("No se puede cambiar el cliente de una orden");
        }
        order.setNotes(request.notes());
        order.getItems().clear();
        fillItems(order, request.items());
        return OrderResponse.from(repository.save(order));
    }

    // Ciclo de vida: CREATED -> PAID o CANCELLED. Los estados finales no cambian.
    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus newStatus) {
        CustomerOrder order = find(id);
        if (order.getStatus() != OrderStatus.CREATED) {
            throw new ConflictException("Una orden " + order.getStatus() + " ya no puede cambiar de estado");
        }
        if (newStatus == OrderStatus.CREATED) {
            throw new ConflictException("La orden ya está en estado CREATED");
        }
        order.setStatus(newStatus);
        return OrderResponse.from(repository.save(order));
    }

    // "Eliminar" una orden la cancela; nunca se borra para conservar el historial.
    @Transactional
    public void cancel(Long id) {
        updateStatus(id, OrderStatus.CANCELLED);
    }

    private CustomerOrder find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Orden no encontrada: " + id));
    }

    private void fillItems(CustomerOrder order, List<OrderItemRequest> requested) {
        // Si un producto llega repetido, se suman las cantidades.
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (OrderItemRequest r : requested) {
            quantities.merge(r.productId(), r.quantity(), Integer::sum);
        }

        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            Product product = productRepository.findById(entry.getKey())
                    .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + entry.getKey()));
            if (!product.isAvailable()) {
                throw new ConflictException("El producto " + product.getCode() + " no está disponible");
            }
            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(entry.getValue()));

            OrderItem item = new OrderItem();
            item.setProduct(product);
            item.setQuantity(entry.getValue());
            item.setUnitPrice(product.getPrice()); // precio congelado al momento de la compra
            item.setSubtotal(subtotal);
            order.addItem(item);
            total = total.add(subtotal);
        }
        order.setTotal(total);
    }

    private String nextOrderNumber() {
        LocalDate today = LocalDate.now();
        long count = repository.countByCreatedAtBetween(today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        return "ORD-" + today.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + String.format("%04d", count + 1);
    }
}