package com.collegefeedback.controller;

import com.collegefeedback.entity.Department;
import com.collegefeedback.exception.DuplicateResourceException;
import com.collegefeedback.exception.ResourceNotFoundException;
import com.collegefeedback.repository.DepartmentRepository;
import com.collegefeedback.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@Tag(name = "Departments", description = "Manage college departments")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    @GetMapping
    @Operation(summary = "Get all departments")
    public ResponseEntity<ApiResponse<List<Department>>> getAll() {
        return ResponseEntity.ok(ApiResponse.<List<Department>>builder()
                .success(true).message("Departments fetched").data(departmentRepository.findAll()).build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get department by ID")
    public ResponseEntity<ApiResponse<Department>> getById(@PathVariable Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        return ResponseEntity.ok(ApiResponse.<Department>builder()
                .success(true).message("Department fetched").data(dept).build());
    }

    @PostMapping
    @Operation(summary = "Create a new department")
    public ResponseEntity<ApiResponse<Department>> create(@RequestBody Department department) {
        if (departmentRepository.existsByDepartmentName(department.getDepartmentName())) {
            throw new DuplicateResourceException("Department already exists: " + department.getDepartmentName());
        }
        Department saved = departmentRepository.save(department);
        return ResponseEntity.ok(ApiResponse.<Department>builder()
                .success(true).message("Department created").data(saved).build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a department")
    public ResponseEntity<ApiResponse<Department>> update(@PathVariable Long id, @RequestBody Department department) {
        Department existing = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        existing.setDepartmentName(department.getDepartmentName());
        return ResponseEntity.ok(ApiResponse.<Department>builder()
                .success(true).message("Department updated").data(departmentRepository.save(existing)).build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a department")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        departmentRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true).message("Department deleted").build());
    }
}
