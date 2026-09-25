package com.worksphere.hcm.employee.dto;

public record LocationResponse(
    String id,
    String code,
    String name,
    String city,
    String state,
    String country,
    String address
) {}
