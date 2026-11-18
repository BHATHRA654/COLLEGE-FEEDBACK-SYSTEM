package com.collegefeedback.controller;

import com.collegefeedback.entity.Department;
import com.collegefeedback.entity.Student;
import com.collegefeedback.exception.DuplicateResourceException;
import com.collegefeedback.exception.ResourceNotFoundException;
import com.collegefeedback.repository.DepartmentRepository;
import com.collegefeedback.repository.StudentRepository;
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
@RequestMapping("/api/students")
@RequiredArgsConstructor
@Tag(name = "Students", description = "Manage student records")
public class StudentController {

    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final DepartmentSecurityService securityService;

    @GetMapping
    @Operation(summary = "Get all students")
    public ResponseEntity<ApiResponse<List<Student>>> getAll() {
        if (securityService.isAdmin()) {
            return ResponseEntity.ok(ApiResponse.<List<Student>>builder()
                    .success(true).message("Students fetched").data(studentRepository.findAll()).build());
        }
        Long deptId = securityService.getDepartmentId();
        if (deptId == null) {
            return ResponseEntity.ok(ApiResponse.<List<Student>>builder()
                    .success(true).message("Students fetched").data(List.of()).build());
        }
        return ResponseEntity.ok(ApiResponse.<List<Student>>builder()
                .success(true).message("Students fetched").data(studentRepository.findByDepartmentId(deptId)).build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get student by ID")
    public ResponseEntity<ApiResponse<Student>> getById(@PathVariable Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        securityService.verifyDepartmentAccess(student.getDepartment());
        return ResponseEntity.ok(ApiResponse.<Student>builder()
                .success(true).message("Student fetched").data(student).build());
    }

    @GetMapping("/department/{departmentId}")
    @Operation(summary = "Get students by department")
    public ResponseEntity<ApiResponse<List<Student>>> getByDepartment(@PathVariable Long departmentId) {
        securityService.verifyDepartmentAccess(departmentRepository.findById(departmentId).orElse(null));
        return ResponseEntity.ok(ApiResponse.<List<Student>>builder()
                .success(true).message("Students fetched").data(studentRepository.findByDepartmentId(departmentId)).build());
    }

    @PostMapping
    @Operation(summary = "Register a new student")
    public ResponseEntity<ApiResponse<Student>> create(@RequestBody Student student) {
        if (studentRepository.existsByEmail(student.getEmail())) {
            throw new DuplicateResourceException("Student already exists with email: " + student.getEmail());
        }
        if (studentRepository.existsByRegisterNumber(student.getRegisterNumber())) {
            throw new DuplicateResourceException("Register number already exists: " + student.getRegisterNumber());
        }
        
        Department dept;
        if (securityService.isAdmin()) {
            if (student.getDepartment() == null || student.getDepartment().getId() == null) {
                throw new IllegalArgumentException("Department is required");
            }
            dept = departmentRepository.findById(student.getDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        } else {
            Long deptId = securityService.getDepartmentId();
            if (deptId == null) {
                throw new AccessDeniedException("You do not belong to any department.");
            }
            dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        }
        student.setDepartment(dept);
        
        Student saved = studentRepository.save(student);
        return ResponseEntity.ok(ApiResponse.<Student>builder()
                .success(true).message("Student registered").data(saved).build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update student details")
    public ResponseEntity<ApiResponse<Student>> update(@PathVariable Long id, @RequestBody Student student) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        
        securityService.verifyDepartmentAccess(existing.getDepartment());
        
        existing.setName(student.getName());
        existing.setEmail(student.getEmail());
        existing.setRegisterNumber(student.getRegisterNumber());
        existing.setYear(student.getYear());
        
        if (securityService.isAdmin()) {
            if (student.getDepartment() != null && student.getDepartment().getId() != null) {
                Department dept = departmentRepository.findById(student.getDepartment().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
                existing.setDepartment(dept);
            }
        }
        
        return ResponseEntity.ok(ApiResponse.<Student>builder()
                .success(true).message("Student updated").data(studentRepository.save(existing)).build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a student")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        securityService.verifyDepartmentAccess(student.getDepartment());
        studentRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true).message("Student deleted").build());
    }
}
