package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CreateGroupRequest;
import com.icr.backend.casestudy.dto.SubmissionGroupDTO;

import java.util.List;

public interface SubmissionGroupService {

    SubmissionGroupDTO createGroup(Long caseId, CreateGroupRequest request);

    SubmissionGroupDTO joinGroup(Long caseId, Long groupId);

    SubmissionGroupDTO approveMember(Long caseId, Long groupId, Long studentId);

    SubmissionGroupDTO rejectMember(Long caseId, Long groupId, Long studentId);

    SubmissionGroupDTO getMyGroup(Long caseId);

    List<SubmissionGroupDTO> getAllGroupsForCase(Long caseId);

    void leaveGroup(Long caseId, Long groupId);
}
