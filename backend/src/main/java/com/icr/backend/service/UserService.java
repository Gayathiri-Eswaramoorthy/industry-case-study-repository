package com.icr.backend.service;

import com.icr.backend.dto.request.CreateUserRequest;
import com.icr.backend.dto.request.ResetPasswordRequest;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.dto.response.DashboardStatsResponse;


public interface UserService {

    PageResponse<UserResponse> getAllUsers(int page, int size, String role);

    UserResponse getUserById(Long id);

    void deleteUser(Long id);

    DashboardStatsResponse getDashboardStats();

    UserResponse createUser(CreateUserRequest request);

    void resetPassword(Long userId, ResetPasswordRequest request);

}
