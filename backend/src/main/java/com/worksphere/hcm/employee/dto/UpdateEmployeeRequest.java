package com.worksphere.hcm.employee.dto;

import com.worksphere.hcm.employee.entity.EmploymentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateEmployeeRequest(
    @NotBlank(message = "First name is mandatory")
    String firstName,

    @NotBlank(message = "Last name is mandatory")
    String lastName,

    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email must be a valid RFC 5322 format")
    String email,

    String phone,
    LocalDate dateOfBirth,
    LocalDate dateOfJoining,

    @NotBlank(message = "Department ID is mandatory")
    String departmentId,

    String managerId,

    @NotBlank(message = "Location ID is mandatory")
    String locationId,

    @NotBlank(message = "Job title is mandatory")
    String jobTitle,

    String level,

    @NotNull(message = "Employment type is mandatory")
    EmploymentType employmentType,

    BigDecimal ctcAnnual,
    String bankAccountReference,
    String ifscCode,
    String panNumber,
    String uanNumber,
    String avatarUrl,
    Long version
) {}
