package com.icr.backend.casestudy.dto;

import com.icr.backend.enums.CaseStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CaseStatusUpdateRequest {
    private CaseStatus status;
}
