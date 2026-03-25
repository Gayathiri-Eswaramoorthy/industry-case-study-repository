package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyPoAttainmentResponse {

    private Long poId;
    private String poCode;
    private String poDescription;
    private String status;
    private List<String> mappedCOs;
}
