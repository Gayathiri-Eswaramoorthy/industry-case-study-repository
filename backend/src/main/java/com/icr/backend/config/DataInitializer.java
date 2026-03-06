package com.icr.backend.config;

import com.icr.backend.entity.Role;
import com.icr.backend.enums.RoleType;
import com.icr.backend.repository.RoleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initRoles() {
        normalizeLegacyRoleNames();

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

    private void normalizeLegacyRoleNames() {
        normalizeRoleName("ROLE_ADMIN", "ADMIN");
        normalizeRoleName("ROLE_FACULTY", "FACULTY");
        normalizeRoleName("ROLE_STUDENT", "STUDENT");
    }

    private void normalizeRoleName(String legacyValue, String normalizedValue) {
        jdbcTemplate.update(
                "UPDATE roles SET name = ? WHERE name = ?",
                normalizedValue,
                legacyValue
        );
        jdbcTemplate.update(
                "DELETE r1 FROM roles r1 " +
                        "JOIN roles r2 ON r1.name = r2.name AND r1.id > r2.id " +
                        "WHERE r1.name = ?",
                normalizedValue
        );
    }
}
