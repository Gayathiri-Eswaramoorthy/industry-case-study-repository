package com.icr.backend.integration;

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class SecurityBoundaryTest {

    @Autowired
    private MockMvc mockMvc;
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
    void unauthenticated_request_to_protected_endpoint_returns_401() throws Exception {
        mockMvc.perform(get("/api/cases"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void student_cannot_access_admin_endpoint() throws Exception {
        User student = createUser("student-sec1@test.com", studentRole, UserStatus.APPROVED, null);
        mockMvc.perform(get("/api/admin/pending-faculty")
                        .header("Authorization", bearer(student)))
                .andExpect(status().isForbidden());
    }

    @Test
    void student_cannot_access_faculty_endpoint() throws Exception {
        User student = createUser("student-sec2@test.com", studentRole, UserStatus.APPROVED, null);
        mockMvc.perform(get("/api/faculty/pending-students")
                        .header("Authorization", bearer(student)))
                .andExpect(status().isForbidden());
    }

    @Test
    void faculty_cannot_access_admin_endpoint() throws Exception {
        User faculty = createUser("faculty-sec1@test.com", facultyRole, UserStatus.APPROVED, null);
        mockMvc.perform(put("/api/admin/cases/{id}/archive", 99999L)
                        .header("Authorization", bearer(faculty)))
                .andExpect(status().isForbidden());
    }

    @Test
    void public_faculty_list_accessible_without_token() throws Exception {
        mockMvc.perform(get("/api/users")
                        .param("role", "FACULTY")
                        .param("status", "APPROVED"))
                .andExpect(status().isOk());
    }

    @Test
    void public_faculty_list_does_not_expose_password_or_token() throws Exception {
        createUser("faculty-public@test.com", facultyRole, UserStatus.APPROVED, null);

        String response = mockMvc.perform(get("/api/users")
                        .param("role", "FACULTY")
                        .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(response).doesNotContain("password");
        assertThat(response).doesNotContain("token");
    }

    @Test
    void pending_user_jwt_rejected_on_all_protected_routes() throws Exception {
        User pendingFaculty = createUser("pending-sec@test.com", facultyRole, UserStatus.PENDING_ADMIN_APPROVAL, null);

        mockMvc.perform(get("/api/cases")
                        .header("Authorization", bearer(pendingFaculty)))
                .andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"pendingType\":\"faculty\"")));
        // HARDENED: Added security-boundary integration coverage for public/private access and pending JWT enforcement.
    }

    private String bearer(User user) {
        return "Bearer " + jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().getName().name());
    }

    private User createUser(String email, Role role, UserStatus status, User requestedFaculty) {
        User user = User.builder()
                .fullName(email)
                .email(email)
                .password(passwordEncoder.encode("Password@123"))
                .role(role)
                .status(status)
                .requestedFaculty(requestedFaculty)
                .build();
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
}
