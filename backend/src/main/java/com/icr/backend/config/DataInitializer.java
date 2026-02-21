package com.icr.backend.config;

import com.icr.backend.entity.Role;
import com.icr.backend.enums.RoleType;
import com.icr.backend.repository.RoleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final RoleRepository roleRepository;

    @PostConstruct
    public void initRoles() {

        for (RoleType roleType : RoleType.values()) {

            roleRepository.findByName(roleType)
                    .orElseGet(() ->
                            roleRepository.save(
                                    Role.builder()
                                            .name(roleType)
                                            .build()
                            )
                    );
        }
    }
}
