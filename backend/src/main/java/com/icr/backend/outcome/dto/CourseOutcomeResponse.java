package com.icr.backend.outcome.dto;

import lombok.*;

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
    private String courseCode;
}