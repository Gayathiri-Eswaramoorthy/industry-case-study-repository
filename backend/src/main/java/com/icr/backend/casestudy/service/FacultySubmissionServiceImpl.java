package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.repository.CaseAssignmentRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.entity.User;
import com.icr.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacultySubmissionServiceImpl implements FacultySubmissionService {

    private final CaseSubmissionRepository submissionRepository;
    private final CaseAssignmentRepository caseAssignmentRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FacultySubmissionDTO> getFacultySubmissions() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return List.of();
            }

            String email = auth.getName();
            if (email == null || email.isBlank() ||
                    "anonymousUser".equalsIgnoreCase(email)) {
                return List.of();
            }

            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));

            List<Long> createdCaseIds = caseStudyRepository.findByCreatedBy_Id(faculty.getId())
                    .stream()
                    .map(CaseStudy::getId)
                    .toList();

            List<Long> assignedCaseIds = caseAssignmentRepository.findByFacultyId(faculty.getId())
                    .stream()
                    .map(assignment -> assignment.getCaseStudy().getId())
                    .toList();

            List<Long> allCaseIds = Stream.concat(createdCaseIds.stream(), assignedCaseIds.stream())
                    .distinct()
                    .toList();

            if (allCaseIds.isEmpty()) {
                return List.of();
            }

            List<CaseSubmission> submissions = submissionRepository.findByCaseIdInOrderBySubmittedAtDesc(allCaseIds);
            log.info("Total submissions found for faculty {}: {}", faculty.getEmail(), submissions.size());

            if (submissions.isEmpty()) {
                return List.of();
            }

            Set<Long> studentIds = submissions.stream()
                    .map(CaseSubmission::getStudentId)
                    .filter(id -> id != null)
                    .collect(Collectors.toSet());

            Set<Long> caseIds = submissions.stream()
                    .map(CaseSubmission::getCaseId)
                    .filter(id -> id != null)
                    .collect(Collectors.toSet());

            Map<Long, String> studentNameById = userRepository
                    .findAllById(studentIds)
                    .stream()
                    .collect(Collectors.toMap(
                            User::getId,
                            User::getFullName,
                            (a, b) -> a
                    ));

            Map<Long, CaseStudy> caseById = caseStudyRepository
                    .findAllByIdWithDetails(caseIds)
                    .stream()
                    .collect(Collectors.toMap(
                            CaseStudy::getId,
                            c -> c,
                            (a, b) -> a
                    ));

            return submissions.stream()
                    .sorted((a, b) -> {
                        if (a.getSubmittedAt() == null) return 1;
                        if (b.getSubmittedAt() == null) return -1;
                        return b.getSubmittedAt().compareTo(a.getSubmittedAt());
                    })
                    .map(s -> {
                        FacultySubmissionDTO dto = new FacultySubmissionDTO();
                        dto.setSubmissionId(s.getId());
                        dto.setCaseId(s.getCaseId());
                        dto.setSolutionText(s.getSolutionText());
                        dto.setExecutiveSummary(s.getExecutiveSummary());
                        dto.setSituationAnalysis(s.getSituationAnalysis());
                        dto.setRootCauseAnalysis(s.getRootCauseAnalysis());
                        dto.setProposedSolution(s.getProposedSolution());
                        dto.setImplementationPlan(s.getImplementationPlan());
                        dto.setRisksAndConstraints(s.getRisksAndConstraints());
                        dto.setConclusion(s.getConclusion());
                        dto.setGithubLink(s.getGithubLink());
                        dto.setPdfFileName(s.getPdfFileName());
                        dto.setPdfFilePath(s.getPdfFilePath());
                        dto.setSelfRating(s.getSelfRating());
                        dto.setMarksAwarded(s.getMarksAwarded());
                        dto.setFacultyFeedback(s.getFacultyFeedback());
                        dto.setSubmittedAt(s.getSubmittedAt());
                        dto.setStatus(s.getStatus());
                        dto.setStudentName(
                                studentNameById.getOrDefault(
                                        s.getStudentId(), "Unknown Student"
                                )
                        );

                        CaseStudy cs = caseById.get(s.getCaseId());
                        if (cs != null) {
                            dto.setCaseTitle(cs.getTitle());
                            dto.setCourseId(
                                    cs.getCourse() != null ? cs.getCourse().getId() : null
                            );
                            dto.setCreatedByName(
                                    cs.getCreatedBy() != null
                                            ? cs.getCreatedBy().getFullName()
                                            : null
                            );
                        } else {
                            dto.setCaseTitle("Unknown Case");
                        }
                        return dto;
                    })
                    .toList();

        } catch (Exception e) {
            log.error("Error loading faculty submissions: {}", e.getMessage(), e);
            return List.of();
        }
    }
}
