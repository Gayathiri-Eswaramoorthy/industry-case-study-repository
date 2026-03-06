package com.icr.backend.outcome.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "program_outcomes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgramOutcome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;
}