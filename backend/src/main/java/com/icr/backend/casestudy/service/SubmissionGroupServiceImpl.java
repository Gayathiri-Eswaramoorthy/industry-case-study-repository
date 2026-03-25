package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CreateGroupRequest;
import com.icr.backend.casestudy.dto.GroupMemberDTO;
import com.icr.backend.casestudy.dto.SubmissionGroupDTO;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.SubmissionGroup;
import com.icr.backend.casestudy.entity.SubmissionGroupMember;
import com.icr.backend.casestudy.enums.MemberStatus;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.SubmissionGroupMemberRepository;
import com.icr.backend.casestudy.repository.SubmissionGroupRepository;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionGroupServiceImpl implements SubmissionGroupService {

    private final SubmissionGroupRepository submissionGroupRepository;
    private final SubmissionGroupMemberRepository submissionGroupMemberRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public SubmissionGroupDTO createGroup(Long caseId, CreateGroupRequest request) {
        User student = getAuthenticatedStudent();
        CaseStudy caseStudy = getPublishedGroupEnabledCase(caseId);
        ensureNoApprovedMembershipForCase(student.getId(), caseId);

        String groupName = request != null && request.getGroupName() != null
                ? request.getGroupName().trim()
                : "";
        if (groupName.isBlank()) {
            throw new IllegalArgumentException("Group name is required");
        }

        SubmissionGroup group = submissionGroupRepository.save(
                SubmissionGroup.builder()
                        .caseStudy(caseStudy)
                        .groupName(groupName)
                        .build()
        );

        submissionGroupMemberRepository.save(
                SubmissionGroupMember.builder()
                        .group(group)
                        .student(student)
                        .isLeader(true)
                        .status(MemberStatus.APPROVED)
                        .build()
        );
        return mapToDTO(group);
    }

    @Override
    @Transactional
    public SubmissionGroupDTO joinGroup(Long caseId, Long groupId) {
        User student = getAuthenticatedStudent();
        CaseStudy caseStudy = caseStudyRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + caseId));
        if (!Boolean.TRUE.equals(caseStudy.isGroupSubmissionEnabled())) {
            throw new IllegalStateException("Group submissions are not enabled for this case");
        }

        SubmissionGroup group = getGroupForCase(caseId, groupId);
        ensureNoApprovedMembershipForCase(student.getId(), caseId);

        if (submissionGroupMemberRepository.findByGroupIdAndStudentId(groupId, student.getId()).isPresent()) {
            throw new IllegalStateException("You have already requested to join this group");
        }

        if (caseStudy.getMaxGroupSize() != null) {
            long approvedCount = submissionGroupMemberRepository.countByGroupIdAndStatus(groupId, MemberStatus.APPROVED);
            if (approvedCount >= caseStudy.getMaxGroupSize()) {
                throw new IllegalStateException("Group is full");
            }
        }

        submissionGroupMemberRepository.save(
                SubmissionGroupMember.builder()
                        .group(group)
                        .student(student)
                        .isLeader(false)
                        .status(MemberStatus.PENDING)
                        .build()
        );
        return mapToDTO(group);
    }

    @Override
    @Transactional
    public SubmissionGroupDTO approveMember(Long caseId, Long groupId, Long studentId) {
        User leader = getAuthenticatedStudent();
        ensureLeaderForGroup(groupId, leader.getId());

        SubmissionGroupMember member = submissionGroupMemberRepository
                .findByGroupIdAndStudentId(groupId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Group member not found"));
        if (member.getStatus() != MemberStatus.PENDING) {
            throw new IllegalStateException("Only pending members can be approved");
        }

        SubmissionGroup group = getGroupForCase(caseId, groupId);
        Integer maxGroupSize = group.getCaseStudy() != null ? group.getCaseStudy().getMaxGroupSize() : null;
        if (maxGroupSize != null) {
            long approvedCount = submissionGroupMemberRepository.countByGroupIdAndStatus(groupId, MemberStatus.APPROVED);
            if (approvedCount >= maxGroupSize) {
                throw new IllegalStateException("Group is full");
            }
        }

        member.setStatus(MemberStatus.APPROVED);
        submissionGroupMemberRepository.save(member);
        return mapToDTO(group);
    }

    @Override
    @Transactional
    public SubmissionGroupDTO rejectMember(Long caseId, Long groupId, Long studentId) {
        User leader = getAuthenticatedStudent();
        SubmissionGroup group = getGroupForCase(caseId, groupId);
        ensureLeaderForGroup(groupId, leader.getId());

        SubmissionGroupMember member = submissionGroupMemberRepository
                .findByGroupIdAndStudentId(groupId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Group member not found"));
        member.setStatus(MemberStatus.REJECTED);
        submissionGroupMemberRepository.save(member);
        return mapToDTO(group);
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionGroupDTO getMyGroup(Long caseId) {
        User student = getAuthenticatedStudent();
        List<SubmissionGroupMember> memberships = submissionGroupMemberRepository
                .findByStudentIdAndGroup_CaseStudyId(student.getId(), caseId);
        if (memberships.isEmpty()) {
            return null;
        }

        SubmissionGroupMember approved = memberships.stream()
                .filter(member -> member.getStatus() == MemberStatus.APPROVED)
                .findFirst()
                .orElse(null);
        if (approved != null) {
            return mapToDTO(approved.getGroup());
        }

        SubmissionGroupMember pending = memberships.stream()
                .filter(member -> member.getStatus() == MemberStatus.PENDING)
                .findFirst()
                .orElse(null);
        return pending != null ? mapToDTO(pending.getGroup()) : null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionGroupDTO> getAllGroupsForCase(Long caseId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean allowed = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_FACULTY".equals(a.getAuthority()) || "ROLE_ADMIN".equals(a.getAuthority()));
        if (!allowed) {
            throw new AccessDeniedException("Only faculty and admin can view groups for a case");
        }

        return submissionGroupRepository.findByCaseStudyId(caseId).stream()
                .sorted(Comparator.comparing(SubmissionGroup::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    @Transactional
    public void leaveGroup(Long caseId, Long groupId) {
        User student = getAuthenticatedStudent();
        SubmissionGroup group = getGroupForCase(caseId, groupId);

        SubmissionGroupMember member = submissionGroupMemberRepository
                .findByGroupIdAndStudentId(groupId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("You are not part of this group"));

        boolean wasLeader = member.isLeader() && member.getStatus() == MemberStatus.APPROVED;
        submissionGroupMemberRepository.delete(member);

        List<SubmissionGroupMember> remainingMembers = submissionGroupMemberRepository.findByGroupId(groupId);
        List<SubmissionGroupMember> remainingApproved = remainingMembers.stream()
                .filter(m -> m.getStatus() == MemberStatus.APPROVED)
                .toList();

        if (wasLeader) {
            if (!remainingApproved.isEmpty()) {
                SubmissionGroupMember nextLeader = remainingApproved.get(0);
                nextLeader.setLeader(true);
                submissionGroupMemberRepository.save(nextLeader);
                return;
            }

            if (!remainingMembers.isEmpty()) {
                submissionGroupMemberRepository.deleteAll(remainingMembers);
            }
            submissionGroupRepository.delete(group);
        }
    }

    private void ensureLeaderForGroup(Long groupId, Long studentId) {
        SubmissionGroupMember me = submissionGroupMemberRepository.findByGroupIdAndStudentId(groupId, studentId)
                .orElseThrow(() -> new AccessDeniedException("You are not part of this group"));
        if (!me.isLeader() || me.getStatus() != MemberStatus.APPROVED) {
            throw new AccessDeniedException("Only approved group leader can perform this action");
        }
    }

    private void ensureNoApprovedMembershipForCase(Long studentId, Long caseId) {
        boolean hasApproved = submissionGroupMemberRepository.findByStudentIdAndGroup_CaseStudyId(studentId, caseId)
                .stream()
                .anyMatch(member -> member.getStatus() == MemberStatus.APPROVED);
        if (hasApproved) {
            throw new IllegalStateException("You are already in an approved group for this case");
        }
    }

    private CaseStudy getPublishedGroupEnabledCase(Long caseId) {
        CaseStudy caseStudy = caseStudyRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + caseId));
        if (caseStudy.getStatus() != CaseStatus.PUBLISHED) {
            throw new IllegalStateException("Group can be created only for published cases");
        }
        if (!Boolean.TRUE.equals(caseStudy.isGroupSubmissionEnabled())) {
            throw new IllegalStateException("Group submissions are not enabled for this case");
        }
        return caseStudy;
    }

    private SubmissionGroup getGroupForCase(Long caseId, Long groupId) {
        SubmissionGroup group = submissionGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));
        if (group.getCaseStudy() == null || !group.getCaseStudy().getId().equals(caseId)) {
            throw new ResourceNotFoundException("Group does not belong to this case");
        }
        return group;
    }

    private User getAuthenticatedStudent() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("User not authenticated");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == null || user.getRole().getName() != RoleType.STUDENT) {
            throw new AccessDeniedException("Only students can perform this action");
        }
        return user;
    }

    private SubmissionGroupDTO mapToDTO(SubmissionGroup group) {
        List<GroupMemberDTO> members = submissionGroupMemberRepository.findByGroupId(group.getId()).stream()
                .map(member -> GroupMemberDTO.builder()
                        .id(member.getId())
                        .studentId(member.getStudent() != null ? member.getStudent().getId() : null)
                        .studentName(member.getStudent() != null ? member.getStudent().getFullName() : null)
                        .isLeader(member.isLeader())
                        .status(member.getStatus())
                        .build())
                .toList();

        return SubmissionGroupDTO.builder()
                .id(group.getId())
                .caseId(group.getCaseStudy() != null ? group.getCaseStudy().getId() : null)
                .groupName(group.getGroupName())
                .createdAt(group.getCreatedAt())
                .members(members)
                .build();
    }
}
