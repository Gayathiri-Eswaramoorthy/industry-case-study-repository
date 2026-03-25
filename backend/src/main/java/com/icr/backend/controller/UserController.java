package com.icr.backend.controller;

import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.dto.response.DashboardStatsResponse;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.dto.response.UserPublicDTO;
import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.dto.response.UserStatsResponse;
import com.icr.backend.entity.User;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping
    public ApiResponse<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            Authentication authentication
    ) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page must be >= 0");
        }
        if (size <= 0 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "size must be between 1 and 100");
        }

        if ("FACULTY".equalsIgnoreCase(role) && !isAdmin(authentication)) {
            List<UserPublicDTO> content = userService.getApprovedFacultyPublic();
            return ApiResponse.<PageResponse<UserPublicDTO>>builder()
                    .success(true)
                    .message("Faculty fetched successfully")
                    .data(PageResponse.<UserPublicDTO>builder()
                            .content(content)
                            .page(0)
                            .size(content.size())
                            .totalElements(content.size())
                            .totalPages(1)
                            .last(true)
                            .build())
                    .timestamp(LocalDateTime.now())
                    .build();
        }

        if (!isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        PageResponse<UserResponse> response = userService.getAllUsers(page, size, role);
        return ApiResponse.<PageResponse<UserResponse>>builder()
                .success(true)
                .message("Users fetched successfully")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @GetMapping("/faculty")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getAllFaculty() {
        return userService.getAllFaculty();
    }

    @DeleteMapping("/{id}")
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

    @GetMapping("/test")
    public String test() {
        return "Authenticated Successfully";
    }

    @GetMapping("/dashboard/stats")
    public DashboardStatsResponse getDashboardStats() {
        return userService.getDashboardStats();
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserStatsResponse> getUserStats() {
        return ApiResponse.<UserStatsResponse>builder()
                .success(true)
                .message("User stats fetched successfully")
                .data(userService.getUserStats())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
