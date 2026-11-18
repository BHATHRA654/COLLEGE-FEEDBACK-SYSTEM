package com.collegefeedback.controller;

import com.collegefeedback.repository.FeedbackRepository;
import com.collegefeedback.repository.FacultyRepository;
import com.collegefeedback.repository.CourseRepository;
import com.collegefeedback.security.DepartmentSecurityService;
import com.collegefeedback.exception.ResourceNotFoundException;
import com.collegefeedback.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Generate feedback analytics and reports")
public class ReportController {

    private final FeedbackRepository feedbackRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final DepartmentSecurityService securityService;

    @GetMapping("/faculty/{facultyId}/average-rating")
    @Operation(summary = "Get average feedback rating for a faculty member")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFacultyAverageRating(@PathVariable Long facultyId) {
        var faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
        securityService.verifyDepartmentAccess(faculty.getDepartment());

        Double avg = feedbackRepository.findAverageRatingByFacultyId(facultyId);
        Map<String, Object> data = new HashMap<>();
        data.put("facultyId", facultyId);
        data.put("averageRating", avg != null ? Math.round(avg * 100.0) / 100.0 : 0.0);
        data.put("totalFeedback", feedbackRepository.findByFacultyId(facultyId).size());
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true).message("Faculty report generated").data(data).build());
    }

    @GetMapping("/course/{courseId}/average-rating")
    @Operation(summary = "Get average feedback rating for a course")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCourseAverageRating(@PathVariable Long courseId) {
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        securityService.verifyDepartmentAccess(course.getDepartment());

        Double avg = feedbackRepository.findAverageRatingByCourseId(courseId);
        Map<String, Object> data = new HashMap<>();
        data.put("courseId", courseId);
        data.put("averageRating", avg != null ? Math.round(avg * 100.0) / 100.0 : 0.0);
        data.put("totalFeedback", feedbackRepository.findByCourseId(courseId).size());
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true).message("Course report generated").data(data).build());
    }

    @GetMapping("/summary")
    @Operation(summary = "Get overall feedback summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        Map<String, Object> data = new HashMap<>();
        if (securityService.isAdmin()) {
            data.put("totalFeedbackCount", feedbackRepository.count());
        } else {
            Long deptId = securityService.getDepartmentId();
            if (deptId == null) {
                data.put("totalFeedbackCount", 0L);
            } else {
                data.put("totalFeedbackCount", feedbackRepository.countByDepartmentId(deptId));
            }
        }
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true).message("Summary report generated").data(data).build());
    }
}
