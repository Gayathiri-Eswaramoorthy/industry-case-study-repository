package com.icr.backend.service;

import com.icr.backend.dto.DashboardStatsResponse;

import java.util.Map;

public interface AnalyticsService {

    DashboardStatsResponse getDashboardStats();

    Map<String, Long> getUserAnalytics();

    Map<String, Long> getCaseAnalytics();

    Map<String, Long> getSubmissionAnalytics();
}
