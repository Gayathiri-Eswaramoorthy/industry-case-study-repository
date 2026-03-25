package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.MemberStatus;
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
public class GroupMemberDTO {

    private Long id;
    private Long studentId;
    private String studentName;
    private boolean isLeader;
    private MemberStatus status;
}
