package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FacultyAnalyticsDTO {

    private long totalSubmissions;
    private long evaluatedSubmissions;
    private long pendingSubmissions;
    private double evaluationCompletionRate;
    private List<FacultyCaseSubmissionCountDTO> submissionsPerCase;
}
