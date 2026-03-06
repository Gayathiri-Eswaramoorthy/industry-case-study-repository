package com.icr.backend.service;

import com.icr.backend.dto.ActivityItemResponse;

import java.util.List;

public interface ActivityService {

    List<ActivityItemResponse> getStudentActivity(int limit);

    List<ActivityItemResponse> getFacultyActivity(int limit, Long courseId);

    List<ActivityItemResponse> getAdminActivity(int limit);
}
