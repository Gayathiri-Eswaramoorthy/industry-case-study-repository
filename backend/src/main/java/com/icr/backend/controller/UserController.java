package com.icr.backend.controller;

import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.entity.User;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.icr.backend.dto.response.DashboardStatsResponse;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    // 🔒 Only ADMIN can view all users
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String role
    ) {

        PageResponse<UserResponse> response =
                userService.getAllUsers(page, size, role);

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
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Authenticated user not found"));

        if (id.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account");
        }

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
