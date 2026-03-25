package com.icr.backend.integration;

import tools.jackson.databind.ObjectMapper; // HARDENED: Use project Jackson package so test wiring matches Boot 4 runtime bean type.
import com.icr.backend.casestudy.dto.UpdateCaseStudyRequest;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.course.entity.Course;
import com.icr.backend.course.repository.CourseRepository;
import com.icr.backend.entity.Role;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
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

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class CaseStudyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private com.icr.backend.casestudy.repository.CaseStudyRepository caseStudyRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;

    private Role facultyRole;
    private Role studentRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        facultyRole = roleRepository.findByName(RoleType.FACULTY)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleType.FACULTY).build()));
        studentRole = roleRepository.findByName(RoleType.STUDENT)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleType.STUDENT).build()));
        adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleType.ADMIN).build()));
    }

    @Test
    void draft_not_visible_to_student() throws Exception {
        User facultyA = createUser("faculty-a@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-a@test.com", studentRole, UserStatus.APPROVED, facultyA);
        Course course = createCourse("CS201");
        CaseStudy draft = createCase("Draft Hidden Student", facultyA, course, CaseStatus.DRAFT);

        mockMvc.perform(get("/api/cases")
                        .header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString(draft.getTitle()))));
    }

    @Test
    void draft_not_visible_to_other_faculty() throws Exception {
        User facultyA = createUser("faculty-aa@test.com", facultyRole, UserStatus.APPROVED, null);
        User facultyB = createUser("faculty-bb@test.com", facultyRole, UserStatus.APPROVED, null);
        Course course = createCourse("CS202");
        CaseStudy draft = createCase("Draft Hidden Faculty", facultyA, course, CaseStatus.DRAFT);

        mockMvc.perform(get("/api/cases/{id}", draft.getId())
                        .header("Authorization", bearer(facultyB)))
                .andExpect(status().isNotFound());
    }

    @Test
    void only_creator_can_publish() throws Exception {
        User facultyA = createUser("faculty-c@test.com", facultyRole, UserStatus.APPROVED, null);
        User facultyB = createUser("faculty-d@test.com", facultyRole, UserStatus.APPROVED, null);
        Course course = createCourse("CS203");
        CaseStudy draft = createCase("Draft Publish Guard", facultyA, course, CaseStatus.DRAFT);

        mockMvc.perform(put("/api/cases/{id}/publish", draft.getId())
                        .header("Authorization", bearer(facultyB)))
                .andExpect(status().isForbidden());
    }

    @Test
    void published_case_visible_to_all() throws Exception {
        User facultyA = createUser("faculty-e@test.com", facultyRole, UserStatus.APPROVED, null);
        User facultyB = createUser("faculty-f@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-b@test.com", studentRole, UserStatus.APPROVED, facultyA);
        Course course = createCourse("CS204");
        CaseStudy published = createCase("Published Visible", facultyA, course, CaseStatus.PUBLISHED);

        mockMvc.perform(get("/api/cases")
                        .header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString(published.getTitle())));

        mockMvc.perform(get("/api/cases")
                        .header("Authorization", bearer(facultyB)))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString(published.getTitle())));
    }

    @Test
    void published_case_restricts_editable_fields() throws Exception {
        User faculty = createUser("faculty-g@test.com", facultyRole, UserStatus.APPROVED, null);
        Course course = createCourse("CS205");
        CaseStudy published = createCase("Published Lock Title", faculty, course, CaseStatus.PUBLISHED);
        published.setDueDate(LocalDateTime.now().plusDays(2));
        caseStudyRepository.save(published);

        // TESTFIX: Send explicit ISO date JSON to match UpdateCaseStudyRequest @JsonFormat parsing in integration context.
        String requestJson = """
                {
                  "title": "Should Not Change",
                  "dueDate": "%s"
                }
                """.formatted(LocalDate.now().plusDays(15));

        mockMvc.perform(put("/api/faculty/cases/{id}", published.getId())
                        .header("Authorization", bearer(faculty))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk());

        CaseStudy reloaded = caseStudyRepository.findById(published.getId()).orElseThrow();
        assertThat(reloaded.getTitle()).isEqualTo("Published Lock Title");
        assertThat(reloaded.getDueDate().toLocalDate()).isEqualTo(LocalDate.now().plusDays(15));
    }

    @Test
    void student_response_excludes_teaching_notes() throws Exception {
        User faculty = createUser("faculty-h@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-c@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("CS206");
        CaseStudy published = createCase("Published Secret Notes", faculty, course, CaseStatus.PUBLISHED);
        published.setTeachingNotesText("SECRET");
        caseStudyRepository.save(published);

        mockMvc.perform(get("/api/cases/{id}", published.getId())
                        .header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("teachingNotes"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("SECRET"))));
    }

    @Test
    void archived_case_returns_410_on_submission() throws Exception {
        User admin = createUser("admin-case@test.com", adminRole, UserStatus.APPROVED, null);
        User faculty = createUser("faculty-i@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-d@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("CS207");
        CaseStudy published = createCase("Archive Submission Block", faculty, course, CaseStatus.PUBLISHED);

        mockMvc.perform(put("/api/admin/cases/{id}/archive", published.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk());

        String submissionBody = """
                {
                  "caseId": %d,
                  "submissionType": "TEXT",
                  "solutionText": "answer"
                }
                """.formatted(published.getId());

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submissionBody))
                .andExpect(status().isGone());
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

    private Course createCourse(String code) {
        return courseRepository.save(Course.builder()
                .courseCode(code)
                .courseName("Course " + code)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private CaseStudy createCase(String title, User creator, Course course, CaseStatus status) {
        return caseStudyRepository.save(CaseStudy.builder()
                .title(title)
                .description("Description for " + title)
                .difficulty(DifficultyLevel.MEDIUM)
                .status(status)
                .category(CaseCategory.STRATEGY)
                .submissionType(SubmissionType.TEXT)
                .course(course)
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .build());
    }
}
