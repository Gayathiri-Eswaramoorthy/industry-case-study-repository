package com.icr.backend.integration;

import com.icr.backend.casestudy.dto.SubmissionEvaluationRequest;
import com.icr.backend.casestudy.entity.CaseCoMapping;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.casestudy.repository.CaseCoMappingRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.course.entity.Course;
import com.icr.backend.course.repository.CourseRepository;
import com.icr.backend.entity.Role;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.enums.UserStatus;
import com.icr.backend.outcome.entity.CourseOutcome;
import com.icr.backend.outcome.repository.CourseOutcomeRepository;
import com.icr.backend.repository.RoleRepository;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.security.JwtUtil;
import tools.jackson.databind.ObjectMapper; // HARDENED: Use project Jackson package so test wiring matches Boot 4 runtime bean type.
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class SubmissionIntegrationTest {

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
    private CaseStudyRepository caseStudyRepository;
    @Autowired
    private CaseSubmissionRepository caseSubmissionRepository;
    @Autowired
    private CaseCoMappingRepository caseCoMappingRepository;
    @Autowired
    private CourseOutcomeRepository courseOutcomeRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;

    private Role facultyRole;
    private Role studentRole;

    @BeforeEach
    void setUp() {
        facultyRole = roleRepository.findByName(RoleType.FACULTY)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleType.FACULTY).build()));
        studentRole = roleRepository.findByName(RoleType.STUDENT)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleType.STUDENT).build()));
    }

    @Test
    void student_cannot_submit_twice() throws Exception {
        User faculty = createUser("faculty-sub1@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-sub1@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("SUB301");
        CaseStudy publishedCase = createCase("Submit Once", faculty, course, CaseStatus.PUBLISHED);

        String body = """
                {"caseId":%d,"submissionType":"TEXT","solutionText":"answer one"}
                """.formatted(publishedCase.getId());

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void submission_routes_to_student_faculty_not_case_creator() throws Exception {
        User facultyA = createUser("faculty-sub2a@test.com", facultyRole, UserStatus.APPROVED, null);
        User facultyB = createUser("faculty-sub2b@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-sub2@test.com", studentRole, UserStatus.APPROVED, facultyB);
        Course course = createCourse("SUB302");
        CaseStudy publishedCase = createCase("Route Faculty", facultyA, course, CaseStatus.PUBLISHED);

        String body = """
                {"caseId":%d,"submissionType":"TEXT","solutionText":"answer routing"}
                """.formatted(publishedCase.getId());

        mockMvc.perform(post("/api/submissions")
                        .header("Authorization", bearer(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        CaseSubmission saved = caseSubmissionRepository.findByCaseIdAndStudentId(publishedCase.getId(), student.getId())
                .orElseThrow();
        assertThat(saved.getEvaluatingFacultyId()).isEqualTo(facultyB.getId());
    }

    @Test
    void faculty_cannot_evaluate_other_faculty_student() throws Exception {
        User facultyA = createUser("faculty-sub3a@test.com", facultyRole, UserStatus.APPROVED, null);
        User facultyB = createUser("faculty-sub3b@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-sub3@test.com", studentRole, UserStatus.APPROVED, facultyB);
        Course course = createCourse("SUB303");
        CaseStudy publishedCase = createCase("Eval Bound", facultyB, course, CaseStatus.PUBLISHED);

        CaseSubmission submission = caseSubmissionRepository.save(CaseSubmission.builder()
                .caseId(publishedCase.getId())
                .studentId(student.getId())
                .evaluatingFacultyId(facultyB.getId())
                .solutionText("answer")
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build());

        SubmissionEvaluationRequest request = SubmissionEvaluationRequest.builder()
                .score(80)
                .feedback("feedback")
                .build();

        mockMvc.perform(put("/api/submissions/{id}/evaluate", submission.getId())
                        .header("Authorization", bearer(facultyA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void evaluation_sets_status_to_evaluated() throws Exception {
        User faculty = createUser("faculty-sub4@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-sub4@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("SUB304");
        CaseStudy publishedCase = createCase("Eval Status", faculty, course, CaseStatus.PUBLISHED);

        CaseSubmission submission = caseSubmissionRepository.save(CaseSubmission.builder()
                .caseId(publishedCase.getId())
                .studentId(student.getId())
                .evaluatingFacultyId(faculty.getId())
                .solutionText("answer")
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build());

        SubmissionEvaluationRequest request = SubmissionEvaluationRequest.builder()
                .score(88)
                .feedback("good")
                .build();

        mockMvc.perform(put("/api/submissions/{id}/evaluate", submission.getId())
                        .header("Authorization", bearer(faculty))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        CaseSubmission reloaded = caseSubmissionRepository.findById(submission.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(SubmissionStatus.EVALUATED);
        assertThat(reloaded.getEvaluatedAt()).isNotNull();
    }

    @Test
    void evaluated_submission_cannot_be_re_evaluated() throws Exception {
        User faculty = createUser("faculty-sub5@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-sub5@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("SUB305");
        CaseStudy publishedCase = createCase("Eval Once", faculty, course, CaseStatus.PUBLISHED);

        CaseSubmission submission = caseSubmissionRepository.save(CaseSubmission.builder()
                .caseId(publishedCase.getId())
                .studentId(student.getId())
                .evaluatingFacultyId(faculty.getId())
                .solutionText("answer")
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build());

        SubmissionEvaluationRequest request = SubmissionEvaluationRequest.builder()
                .score(75)
                .feedback("initial")
                .build();

        mockMvc.perform(put("/api/submissions/{id}/evaluate", submission.getId())
                        .header("Authorization", bearer(faculty))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/submissions/{id}/evaluate", submission.getId())
                        .header("Authorization", bearer(faculty))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void student_can_only_see_own_submission() throws Exception {
        User faculty = createUser("faculty-sub6@test.com", facultyRole, UserStatus.APPROVED, null);
        User studentA = createUser("student-sub6a@test.com", studentRole, UserStatus.APPROVED, faculty);
        User studentB = createUser("student-sub6b@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("SUB306");
        CaseStudy publishedCase = createCase("Student Own View", faculty, course, CaseStatus.PUBLISHED);

        CaseSubmission submissionA = caseSubmissionRepository.save(CaseSubmission.builder()
                .caseId(publishedCase.getId())
                .studentId(studentA.getId())
                .evaluatingFacultyId(faculty.getId())
                .solutionText("a")
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build());
        CaseSubmission submissionB = caseSubmissionRepository.save(CaseSubmission.builder()
                .caseId(publishedCase.getId())
                .studentId(studentB.getId())
                .evaluatingFacultyId(faculty.getId())
                .solutionText("b")
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build());

        mockMvc.perform(get("/api/submissions/{id}", submissionA.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/submissions/{id}", submissionB.getId())
                        .header("Authorization", bearer(studentA)))
                .andExpect(status().isNotFound());
    }

    @Test
    void co_mapped_evaluation_requires_all_co_scores() throws Exception {
        User faculty = createUser("faculty-sub7@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-sub7@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("SUB307");
        CaseStudy publishedCase = createCase("CO Completeness", faculty, course, CaseStatus.PUBLISHED);

        CourseOutcome co1 = createCourseOutcome(course, "CO1");
        CourseOutcome co2 = createCourseOutcome(course, "CO2");
        CourseOutcome co3 = createCourseOutcome(course, "CO3");
        caseCoMappingRepository.saveAll(List.of(
                CaseCoMapping.builder().caseStudy(publishedCase).courseOutcome(co1).mappedAt(LocalDateTime.now()).build(),
                CaseCoMapping.builder().caseStudy(publishedCase).courseOutcome(co2).mappedAt(LocalDateTime.now()).build(),
                CaseCoMapping.builder().caseStudy(publishedCase).courseOutcome(co3).mappedAt(LocalDateTime.now()).build()
        ));

        CaseSubmission submission = caseSubmissionRepository.save(CaseSubmission.builder()
                .caseId(publishedCase.getId())
                .studentId(student.getId())
                .evaluatingFacultyId(faculty.getId())
                .solutionText("answer")
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build());

        String requestBody = """
                {
                  "feedback":"co eval",
                  "coScores":[
                    {"coId":%d,"score":10,"maxScore":20},
                    {"coId":%d,"score":12,"maxScore":20}
                  ]
                }
                """.formatted(co1.getId(), co2.getId());

        mockMvc.perform(put("/api/submissions/{id}/evaluate", submission.getId())
                        .header("Authorization", bearer(faculty))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
        // HARDENED: Added submission-routing, duplicate-submit, evaluation-boundary, and CO-completeness integration coverage.
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

    private CourseOutcome createCourseOutcome(Course course, String code) {
        return courseOutcomeRepository.save(CourseOutcome.builder()
                .code(code)
                .description("Description " + code)
                .course(course)
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
