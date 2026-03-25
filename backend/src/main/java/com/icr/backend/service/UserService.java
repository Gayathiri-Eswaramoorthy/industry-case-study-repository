package com.icr.backend.service;

import com.icr.backend.dto.request.CreateUserRequest;
import com.icr.backend.dto.request.ResetPasswordRequest;
import com.icr.backend.dto.response.FacultyStudentAnalyticsResponse;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.dto.response.UserPublicDTO;
import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.dto.response.DashboardStatsResponse;
import com.icr.backend.dto.response.UserStatsResponse;

import java.util.List;


public interface UserService {

    PageResponse<UserResponse> getAllUsers(int page, int size, String role);
    UserStatsResponse getUserStats();

    UserResponse getUserById(Long id);

    void deleteUser(Long id);

    DashboardStatsResponse getDashboardStats();

    UserResponse createUser(CreateUserRequest request);

    void resetPassword(Long userId, ResetPasswordRequest request);

    void reassignStudent(Long studentId, Long newFacultyId);
    PageResponse<UserResponse> getStudentsByFaculty(Long facultyId, String status, int page, int size);
    List<FacultyStudentAnalyticsResponse> getFacultyStudentAnalytics();
    List<UserPublicDTO> getApprovedFacultyPublic();

    List<UserResponse> getAllFaculty();

    List<UserResponse> getPendingFaculty();

    UserResponse approveFaculty(Long facultyId);

    UserResponse rejectFaculty(Long facultyId, String reason);

    List<UserResponse> getPendingStudents();
    List<UserResponse> getAssignedStudents();

    UserResponse approveStudent(Long studentId);

    UserResponse rejectStudent(Long studentId, String reason);

    UserResponse getRegistrationStatus(String email);

}
