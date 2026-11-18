package com.collegefeedback.controller;

import com.collegefeedback.entity.Course;
import com.collegefeedback.entity.Faculty;
import com.collegefeedback.entity.Feedback;
import com.collegefeedback.entity.Student;
import com.collegefeedback.exception.ResourceNotFoundException;
import com.collegefeedback.repository.CourseRepository;
import com.collegefeedback.repository.FacultyRepository;
import com.collegefeedback.repository.FeedbackRepository;
import com.collegefeedback.repository.StudentRepository;
import com.collegefeedback.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.collegefeedback.security.DepartmentSecurityService;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@Tag(name = "Feedback", description = "Submit and view student feedback")
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final DepartmentSecurityService securityService;

    @GetMapping
    @Operation(summary = "Get all feedback entries")
    public ResponseEntity<ApiResponse<List<Feedback>>> getAll() {
        if (securityService.isAdmin()) {
            return ResponseEntity.ok(ApiResponse.<List<Feedback>>builder()
                    .success(true).message("Feedback fetched").data(feedbackRepository.findAll()).build());
        }
        Long deptId = securityService.getDepartmentId();
        if (deptId == null) {
            return ResponseEntity.ok(ApiResponse.<List<Feedback>>builder()
                    .success(true).message("Feedback fetched").data(List.of()).build());
        }
        return ResponseEntity.ok(ApiResponse.<List<Feedback>>builder()
                .success(true).message("Feedback fetched").data(feedbackRepository.findByDepartmentId(deptId)).build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get feedback by ID")
    public ResponseEntity<ApiResponse<Feedback>> getById(@PathVariable Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with id: " + id));
        if (feedback.getCourse() != null) {
            securityService.verifyDepartmentAccess(feedback.getCourse().getDepartment());
        }
        return ResponseEntity.ok(ApiResponse.<Feedback>builder()
                .success(true).message("Feedback fetched").data(feedback).build());
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Get all feedback submitted by a student")
    public ResponseEntity<ApiResponse<List<Feedback>>> getByStudent(@PathVariable Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        securityService.verifyDepartmentAccess(student.getDepartment());
        return ResponseEntity.ok(ApiResponse.<List<Feedback>>builder()
                .success(true).message("Feedback fetched").data(feedbackRepository.findByStudentId(studentId)).build());
    }

    @GetMapping("/faculty/{facultyId}")
    @Operation(summary = "Get all feedback for a faculty member")
    public ResponseEntity<ApiResponse<List<Feedback>>> getByFaculty(@PathVariable Long facultyId) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        securityService.verifyDepartmentAccess(faculty.getDepartment());
        return ResponseEntity.ok(ApiResponse.<List<Feedback>>builder()
                .success(true).message("Feedback fetched").data(feedbackRepository.findByFacultyId(facultyId)).build());
    }

    @GetMapping("/course/{courseId}")
    @Operation(summary = "Get all feedback for a course")
    public ResponseEntity<ApiResponse<List<Feedback>>> getByCourse(@PathVariable Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        securityService.verifyDepartmentAccess(course.getDepartment());
        return ResponseEntity.ok(ApiResponse.<List<Feedback>>builder()
                .success(true).message("Feedback fetched").data(feedbackRepository.findByCourseId(courseId)).build());
    }

    @PostMapping
    @Operation(summary = "Submit new feedback")
    public ResponseEntity<ApiResponse<Feedback>> create(@RequestBody Feedback feedback) {
        Student student = null;
        if (feedback.getStudent() != null && feedback.getStudent().getId() != null) {
            student = studentRepository.findById(feedback.getStudent().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
            feedback.setStudent(student);
        }
        Faculty faculty = null;
        if (feedback.getFaculty() != null && feedback.getFaculty().getId() != null) {
            faculty = facultyRepository.findById(feedback.getFaculty().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
            feedback.setFaculty(faculty);
        }
        Course course = null;
        if (feedback.getCourse() != null && feedback.getCourse().getId() != null) {
            course = courseRepository.findById(feedback.getCourse().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
            feedback.setCourse(course);
        }

        // Validate that Student, Course, and Faculty belong to the same department
        if (student == null || faculty == null || course == null ||
            student.getDepartment() == null || faculty.getDepartment() == null || course.getDepartment() == null ||
            !student.getDepartment().getId().equals(course.getDepartment().getId()) ||
            !student.getDepartment().getId().equals(faculty.getDepartment().getId())) {
            throw new AccessDeniedException("Student, course, and faculty departments must match.");
        }

        // Verify the submitter matches the logged-in student department (access boundary)
        securityService.verifyDepartmentAccess(student.getDepartment());

        feedback.setSubmittedDate(LocalDateTime.now());
        Feedback saved = feedbackRepository.save(feedback);
        return ResponseEntity.ok(ApiResponse.<Feedback>builder()
                .success(true).message("Feedback submitted").data(saved).build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a feedback entry")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with id: " + id));
        if (feedback.getCourse() != null) {
            securityService.verifyDepartmentAccess(feedback.getCourse().getDepartment());
        }
        feedbackRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true).message("Feedback deleted").build());
    }
}
