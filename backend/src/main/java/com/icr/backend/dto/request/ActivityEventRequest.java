package com.icr.backend.dto.request;

import com.icr.backend.casestudy.enums.ActivityEvent;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActivityEventRequest {

    @NotNull(message = "Event is required")
    private ActivityEvent event;
}
