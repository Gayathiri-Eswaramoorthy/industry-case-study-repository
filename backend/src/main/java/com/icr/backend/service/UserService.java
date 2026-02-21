package com.icr.backend.service;

import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.dto.response.DashboardStatsResponse;


public interface UserService {

    PageResponse<UserResponse> getAllUsers(int page, int size);

    UserResponse getUserById(Long id);

    void deleteUser(Long id);

    DashboardStatsResponse getDashboardStats();

}
