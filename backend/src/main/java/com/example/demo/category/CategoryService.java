package com.example.demo.category;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.common.ConflictException;
import com.example.demo.common.NotFoundException;

@Service
public class CategoryService {

    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> list(String search, CategoryStatus status, Pageable pageable) {
        String term = search.trim();
        Page<Category> page = (status == null)
                ? repository.findByNameContainingIgnoreCase(term, pageable)
                : repository.findByNameContainingIgnoreCaseAndStatus(term, status, pageable);
        return page.map(CategoryResponse::from);
    }

    @Transactional(readOnly = true)
    public CategoryResponse get(Long id) {
        return CategoryResponse.from(find(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (repository.existsByNameIgnoreCase(request.name().trim())) {
            throw new ConflictException("Ya existe una categoría con ese nombre");
        }
        Category category = new Category();
        apply(category, request);
        return CategoryResponse.from(repository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = find(id);
        if (repository.existsByNameIgnoreCaseAndIdNot(request.name().trim(), id)) {
            throw new ConflictException("Ya existe otra categoría con ese nombre");
        }
        apply(category, request);
        return CategoryResponse.from(repository.save(category));
    }

    // Eliminar = desactivar. La regla "no desactivar si tiene productos" se agrega con Product.
    @Transactional
    public void delete(Long id) {
        Category category = find(id);
        category.setStatus(CategoryStatus.INACTIVE);
        repository.save(category);
    }

    private Category find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Categoría no encontrada: " + id));
    }

    private void apply(Category category, CategoryRequest request) {
        category.setName(request.name().trim());
        category.setDescription(request.description());
        category.setStatus(request.status() != null ? request.status() : CategoryStatus.ACTIVE);
    }
}