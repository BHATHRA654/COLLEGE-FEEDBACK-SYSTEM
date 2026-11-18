package com.collegefeedback.repository;

import com.collegefeedback.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByStudentId(Long studentId);
    List<Feedback> findByFacultyId(Long facultyId);
    List<Feedback> findByCourseId(Long courseId);

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.faculty.id = :facultyId")
    Double findAverageRatingByFacultyId(Long facultyId);

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.course.id = :courseId")
    Double findAverageRatingByCourseId(Long courseId);

    @Query("SELECT f FROM Feedback f WHERE f.course.department.id = :deptId")
    List<Feedback> findByDepartmentId(Long deptId);

    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.course.department.id = :deptId")
    long countByDepartmentId(Long deptId);
}
