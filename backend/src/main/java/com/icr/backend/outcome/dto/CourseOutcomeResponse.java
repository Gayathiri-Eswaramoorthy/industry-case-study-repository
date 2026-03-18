package com.icr.backend.outcome.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CourseOutcomeResponse {

    private Long id;
    private String code;
    private String description;
    private Long courseId;
    private List<Long> mappedPoIds;
}
