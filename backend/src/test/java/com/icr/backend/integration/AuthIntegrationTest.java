package com.icr.backend.integration;

import tools.jackson.databind.ObjectMapper; // HARDENED: Use project Jackson package so test wiring matches Boot 4 runtime bean type.
import com.icr.backend.dto.request.LoginRequest;
import com.icr.backend.dto.request.RegisterRequest;
import com.icr.backend.entity.Role;
import com.icr.backend.entity.User;
import com.icr.backend.enums.RoleType;
import com.icr.backend.enums.UserStatus;
import com.icr.backend.repository.RoleRepository;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
// HARDENED: Updated test annotation import for Spring Boot 4 webmvc test package
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;

    private Role adminRole;
    private Role facultyRole;
    private Role studentRole;

    @BeforeEach
    void setUp() {
        adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleType.ADMIN).build()));
        facultyRole = roleRepository.findByName(RoleType.FACULTY)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleType.FACULTY).build()));
        studentRole = roleRepository.findByName(RoleType.STUDENT)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleType.STUDENT).build()));
    }

    @Test
    void faculty_registration_creates_pending_user() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Faculty Pending");
        request.setEmail("pending-faculty@test.com");
        request.setPassword("Faculty@1234");
        request.setDepartment("CSE");

        mockMvc.perform(post("/api/auth/register/faculty")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        User saved = userRepository.findByEmail("pending-faculty@test.com").orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(UserStatus.PENDING_ADMIN_APPROVAL);
        assertThat(saved.getRole().getName()).isEqualTo(RoleType.FACULTY);
        // HARDENED: Added integration coverage for faculty registration pending-status persistence.
    }

    @Test
    void faculty_registration_blocks_admin_role() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Faculty Admin Attempt");
        request.setEmail("blocked-admin-role@test.com");
        request.setPassword("Faculty@1234");
        request.setRole(RoleType.ADMIN);

        mockMvc.perform(post("/api/auth/register/faculty")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void student_registration_requires_approved_faculty() throws Exception {
        User pendingFaculty = createUser(
                "Pending Faculty",
                "pending-faculty2@test.com",
                "Faculty@1234",
                facultyRole,
                UserStatus.PENDING_ADMIN_APPROVAL,
                null
        );

        RegisterRequest request = new RegisterRequest();
        request.setFullName("Student Applicant");
        request.setEmail("student-applicant@test.com");
        request.setPassword("Student@1234");
        request.setRequestedFacultyId(pendingFaculty.getId());

        mockMvc.perform(post("/api/auth/register/student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_pending_faculty_returns_403_with_pendingType() throws Exception {
        createUser(
                "Pending Faculty Login",
                "pending-login-faculty@test.com",
                "Faculty@1234",
                facultyRole,
                UserStatus.PENDING_ADMIN_APPROVAL,
                null
        );

        LoginRequest request = new LoginRequest();
        request.setEmail("pending-login-faculty@test.com");
        request.setPassword("Faculty@1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"pendingType\":\"faculty\"")));
    }

    @Test
    void login_pending_student_returns_403_with_pendingType() throws Exception {
        User approvedFaculty = createUser(
                "Approved Faculty",
                "approved-faculty-auth@test.com",
                "Faculty@1234",
                facultyRole,
                UserStatus.APPROVED,
                null
        );
        createUser(
                "Pending Student Login",
                "pending-login-student@test.com",
                "Student@1234",
                studentRole,
                UserStatus.PENDING_FACULTY_APPROVAL,
                approvedFaculty
        );

        LoginRequest request = new LoginRequest();
        request.setEmail("pending-login-student@test.com");
        request.setPassword("Student@1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"pendingType\":\"student\"")));
    }

    @Test
    void login_approved_user_returns_jwt() throws Exception {
        createUser(
                "Approved Faculty Login",
                "approved-login-faculty@test.com",
                "Faculty@1234",
                facultyRole,
                UserStatus.APPROVED,
                null
        );

        LoginRequest request = new LoginRequest();
        request.setEmail("approved-login-faculty@test.com");
        request.setPassword("Faculty@1234");

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(response).isNotBlank();
        assertThat(response.split("\\.")).hasSize(3);
    }

    @Test
    void admin_reject_faculty_permanently_deletes() throws Exception {
        User admin = createUser(
                "Admin Reject",
                "admin-reject@test.com",
                "Admin@1234",
                adminRole,
                UserStatus.APPROVED,
                null
        );
        User pendingFaculty = createUser(
                "Faculty Reject",
                "faculty-reject@test.com",
                "Faculty@1234",
                facultyRole,
                UserStatus.PENDING_ADMIN_APPROVAL,
                null
        );

        mockMvc.perform(delete("/api/admin/users/{id}/reject", pendingFaculty.getId())
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk());

        assertThat(userRepository.findById(pendingFaculty.getId())).isEmpty();
    }

    @Test
    void faculty_reject_student_permanently_deletes() throws Exception {
        User faculty = createUser(
                "Faculty Rejector",
                "faculty-rejector@test.com",
                "Faculty@1234",
                facultyRole,
                UserStatus.APPROVED,
                null
        );
        User student = createUser(
                "Student Reject",
                "student-reject@test.com",
                "Student@1234",
                studentRole,
                UserStatus.PENDING_FACULTY_APPROVAL,
                faculty
        );

        mockMvc.perform(delete("/api/faculty/students/{id}/reject", student.getId())
                        .header("Authorization", "Bearer " + tokenFor(faculty)))
                .andExpect(status().isOk());

        assertThat(userRepository.findById(student.getId())).isEmpty();
    }

    private String tokenFor(User user) {
        return jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().getName().name());
    }

    private User createUser(String fullName,
                            String email,
                            String rawPassword,
                            Role role,
                            UserStatus status,
                            User requestedFaculty) {
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .status(status)
                .requestedFaculty(requestedFaculty)
                .build();
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
}
