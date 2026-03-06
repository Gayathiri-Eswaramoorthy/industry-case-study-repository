package com.icr.backend.casestudy.service;

import java.util.List;

public interface CaseCoMappingService {

    void mapCaseToCo(Long caseId, Long coId);

    List<Long> getCoIdsForCase(Long caseId);
}