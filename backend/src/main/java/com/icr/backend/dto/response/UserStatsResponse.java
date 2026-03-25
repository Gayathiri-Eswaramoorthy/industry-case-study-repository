package com.icr.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserStatsResponse {

    private long total;
    private long faculty;
    private long student;
    private long admin;
}
