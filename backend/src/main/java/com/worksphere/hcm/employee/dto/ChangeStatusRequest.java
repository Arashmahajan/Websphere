package com.worksphere.hcm.employee.dto;

import com.worksphere.hcm.employee.entity.EmployeeStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeStatusRequest(
    @NotNull(message = "Target status is mandatory")
    EmployeeStatus status,
    String reason,
    Long version
) {}
