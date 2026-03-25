package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.casestudy.entity.CaseSubmission;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class FacultySubmissionServiceImpl implements FacultySubmissionService {

    private final CaseSubmissionRepository submissionRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FacultySubmissionDTO> getFacultySubmissions() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return List.of();

            String email = auth.getName();
            if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) return List.of();

            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Faculty not found"));

            List<CaseSubmission> submissions = submissionRepository
                    .findAllByStudentFacultyId(faculty.getId());

            return submissions.stream().map(s -> {
                String studentName = userRepository.findById(s.getStudentId())
                        .map(User::getFullName)
                        .orElse("Unknown Student");
                String caseTitle = caseStudyRepository.findById(s.getCaseId())
                        .map(c -> c.getTitle())
                        .orElse("Unknown Case");
                return new FacultySubmissionDTO(
                        s.getId(),
                        studentName,
                        caseTitle,
                        s.getSubmittedAt(),
                        s.getStatus()
                );
            }).toList();

        } catch (Exception e) {
            log.error("Error loading faculty submissions", e);
            return List.of();
        }
    }
}
