package com.icr.backend.integration;

import tools.jackson.databind.JsonNode; // HARDENED: Align JsonNode type with project Jackson package.
import tools.jackson.databind.ObjectMapper; // HARDENED: Use project Jackson package so test wiring matches Boot 4 runtime bean type.
import com.icr.backend.casestudy.entity.CaseCoMapping;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.entity.SubmissionCoScore;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.casestudy.repository.CaseCoMappingRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.SubmissionCoScoreRepository;
import com.icr.backend.course.entity.Course;
import com.icr.backend.course.repository.CourseRepository;
import com.icr.backend.entity.Role;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.enums.UserStatus;
import com.icr.backend.outcome.entity.CourseOutcome;
import com.icr.backend.outcome.entity.CourseOutcomePOMapping;
import com.icr.backend.outcome.entity.ProgramOutcome;
import com.icr.backend.outcome.repository.CourseOutcomePORepository;
import com.icr.backend.outcome.repository.CourseOutcomeRepository;
import com.icr.backend.outcome.repository.ProgramOutcomeRepository;
import com.icr.backend.repository.RoleRepository;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
// HARDENED: Updated test annotation import for Spring Boot 4 webmvc test package
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AttainmentIntegrationTest {

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
    private SubmissionCoScoreRepository submissionCoScoreRepository;
    @Autowired
    private CourseOutcomeRepository courseOutcomeRepository;
    @Autowired
    private CaseCoMappingRepository caseCoMappingRepository;
    @Autowired
    private ProgramOutcomeRepository programOutcomeRepository;
    @Autowired
    private CourseOutcomePORepository courseOutcomePORepository;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

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
    void attainment_status_thresholds() throws Exception {
        User faculty = createUser("faculty-att1@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-att1@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("ATT401");
        CourseOutcome co = createCourseOutcome(course, "CO-T1");
        CaseStudy caseStudy = createMappedCase("Threshold Case", faculty, course, List.of(co));

        CaseSubmission sub80 = createEvaluatedSubmission(caseStudy, student, faculty, 80);
        submissionCoScoreRepository.save(SubmissionCoScore.builder()
                .submissionId(sub80.getId())
                .coId(co.getId())
                .score(80)
                .maxScore(100)
                .build());

        JsonNode attained = getJson("/api/attainment/my/co", student);
        assertThat(attained.isArray()).isTrue();
        assertThat(attained.get(0).get("status").asText()).isEqualTo("ATTAINED");

        // TESTFIX: Force DB flush between phases so the unique (case_id, student_id) constraint is released before reinserting.
        submissionCoScoreRepository.deleteAllInBatch();
        caseSubmissionRepository.deleteAllInBatch();
        submissionCoScoreRepository.flush();
        caseSubmissionRepository.flush();

        CaseSubmission sub50 = createEvaluatedSubmission(caseStudy, student, faculty, 50);
        submissionCoScoreRepository.save(SubmissionCoScore.builder()
                .submissionId(sub50.getId())
                .coId(co.getId())
                .score(50)
                .maxScore(100)
                .build());
        JsonNode partial = getJson("/api/attainment/my/co", student);
        assertThat(partial.get(0).get("status").asText()).isEqualTo("PARTIAL");

        // TESTFIX: Force DB flush between phases so the unique (case_id, student_id) constraint is released before reinserting.
        submissionCoScoreRepository.deleteAllInBatch();
        caseSubmissionRepository.deleteAllInBatch();
        submissionCoScoreRepository.flush();
        caseSubmissionRepository.flush();

        CaseSubmission sub30 = createEvaluatedSubmission(caseStudy, student, faculty, 30);
        submissionCoScoreRepository.save(SubmissionCoScore.builder()
                .submissionId(sub30.getId())
                .coId(co.getId())
                .score(30)
                .maxScore(100)
                .build());
        JsonNode notAttained = getJson("/api/attainment/my/co", student);
        assertThat(notAttained.get(0).get("status").asText()).isEqualTo("NOT_ATTAINED");
    }

    @Test
    void pending_submissions_excluded_from_attainment() throws Exception {
        User faculty = createUser("faculty-att2@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-att2@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("ATT402");
        CourseOutcome co = createCourseOutcome(course, "CO-T2");
        CaseStudy caseStudy = createMappedCase("Pending Exclusion Case", faculty, course, List.of(co));

        caseSubmissionRepository.save(CaseSubmission.builder()
                .caseId(caseStudy.getId())
                .studentId(student.getId())
                .evaluatingFacultyId(faculty.getId())
                .solutionText("pending")
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build());

        JsonNode response = getJson("/api/attainment/my/co", student);
        assertThat(response.isArray()).isTrue();
        assertThat(response.size()).isZero();
    }

    @Test
    void po_attainment_rolls_up_from_co() throws Exception {
        User faculty = createUser("faculty-att3@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-att3@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("ATT403");
        CourseOutcome co1 = createCourseOutcome(course, "CO-P1");
        CourseOutcome co2 = createCourseOutcome(course, "CO-P2");
        ProgramOutcome po = programOutcomeRepository.save(ProgramOutcome.builder()
                .code("PO-P1")
                .description("PO partial")
                .build());
        courseOutcomePORepository.save(CourseOutcomePOMapping.builder().courseOutcome(co1).programOutcome(po).createdAt(LocalDateTime.now()).build());
        courseOutcomePORepository.save(CourseOutcomePOMapping.builder().courseOutcome(co2).programOutcome(po).createdAt(LocalDateTime.now()).build());

        CaseStudy caseStudy = createMappedCase("PO Partial Case", faculty, course, List.of(co1, co2));
        CaseSubmission submission = createEvaluatedSubmission(caseStudy, student, faculty, 110);
        submissionCoScoreRepository.saveAll(List.of(
                SubmissionCoScore.builder().submissionId(submission.getId()).coId(co1.getId()).score(80).maxScore(100).build(),
                SubmissionCoScore.builder().submissionId(submission.getId()).coId(co2.getId()).score(50).maxScore(100).build()
        ));

        JsonNode response = getJson("/api/attainment/my/po", student);
        assertThat(response.get(0).get("status").asText()).isEqualTo("PARTIAL");
    }

    @Test
    void po_not_attained_if_any_co_not_attained() throws Exception {
        User faculty = createUser("faculty-att4@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-att4@test.com", studentRole, UserStatus.APPROVED, faculty);
        Course course = createCourse("ATT404");
        CourseOutcome co1 = createCourseOutcome(course, "CO-P3");
        CourseOutcome co2 = createCourseOutcome(course, "CO-P4");
        ProgramOutcome po = programOutcomeRepository.save(ProgramOutcome.builder()
                .code("PO-P2")
                .description("PO not attained")
                .build());
        courseOutcomePORepository.save(CourseOutcomePOMapping.builder().courseOutcome(co1).programOutcome(po).createdAt(LocalDateTime.now()).build());
        courseOutcomePORepository.save(CourseOutcomePOMapping.builder().courseOutcome(co2).programOutcome(po).createdAt(LocalDateTime.now()).build());

        CaseStudy caseStudy = createMappedCase("PO Not Attained Case", faculty, course, List.of(co1, co2));
        CaseSubmission submission = createEvaluatedSubmission(caseStudy, student, faculty, 110);
        submissionCoScoreRepository.saveAll(List.of(
                SubmissionCoScore.builder().submissionId(submission.getId()).coId(co1.getId()).score(80).maxScore(100).build(),
                SubmissionCoScore.builder().submissionId(submission.getId()).coId(co2.getId()).score(30).maxScore(100).build()
        ));

        JsonNode response = getJson("/api/attainment/my/po", student);
        assertThat(response.get(0).get("status").asText()).isEqualTo("NOT_ATTAINED");
    }

    @Test
    void empty_attainment_returns_200_not_404() throws Exception {
        User faculty = createUser("faculty-att5@test.com", facultyRole, UserStatus.APPROVED, null);
        User student = createUser("student-att5@test.com", studentRole, UserStatus.APPROVED, faculty);

        JsonNode coResponse = getJson("/api/attainment/my/co", student);
        assertThat(coResponse.isArray()).isTrue();
        assertThat(coResponse.size()).isZero();

        JsonNode poResponse = getJson("/api/attainment/my/po", student);
        assertThat(poResponse.isArray()).isTrue();
        assertThat(poResponse.size()).isZero();
        // HARDENED: Added attainment integration coverage for thresholds, exclusion rules, PO rollup logic, and empty 200 responses.
    }

    private JsonNode getJson(String endpoint, User student) throws Exception {
        String body = mockMvc.perform(get(endpoint).header("Authorization", bearer(student)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(body);
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

    private CaseStudy createMappedCase(String title, User creator, Course course, List<CourseOutcome> cos) {
        CaseStudy caseStudy = caseStudyRepository.save(CaseStudy.builder()
                .title(title)
                .description("Description for " + title)
                .difficulty(DifficultyLevel.MEDIUM)
                .status(CaseStatus.PUBLISHED)
                .category(CaseCategory.STRATEGY)
                .submissionType(SubmissionType.TEXT)
                .course(course)
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .build());
        cos.forEach(co -> caseCoMappingRepository.save(
                CaseCoMapping.builder()
                        .caseStudy(caseStudy)
                        .courseOutcome(co)
                        .mappedAt(LocalDateTime.now())
                        .build()
        ));
        return caseStudy;
    }

    private CaseSubmission createEvaluatedSubmission(CaseStudy caseStudy, User student, User faculty, int marks) {
        return caseSubmissionRepository.save(CaseSubmission.builder()
                .caseId(caseStudy.getId())
                .studentId(student.getId())
                .evaluatingFacultyId(faculty.getId())
                .solutionText("evaluated")
                .marksAwarded(marks)
                .status(SubmissionStatus.EVALUATED)
                .submittedAt(LocalDateTime.now().minusDays(1))
                .evaluatedAt(LocalDateTime.now())
                .evaluatedByFacultyId(faculty.getId())
                .build());
    }
}
