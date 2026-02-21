package com.icr.backend.controller;

import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.icr.backend.dto.response.DashboardStatsResponse;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 🔒 Only ADMIN can view all users
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {

        PageResponse<UserResponse> response =
                userService.getAllUsers(page, size);

        return ApiResponse.<PageResponse<UserResponse>>builder()
                .success(true)
                .message("Users fetched successfully")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // 🔒 Only ADMIN can view user by id
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // 🔒 Only ADMIN can delete
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "User deleted successfully";
    }

    // 🔐 Any authenticated user can test
    @GetMapping("/test")
    @PreAuthorize("isAuthenticated()")
    public String test() {
        return "Authenticated Successfully";
    }

    @GetMapping("/dashboard/stats")
    public DashboardStatsResponse getDashboardStats() {
        return userService.getDashboardStats();
    }


}
