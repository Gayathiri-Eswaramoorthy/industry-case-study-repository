package com.icr.backend.repository.projection;

import com.icr.backend.casestudy.enums.SubmissionStatus;

public interface FacultySubmissionStatusCountProjection {

    Long getFacultyId();

    SubmissionStatus getStatus();

    Long getTotal();
}
