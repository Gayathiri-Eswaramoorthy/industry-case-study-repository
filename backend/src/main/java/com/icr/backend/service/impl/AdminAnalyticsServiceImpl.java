package com.icr.backend.service.impl;

import com.icr.backend.dto.AdminCoAttainmentSummaryResponse;
import com.icr.backend.service.AttainmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsServiceImpl {

    private final AttainmentService attainmentService;

    public List<AdminCoAttainmentSummaryResponse> getCoAttainmentSummary() {
        // FIXED: Admin CO analytics now uses unified attainment summary computation.
        return attainmentService.getPlatformCoAttainmentSummary();
    }

    public String exportCoAttainmentCsv() {
        List<AdminCoAttainmentSummaryResponse> summaries = getCoAttainmentSummary();
        StringBuilder csv = new StringBuilder();
        csv.append("CO Code,CO Description,Total Students,Attained,Partial,Not Attained,Attainment Rate %\n");
        for (AdminCoAttainmentSummaryResponse row : summaries) {
            csv.append(escape(row.getCoCode())).append(",")
                    .append(escape(row.getCoDescription())).append(",")
                    .append(row.getTotalStudents()).append(",")
                    .append(row.getAttainedCount()).append(",")
                    .append(row.getPartialCount()).append(",")
                    .append(row.getNotAttainedCount()).append(",")
                    .append(row.getAttainmentRate()).append("\n");
        }
        return csv.toString();
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }
}
