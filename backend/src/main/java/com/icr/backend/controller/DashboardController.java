package com.icr.backend.controller;

import com.icr.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.icr.backend.dto.response.DashboardStatsResponse;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;

    @GetMapping("/stats")
    public DashboardStatsResponse getDashboardStats() {

        long totalUsers = userRepository.countByDeletedFalse();

        long totalAdmins = userRepository.countByRole_NameAndDeletedFalse("ADMIN");
        long totalFaculty = userRepository.countByRole_NameAndDeletedFalse("FACULTY");
        long totalStudents = userRepository.countByRole_NameAndDeletedFalse("STUDENT");

        return new DashboardStatsResponse(
                totalUsers,
                totalAdmins,
                totalFaculty,
                totalStudents
        );
    }
}
