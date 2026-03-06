package com.icr.backend.outcome.service;

import com.icr.backend.outcome.dto.ProgramOutcomeRequest;
import com.icr.backend.outcome.dto.ProgramOutcomeResponse;

import java.util.List;

public interface ProgramOutcomeService {

    ProgramOutcomeResponse createProgramOutcome(ProgramOutcomeRequest request);

    List<ProgramOutcomeResponse> getAllProgramOutcomes();
}