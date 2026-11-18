package com.collegefeedback.security;

import com.collegefeedback.entity.Department;
import com.collegefeedback.entity.Role;
import com.collegefeedback.entity.User;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class DepartmentSecurityService {

    public User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getUser();
        }
        return null;
    }

    public Long getDepartmentId() {
        User user = getCurrentUser();
        if (user != null && user.getDepartment() != null) {
            return user.getDepartment().getId();
        }
        return null;
    }

    public Role getRole() {
        User user = getCurrentUser();
        if (user != null) {
            return user.getRole();
        }
        return null;
    }

    public boolean isAdmin() {
        Role role = getRole();
        return role == Role.ADMIN;
    }

    public boolean isHOD() {
        Role role = getRole();
        return role == Role.HOD;
    }

    public boolean isFaculty() {
        Role role = getRole();
        return role == Role.FACULTY;
    }

    public boolean isStudent() {
        Role role = getRole();
        return role == Role.STUDENT;
    }

    public void verifyHODAccessForDepartment(Long departmentId) {
        if (isAdmin()) {
            return;
        }
        if (isHOD()) {
            Long userDeptId = getDepartmentId();
            if (userDeptId == null || !userDeptId.equals(departmentId)) {
                throw new AccessDeniedException("You are not authorized to access this department.");
            }
            return;
        }
        throw new AccessDeniedException("Access denied.");
    }

    public void verifyHODAccessForEntity(Department entityDepartment) {
        if (isAdmin()) {
            return;
        }
        if (isHOD()) {
            Long userDeptId = getDepartmentId();
            if (entityDepartment == null || userDeptId == null || !userDeptId.equals(entityDepartment.getId())) {
                throw new AccessDeniedException("You are not authorized to access this department's records.");
            }
            return;
        }
        throw new AccessDeniedException("Access denied.");
    }

    public void verifyDepartmentAccess(Department entityDepartment) {
        if (isAdmin()) {
            return;
        }
        Long userDeptId = getDepartmentId();
        if (entityDepartment == null || userDeptId == null || !userDeptId.equals(entityDepartment.getId())) {
            throw new AccessDeniedException("You are not authorized to access this department's records.");
        }
    }
}
