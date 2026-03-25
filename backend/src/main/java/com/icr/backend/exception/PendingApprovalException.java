package com.icr.backend.exception;

import lombok.Getter;

@Getter
public class PendingApprovalException extends RuntimeException {

    private final String pendingType;

    public PendingApprovalException(String message, String pendingType) {
        super(message);
        this.pendingType = pendingType;
    }
}
