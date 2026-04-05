package com.icr.backend.service.impl;

import com.icr.backend.dto.request.LoginRequest;
import com.icr.backend.dto.request.RegisterRequest;
import com.icr.backend.entity.Role;
import com.icr.backend.entity.User;
import com.icr.backend.enums.RoleType;
import com.icr.backend.enums.UserStatus;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.RoleRepository;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.security.JwtUtil;
import com.icr.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public void register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .department(request.getDepartment())
                .specialization(request.getSpecialization())
                .build();

        if (request.getRole() == RoleType.FACULTY) {
            user.setStatus(UserStatus.PENDING_ADMIN_APPROVAL);
        } else if (request.getRole() == RoleType.STUDENT) {
            if (request.getRequestedFacultyId() == null) {
                throw new IllegalArgumentException("Faculty selection is required for student registration");
            }

            User requestedFaculty = userRepository.findById(request.getRequestedFacultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));
            if (requestedFaculty.getRole() == null || requestedFaculty.getRole().getName() != RoleType.FACULTY) {
                throw new ResourceNotFoundException("Faculty not found");
            }

            user.setStatus(UserStatus.PENDING_FACULTY_APPROVAL);
            user.setRequestedFaculty(requestedFaculty);
        } else {
            user.setStatus(UserStatus.APPROVED);
        }

        userRepository.save(user);
    }

    @Override
    public void registerFaculty(RegisterRequest request) {
        if (request.getRole() == RoleType.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Admin role cannot be registered here");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        Role role = roleRepository.findByName(RoleType.FACULTY)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .department(request.getDepartment())
                .specialization(request.getSpecialization())
                .status(UserStatus.PENDING_ADMIN_APPROVAL)
                .build();
        userRepository.save(user);
    }

    @Override
    public void registerStudent(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (request.getRequestedFacultyId() == null) {
            throw new IllegalArgumentException("requestedFacultyId is required");
        }

        User requestedFaculty = userRepository.findById(request.getRequestedFacultyId())
                .orElseThrow(() -> new IllegalArgumentException("Requested faculty not found"));
        if (requestedFaculty.getRole() == null || requestedFaculty.getRole().getName() != RoleType.FACULTY) {
            throw new IllegalArgumentException("Requested faculty is invalid");
        }
        if (requestedFaculty.getStatus() != UserStatus.APPROVED) {
            throw new IllegalArgumentException("Requested faculty must be approved");
        }

        Role role = roleRepository.findByName(RoleType.STUDENT)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .department(request.getDepartment())
                .specialization(request.getSpecialization())
                .requestedFaculty(requestedFaculty)
                .status(UserStatus.PENDING_FACULTY_APPROVAL)
                .build();
        userRepository.save(user);
    }

    @Override
    public String login(LoginRequest request) {
        try {
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new BadCredentialsException("Invalid email or password");
            }

            if (user.getStatus() == UserStatus.PENDING_ADMIN_APPROVAL) {
                throw new IllegalStateException("Your account is pending admin approval");
            }
            if (user.getStatus() == UserStatus.PENDING_FACULTY_APPROVAL) {
                throw new IllegalStateException("Your account is pending faculty approval");
            }
            if (user.getStatus() == UserStatus.REJECTED) {
                throw new IllegalStateException("Your registration was rejected: " + user.getRejectionReason());
            }
            if (user.getStatus() != UserStatus.APPROVED) {
                throw new IllegalStateException("Your account is not approved");
            }

            return jwtUtil.generateToken(
                    user.getId(),
                    user.getEmail(),
                    user.getRole().getName().name()
            );
        } catch (BadCredentialsException e) {
            throw e;
        } catch (UsernameNotFoundException e) {
            throw new BadCredentialsException("Invalid email or password");
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace(); // DEBUG
            throw new RuntimeException("Login failed");
        }
    }

}
