package com.collegefeedback.repository;

import com.collegefeedback.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    List<Faculty> findByDepartmentId(Long departmentId);
    Optional<Faculty> findByEmail(String email);
    boolean existsByEmail(String email);
}
