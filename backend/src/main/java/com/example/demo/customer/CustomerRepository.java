package com.example.demo.customer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    @Query("""
            select c from Customer c
            where c.active = true
              and (lower(c.fullName) like lower(concat('%', :search, '%'))
                   or lower(c.email) like lower(concat('%', :search, '%')))
            """)
    Page<Customer> search(@Param("search") String search, Pageable pageable);
}