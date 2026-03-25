package com.icr.backend.casestudy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscussionQuestionDTO {

    private Long id;
    private String questionText;
    private Integer questionOrder;
    private Integer marks;
    private Boolean isRequired;
    private Long mappedCoId;
}
