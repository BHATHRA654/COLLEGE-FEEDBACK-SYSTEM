package com.collegefeedback.serviceImpl;

import com.collegefeedback.dto.JwtResponse;
import com.collegefeedback.dto.LoginRequest;
import com.collegefeedback.dto.RegisterRequest;
import com.collegefeedback.entity.Role;
import com.collegefeedback.entity.User;
import com.collegefeedback.exception.DuplicateResourceException;
import com.collegefeedback.entity.Department;
import com.collegefeedback.repository.DepartmentRepository;
import com.collegefeedback.repository.StudentRepository;
import com.collegefeedback.repository.FacultyRepository;
import com.collegefeedback.repository.UserRepository;
import com.collegefeedback.security.CustomUserDetails;
import com.collegefeedback.security.JwtService;
import com.collegefeedback.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final DepartmentRepository departmentRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;

    @Override
    public JwtResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateResourceException("User already exists with email: " + request.getEmail());
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            role = Role.STUDENT; // Default or could throw exception
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }

        if (role == Role.STUDENT) {
            var studentOpt = studentRepository.findByEmail(request.getEmail());
            if (studentOpt.isPresent()) {
                department = studentOpt.get().getDepartment();
            }
        } else if (role == Role.FACULTY) {
            var facultyOpt = facultyRepository.findByEmail(request.getEmail());
            if (facultyOpt.isPresent()) {
                department = facultyOpt.get().getDepartment();
            }
        }

        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .department(department)
                .enabled(true)
                .build();
        
        userRepository.save(user);

        var userDetails = new CustomUserDetails(user);
        var jwtToken = jwtService.generateToken(userDetails);
        
        return JwtResponse.builder()
                .token(jwtToken)
                .role(user.getRole().name())
                .username(user.getName())
                .email(user.getEmail())
                .departmentName(user.getDepartment() != null ? user.getDepartment().getDepartmentName() : null)
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .build();
    }

    @Override
    public JwtResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        
        var userDetails = new CustomUserDetails(user);
        var jwtToken = jwtService.generateToken(userDetails);
        
        return JwtResponse.builder()
                .token(jwtToken)
                .role(user.getRole().name())
                .username(user.getName())
                .email(user.getEmail())
                .departmentName(user.getDepartment() != null ? user.getDepartment().getDepartmentName() : null)
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .build();
    }
}
