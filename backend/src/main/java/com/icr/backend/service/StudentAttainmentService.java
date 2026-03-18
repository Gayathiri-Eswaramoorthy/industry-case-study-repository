package com.icr.backend.service;

import com.icr.backend.dto.StudentCoAttainmentDTO;
import com.icr.backend.dto.StudentPoAttainmentDTO;

import java.util.List;

public interface StudentAttainmentService {
    List<StudentCoAttainmentDTO> getCoAttainment(Long studentId);

    List<StudentPoAttainmentDTO> getPoAttainment(Long studentId);
}
