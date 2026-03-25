package com.icr.backend.dto;

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
public class MyCoAttainmentResponse {

    private Long coId;
    private String coCode;
    private String coDescription;
    private double percentage;
    private String status;
}
