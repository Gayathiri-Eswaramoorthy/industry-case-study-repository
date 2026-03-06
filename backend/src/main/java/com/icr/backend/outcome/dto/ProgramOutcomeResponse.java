package com.icr.backend.outcome.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgramOutcomeResponse {

    private Long id;
    private String code;
    private String description;
}