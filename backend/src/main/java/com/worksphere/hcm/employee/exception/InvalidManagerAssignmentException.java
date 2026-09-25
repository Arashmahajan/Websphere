package com.worksphere.hcm.employee.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidManagerAssignmentException extends RuntimeException {
    public InvalidManagerAssignmentException(String message) {
        super(message);
    }
}
