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
public class CoScoreRequest {

    private Long coId;
    private Integer score;
    private Integer maxScore;
}
