package com.example.demo.customer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.common.ConflictException;
import com.example.demo.common.NotFoundException;

@Service
public class CustomerService {

    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> list(String search, Pageable pageable) {
        return repository.search(search.trim(), pageable).map(CustomerResponse::from);
    }

    @Transactional(readOnly = true)
    public CustomerResponse get(Long id) {
        return CustomerResponse.from(findActive(id));
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        if (repository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("Ya existe un cliente con ese correo");
        }
        Customer customer = new Customer();
        apply(customer, request);
        return CustomerResponse.from(repository.save(customer));
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = findActive(id);
        if (repository.existsByEmailIgnoreCaseAndIdNot(request.email(), id)) {
            throw new ConflictException("Ya existe otro cliente con ese correo");
        }
        apply(customer, request);
        return CustomerResponse.from(repository.save(customer));
    }

    // Soft delete: el cliente queda inactivo para conservar sus órdenes
    @Transactional
    public void delete(Long id) {
        Customer customer = findActive(id);
        customer.setActive(false);
        repository.save(customer);
    }

    private Customer findActive(Long id) {
        return repository.findById(id)
                .filter(Customer::isActive)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado: " + id));
    }

    private void apply(Customer customer, CustomerRequest request) {
        customer.setFullName(request.fullName().trim());
        customer.setEmail(request.email().trim().toLowerCase());
        customer.setPhone(request.phone());
    }
}