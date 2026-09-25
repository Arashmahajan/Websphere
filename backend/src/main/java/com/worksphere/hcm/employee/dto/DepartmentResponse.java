package com.worksphere.hcm.employee.dto;

public record DepartmentResponse(
    String id,
    String code,
    String name,
    String headEmployeeId,
    Integer headcountTarget
) {}
