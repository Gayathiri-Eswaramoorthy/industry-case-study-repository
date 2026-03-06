package com.icr.backend.exception;

public class DuplicateSubmissionException extends RuntimeException {

    public DuplicateSubmissionException(String message) {
        super(message);
    }
}
