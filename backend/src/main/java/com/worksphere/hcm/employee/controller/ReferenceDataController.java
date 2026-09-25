package com.worksphere.hcm.employee.controller;

import com.worksphere.hcm.employee.dto.DepartmentResponse;
import com.worksphere.hcm.employee.dto.LocationResponse;
import com.worksphere.hcm.employee.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class ReferenceDataController {

    private final EmployeeService employeeService;

    public ReferenceDataController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentResponse>> getDepartments() {
        return ResponseEntity.ok(employeeService.getDepartments());
    }

    @GetMapping("/locations")
    public ResponseEntity<List<LocationResponse>> getLocations() {
        return ResponseEntity.ok(employeeService.getLocations());
    }
}
