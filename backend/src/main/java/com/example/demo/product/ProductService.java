package com.example.demo.product;

import java.util.ArrayList;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.category.Category;
import com.example.demo.category.CategoryRepository;
import com.example.demo.category.CategoryStatus;
import com.example.demo.common.ConflictException;
import com.example.demo.common.NotFoundException;

import jakarta.persistence.criteria.Predicate;

@Service
public class ProductService {

    private final ProductRepository repository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository repository, CategoryRepository categoryRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> list(String search, Long categoryId, Boolean available, Pageable pageable) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("code")), like)));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (available != null) {
                predicates.add(cb.equal(root.get("available"), available));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return repository.findAll(spec, pageable).map(ProductResponse::from);
    }

    @Transactional(readOnly = true)
    public ProductResponse get(Long id) {
        return ProductResponse.from(find(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        if (repository.existsByCodeIgnoreCase(request.code().trim())) {
            throw new ConflictException("Ya existe un producto con ese código");
        }
        Product product = new Product();
        apply(product, request);
        return ProductResponse.from(repository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = find(id);
        if (repository.existsByCodeIgnoreCaseAndIdNot(request.code().trim(), id)) {
            throw new ConflictException("Ya existe otro producto con ese código");
        }
        apply(product, request);
        return ProductResponse.from(repository.save(product));
    }

    // Un producto con órdenes asociadas no se puede borrar: se marca como no disponible.
    @Transactional
    public void delete(Long id) {
        Product product = find(id);
        try {
            repository.delete(product);
            repository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException(
                    "El producto tiene órdenes asociadas; márcalo como no disponible en lugar de eliminarlo");
        }
    }

    private Product find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + id));
    }

    private void apply(Product product, ProductRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new NotFoundException("Categoría no encontrada: " + request.categoryId()));
        if (category.getStatus() == CategoryStatus.INACTIVE) {
            throw new ConflictException("La categoría está inactiva");
        }
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setCode(request.code().trim());
        product.setPrice(request.price());
        product.setAvailable(request.available() == null || request.available());
        product.setCategory(category);
    }
}