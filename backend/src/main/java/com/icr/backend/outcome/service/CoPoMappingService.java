package com.icr.backend.outcome.service;

import java.util.List;

public interface CoPoMappingService {

    void mapCoToPo(Long coId, Long poId);

    List<Long> getPoIdsForCo(Long coId);

    void updatePoMappingsForCo(Long coId, List<Long> poIds);
}
