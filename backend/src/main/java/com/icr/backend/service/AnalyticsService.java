package com.icr.backend.service;

import com.icr.backend.dto.DashboardStatsResponse;
import com.icr.backend.dto.CoAttainmentSummaryDTO;
import com.icr.backend.dto.TopCaseAnalyticsDTO;

import java.util.List;
import java.util.Map;

public interface AnalyticsService {

    DashboardStatsResponse getDashboardStats();

    Map<String, Long> getUserAnalytics();

    Map<String, Long> getCaseAnalytics();

    Map<String, Long> getSubmissionAnalytics();

    List<CoAttainmentSummaryDTO> getCoAttainmentSummary();

    List<TopCaseAnalyticsDTO> getTopCases();
}
