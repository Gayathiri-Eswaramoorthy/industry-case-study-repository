package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityItemResponse {
    private String id;
    private String type;
    private String message;
    private LocalDateTime timestamp;
}
