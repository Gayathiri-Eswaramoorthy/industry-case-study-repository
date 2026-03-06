package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseSubmissionResponse;
import com.icr.backend.casestudy.dto.FacultyCaseSubmissionDTO;
import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.casestudy.dto.SubmissionRequest;

import java.util.List;

public interface CaseSubmissionService {

    CaseSubmissionResponse submitSolution(SubmissionRequest request);

    CaseSubmissionResponse evaluateSubmission(Long submissionId,
                                              Integer marksAwarded,
                                              String facultyFeedback);

    List<CaseSubmissionResponse> getSubmissionsByCase(Long caseId);

    List<CaseSubmissionResponse> getMySubmissions();

    List<FacultyCaseSubmissionDTO> getFacultySubmissionsByCase(Long caseId);

    FacultySubmissionDTO getFacultySubmission(Long submissionId);
}
