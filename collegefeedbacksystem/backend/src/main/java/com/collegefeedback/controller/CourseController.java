package com.collegefeedback.controller;

import com.collegefeedback.entity.Course;
import com.collegefeedback.entity.Department;
import com.collegefeedback.exception.DuplicateResourceException;
import com.collegefeedback.exception.ResourceNotFoundException;
import com.collegefeedback.repository.CourseRepository;
import com.collegefeedback.repository.DepartmentRepository;
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
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Manage courses offered by departments")
public class CourseController {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final DepartmentSecurityService securityService;

    @GetMapping
    @Operation(summary = "Get all courses")
    public ResponseEntity<ApiResponse<List<Course>>> getAll() {
        if (securityService.isAdmin()) {
            return ResponseEntity.ok(ApiResponse.<List<Course>>builder()
                    .success(true).message("Courses fetched").data(courseRepository.findAll()).build());
        }
        Long deptId = securityService.getDepartmentId();
        if (deptId == null) {
            return ResponseEntity.ok(ApiResponse.<List<Course>>builder()
                    .success(true).message("Courses fetched").data(List.of()).build());
        }
        return ResponseEntity.ok(ApiResponse.<List<Course>>builder()
                .success(true).message("Courses fetched").data(courseRepository.findByDepartmentId(deptId)).build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get course by ID")
    public ResponseEntity<ApiResponse<Course>> getById(@PathVariable Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        securityService.verifyDepartmentAccess(course.getDepartment());
        return ResponseEntity.ok(ApiResponse.<Course>builder()
                .success(true).message("Course fetched").data(course).build());
    }

    @GetMapping("/department/{departmentId}")
    @Operation(summary = "Get all courses by department")
    public ResponseEntity<ApiResponse<List<Course>>> getByDepartment(@PathVariable Long departmentId) {
        securityService.verifyDepartmentAccess(departmentRepository.findById(departmentId).orElse(null));
        return ResponseEntity.ok(ApiResponse.<List<Course>>builder()
                .success(true).message("Courses fetched").data(courseRepository.findByDepartmentId(departmentId)).build());
    }

    @PostMapping
    @Operation(summary = "Create a new course")
    public ResponseEntity<ApiResponse<Course>> create(@RequestBody Course course) {
        if (courseRepository.existsByCourseCode(course.getCourseCode())) {
            throw new DuplicateResourceException("Course code already exists: " + course.getCourseCode());
        }
        
        Department dept;
        if (securityService.isAdmin()) {
            if (course.getDepartment() == null || course.getDepartment().getId() == null) {
                throw new IllegalArgumentException("Department is required");
            }
            dept = departmentRepository.findById(course.getDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        } else {
            Long deptId = securityService.getDepartmentId();
            if (deptId == null) {
                throw new AccessDeniedException("You do not belong to any department.");
            }
            dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        }
        course.setDepartment(dept);
        
        Course saved = courseRepository.save(course);
        return ResponseEntity.ok(ApiResponse.<Course>builder()
                .success(true).message("Course created").data(saved).build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a course")
    public ResponseEntity<ApiResponse<Course>> update(@PathVariable Long id, @RequestBody Course course) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        
        securityService.verifyDepartmentAccess(existing.getDepartment());
        
        existing.setCourseName(course.getCourseName());
        existing.setCourseCode(course.getCourseCode());
        
        if (securityService.isAdmin()) {
            if (course.getDepartment() != null && course.getDepartment().getId() != null) {
                Department dept = departmentRepository.findById(course.getDepartment().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
                existing.setDepartment(dept);
            }
        }
        
        return ResponseEntity.ok(ApiResponse.<Course>builder()
                .success(true).message("Course updated").data(courseRepository.save(existing)).build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a course")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        securityService.verifyDepartmentAccess(course.getDepartment());
        courseRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true).message("Course deleted").build());
    }
}
