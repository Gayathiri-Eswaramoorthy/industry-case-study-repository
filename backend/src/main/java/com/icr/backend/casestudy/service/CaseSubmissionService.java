package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseSubmissionResponse;
import com.icr.backend.casestudy.dto.FacultyCaseSubmissionDTO;
import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.casestudy.dto.SubmissionEvaluationRequest;
import com.icr.backend.casestudy.dto.SubmissionRequest;
import com.icr.backend.casestudy.entity.SubmissionCoScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CaseSubmissionService {

    CaseSubmissionResponse submitSolution(SubmissionRequest request, MultipartFile pdfFile);

    CaseSubmissionResponse evaluateSubmission(Long submissionId,
                                              SubmissionEvaluationRequest request);

    List<CaseSubmissionResponse> getSubmissionsByCase(Long caseId);

    Page<CaseSubmissionResponse> getMySubmissions(Pageable pageable);

    List<FacultyCaseSubmissionDTO> getFacultySubmissionsByCase(Long caseId);

    FacultySubmissionDTO getFacultySubmission(Long submissionId);

    List<SubmissionCoScore> getCoScores(Long submissionId);
}
