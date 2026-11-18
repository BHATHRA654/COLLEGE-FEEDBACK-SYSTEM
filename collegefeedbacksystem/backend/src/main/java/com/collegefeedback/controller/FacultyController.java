package com.collegefeedback.controller;

import com.collegefeedback.entity.Department;
import com.collegefeedback.entity.Faculty;
import com.collegefeedback.exception.DuplicateResourceException;
import com.collegefeedback.exception.ResourceNotFoundException;
import com.collegefeedback.repository.DepartmentRepository;
import com.collegefeedback.repository.FacultyRepository;
import com.collegefeedback.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.collegefeedback.security.DepartmentSecurityService;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
@Tag(name = "Faculty", description = "Manage faculty members")
public class FacultyController {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final DepartmentSecurityService securityService;

    @GetMapping
    @Operation(summary = "Get all faculty members")
    public ResponseEntity<ApiResponse<List<Faculty>>> getAll() {
        if (securityService.isAdmin()) {
            return ResponseEntity.ok(ApiResponse.<List<Faculty>>builder()
                    .success(true).message("Faculty fetched").data(facultyRepository.findAll()).build());
        }
        Long deptId = securityService.getDepartmentId();
        if (deptId == null) {
            return ResponseEntity.ok(ApiResponse.<List<Faculty>>builder()
                    .success(true).message("Faculty fetched").data(List.of()).build());
        }
        return ResponseEntity.ok(ApiResponse.<List<Faculty>>builder()
                .success(true).message("Faculty fetched").data(facultyRepository.findByDepartmentId(deptId)).build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get faculty by ID")
    public ResponseEntity<ApiResponse<Faculty>> getById(@PathVariable Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + id));
        securityService.verifyDepartmentAccess(faculty.getDepartment());
        return ResponseEntity.ok(ApiResponse.<Faculty>builder()
                .success(true).message("Faculty fetched").data(faculty).build());
    }

    @GetMapping("/department/{departmentId}")
    @Operation(summary = "Get faculty by department")
    public ResponseEntity<ApiResponse<List<Faculty>>> getByDepartment(@PathVariable Long departmentId) {
        securityService.verifyDepartmentAccess(departmentRepository.findById(departmentId).orElse(null));
        return ResponseEntity.ok(ApiResponse.<List<Faculty>>builder()
                .success(true).message("Faculty fetched").data(facultyRepository.findByDepartmentId(departmentId)).build());
    }

    @PostMapping
    @Operation(summary = "Add a new faculty member")
    public ResponseEntity<ApiResponse<Faculty>> create(@RequestBody Faculty faculty) {
        if (facultyRepository.existsByEmail(faculty.getEmail())) {
            throw new DuplicateResourceException("Faculty already exists with email: " + faculty.getEmail());
        }
        
        Department dept;
        if (securityService.isAdmin()) {
            if (faculty.getDepartment() == null || faculty.getDepartment().getId() == null) {
                throw new IllegalArgumentException("Department is required");
            }
            dept = departmentRepository.findById(faculty.getDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        } else {
            Long deptId = securityService.getDepartmentId();
            if (deptId == null) {
                throw new AccessDeniedException("You do not belong to any department.");
            }
            dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        }
        faculty.setDepartment(dept);
        
        Faculty saved = facultyRepository.save(faculty);
        return ResponseEntity.ok(ApiResponse.<Faculty>builder()
                .success(true).message("Faculty created").data(saved).build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a faculty member")
    public ResponseEntity<ApiResponse<Faculty>> update(@PathVariable Long id, @RequestBody Faculty faculty) {
        Faculty existing = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + id));
        
        securityService.verifyDepartmentAccess(existing.getDepartment());
        
        existing.setName(faculty.getName());
        existing.setEmail(faculty.getEmail());
        existing.setDesignation(faculty.getDesignation());
        
        if (securityService.isAdmin()) {
            if (faculty.getDepartment() != null && faculty.getDepartment().getId() != null) {
                Department dept = departmentRepository.findById(faculty.getDepartment().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
                existing.setDepartment(dept);
            }
        }
        
        return ResponseEntity.ok(ApiResponse.<Faculty>builder()
                .success(true).message("Faculty updated").data(facultyRepository.save(existing)).build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a faculty member")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + id));
        securityService.verifyDepartmentAccess(faculty.getDepartment());
        facultyRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true).message("Faculty deleted").build());
    }
}
