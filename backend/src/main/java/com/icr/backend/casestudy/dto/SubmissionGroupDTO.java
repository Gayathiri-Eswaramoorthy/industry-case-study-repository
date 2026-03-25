package com.icr.backend.casestudy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionGroupDTO {

    private Long id;
    private Long caseId;
    private String groupName;
    private LocalDateTime createdAt;
    private List<GroupMemberDTO> members;
}
