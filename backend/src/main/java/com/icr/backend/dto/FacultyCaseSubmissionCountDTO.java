package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FacultyCaseSubmissionCountDTO {

    private String caseTitle;
    private long count;
}
