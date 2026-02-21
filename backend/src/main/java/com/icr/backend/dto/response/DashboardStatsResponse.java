package com.icr.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsResponse {

    private long totalUsers;
    private long totalAdmins;
    private long totalFaculty;
    private long totalStudents;
}
