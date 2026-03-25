package com.icr.backend.casestudy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseExhibitDTO {
    private Long id;
    private String title;
    private String description;
    private String originalFileName;
    private String fileType;
    private Integer displayOrder;
}
