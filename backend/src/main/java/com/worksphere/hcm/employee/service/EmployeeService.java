package com.worksphere.hcm.employee.service;

import com.worksphere.hcm.employee.dto.*;
import com.worksphere.hcm.employee.entity.EmployeeStatus;
import com.worksphere.hcm.employee.entity.EmploymentType;

import java.util.List;

public interface EmployeeService {

    PageResponse<EmployeeResponse> getEmployees(
        int page,
        int size,
        String sort,
        String direction,
        String search,
        String departmentId,
        String locationId,
        EmployeeStatus status,
        EmploymentType employmentType
    );

    EmployeeResponse getEmployeeById(String id);

    EmployeeResponse createEmployee(CreateEmployeeRequest request);

    EmployeeResponse updateEmployee(String id, UpdateEmployeeRequest request);

    EmployeeResponse changeEmployeeStatus(String id, ChangeStatusRequest request);

    List<EmployeeResponse> getEligibleManagers();

    List<DepartmentResponse> getDepartments();

    List<LocationResponse> getLocations();
}
