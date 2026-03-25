package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.SubmissionGroupMember;
import com.icr.backend.casestudy.enums.MemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionGroupMemberRepository extends JpaRepository<SubmissionGroupMember, Long> {

    List<SubmissionGroupMember> findByGroupId(Long groupId);

    Optional<SubmissionGroupMember> findByGroupIdAndStudentId(Long groupId, Long studentId);

    List<SubmissionGroupMember> findByStudentIdAndGroup_CaseStudyId(Long studentId, Long caseId);

    boolean existsByGroupIdAndStudentIdAndStatus(Long groupId, Long studentId, MemberStatus status);

    long countByGroupIdAndStatus(Long groupId, MemberStatus status);
}
