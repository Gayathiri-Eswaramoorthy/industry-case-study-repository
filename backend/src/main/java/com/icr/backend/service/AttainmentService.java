package com.icr.backend.service;

import com.icr.backend.dto.AdminCoAttainmentSummaryResponse;
import com.icr.backend.dto.MyCoAttainmentResponse;
import com.icr.backend.dto.MyPoAttainmentResponse;

import java.util.List;

public interface AttainmentService {

    List<MyCoAttainmentResponse> getStudentCoAttainment(Long studentId);

    List<MyPoAttainmentResponse> getStudentPoAttainment(Long studentId);

    List<AdminCoAttainmentSummaryResponse> getPlatformCoAttainmentSummary();
}
