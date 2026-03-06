package com.icr.backend.outcome.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgramOutcomeRequest {

    private String code;
    private String description;
}