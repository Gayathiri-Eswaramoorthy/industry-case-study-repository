package com.icr.backend.outcome.service.impl;

import com.icr.backend.exception.DuplicateResourceException;
import com.icr.backend.outcome.dto.ProgramOutcomeRequest;
import com.icr.backend.outcome.dto.ProgramOutcomeResponse;
import com.icr.backend.outcome.entity.ProgramOutcome;
import com.icr.backend.outcome.repository.ProgramOutcomeRepository;
import com.icr.backend.outcome.service.ProgramOutcomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgramOutcomeServiceImpl implements ProgramOutcomeService {

    private final ProgramOutcomeRepository programOutcomeRepository;

    @Override
    public ProgramOutcomeResponse createProgramOutcome(ProgramOutcomeRequest request) {

        if (programOutcomeRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Program Outcome with this code already exists");
        }

        ProgramOutcome programOutcome = ProgramOutcome.builder()
                .code(request.getCode())
                .description(request.getDescription())
                .build();

        ProgramOutcome saved = programOutcomeRepository.save(programOutcome);

        return mapToResponse(saved);
    }

    @Override
    public List<ProgramOutcomeResponse> getAllProgramOutcomes() {
        return programOutcomeRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ProgramOutcomeResponse mapToResponse(ProgramOutcome po) {
        return ProgramOutcomeResponse.builder()
                .id(po.getId())
                .code(po.getCode())
                .description(po.getDescription())
                .build();
    }
}
