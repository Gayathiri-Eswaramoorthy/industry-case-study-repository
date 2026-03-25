package com.icr.backend.repository.projection;

import com.icr.backend.casestudy.enums.SubmissionStatus;

public interface StudentSubmissionStatusCountProjection {

    Long getStudentId();

    SubmissionStatus getStatus();

    Long getTotal();
}
