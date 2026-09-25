package com.worksphere.hcm.employee.controller;

import com.worksphere.hcm.employee.dto.*;
import com.worksphere.hcm.employee.entity.EmployeeStatus;
import com.worksphere.hcm.employee.entity.EmploymentType;
import com.worksphere.hcm.employee.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('EMPLOYEE_READ', 'ROLE_SYSTEM_ADMIN', 'ROLE_HR_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE')")
    public ResponseEntity<PageResponse<EmployeeResponse>> getEmployees(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "lastName") String sort,
        @RequestParam(defaultValue = "asc") String direction,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String departmentId,
        @RequestParam(required = false) String locationId,
        @RequestParam(required = false) EmployeeStatus status,
        @RequestParam(required = false) EmploymentType employmentType
    ) {
        PageResponse<EmployeeResponse> response = employeeService.getEmployees(
            page, size, sort, direction, search, departmentId, locationId, status, employmentType
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE_READ', 'ROLE_SYSTEM_ADMIN', 'ROLE_HR_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE')")
    public ResponseEntity<EmployeeResponse> getEmployeeById(@PathVariable String id) {
        EmployeeResponse response = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('EMPLOYEE_WRITE', 'ROLE_SYSTEM_ADMIN', 'ROLE_HR_ADMIN')")
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse response = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE_WRITE', 'ROLE_SYSTEM_ADMIN', 'ROLE_HR_ADMIN')")
    public ResponseEntity<EmployeeResponse> updateEmployee(
        @PathVariable String id,
        @Valid @RequestBody UpdateEmployeeRequest request
    ) {
        EmployeeResponse response = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE_STATUS_CHANGE', 'EMPLOYEE_WRITE', 'ROLE_SYSTEM_ADMIN', 'ROLE_HR_ADMIN')")
    public ResponseEntity<EmployeeResponse> changeEmployeeStatus(
        @PathVariable String id,
        @Valid @RequestBody ChangeStatusRequest request
    ) {
        EmployeeResponse response = employeeService.changeEmployeeStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/managers")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE_READ', 'ROLE_SYSTEM_ADMIN', 'ROLE_HR_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<List<EmployeeResponse>> getEligibleManagers() {
        List<EmployeeResponse> managers = employeeService.getEligibleManagers();
        return ResponseEntity.ok(managers);
    }
}
