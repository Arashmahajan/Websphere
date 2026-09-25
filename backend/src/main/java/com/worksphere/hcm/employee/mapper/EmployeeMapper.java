package com.worksphere.hcm.employee.mapper;

import com.worksphere.hcm.employee.dto.CreateEmployeeRequest;
import com.worksphere.hcm.employee.dto.EmployeeResponse;
import com.worksphere.hcm.employee.dto.UpdateEmployeeRequest;
import com.worksphere.hcm.employee.entity.Employee;
import com.worksphere.hcm.employee.entity.EmployeeStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Component
public class EmployeeMapper {

    public Employee toEntity(CreateEmployeeRequest request, String generatedCode, String departmentName, String locationName, String managerName) {
        Employee employee = new Employee();
        employee.setId("emp-" + UUID.randomUUID().toString().substring(0, 8));
        employee.setEmployeeCode(generatedCode);
        employee.setFirstName(request.firstName().trim());
        employee.setLastName(request.lastName().trim());
        employee.setEmail(request.email().trim().toLowerCase());
        employee.setPhone(request.phone());
        employee.setDateOfBirth(request.dateOfBirth());
        employee.setDateOfJoining(request.dateOfJoining());
        employee.setDepartmentId(request.departmentId());
        employee.setDepartmentName(departmentName);
        employee.setManagerId(request.managerId());
        employee.setManagerName(managerName);
        employee.setJobTitle(request.jobTitle().trim());
        employee.setLevel(request.level() != null ? request.level() : "Level IC-3");
        employee.setEmploymentType(request.employmentType());
        employee.setLocationId(request.locationId());
        employee.setLocationName(locationName);
        employee.setStatus(EmployeeStatus.ACTIVE);
        employee.setAvatarUrl(request.avatarUrl());
        employee.setBankAccountReference(request.bankAccountReference());
        employee.setIfscCode(request.ifscCode());
        employee.setPanNumber(request.panNumber());
        employee.setUanNumber(request.uanNumber());

        BigDecimal ctc = request.ctcAnnual() != null ? request.ctcAnnual() : BigDecimal.ZERO;
        employee.setCtcAnnual(ctc);
        employee.setBaseMonthly(ctc.divide(BigDecimal.valueOf(20), 2, RoundingMode.HALF_UP));
        employee.setVersion(0L);
        employee.setCreatedAt(Instant.now());
        employee.setUpdatedAt(Instant.now());
        return employee;
    }

    public void updateEntity(Employee employee, UpdateEmployeeRequest request, String departmentName, String locationName, String managerName) {
        employee.setFirstName(request.firstName().trim());
        employee.setLastName(request.lastName().trim());
        employee.setEmail(request.email().trim().toLowerCase());
        employee.setPhone(request.phone());
        if (request.dateOfBirth() != null) employee.setDateOfBirth(request.dateOfBirth());
        if (request.dateOfJoining() != null) employee.setDateOfJoining(request.dateOfJoining());
        employee.setDepartmentId(request.departmentId());
        employee.setDepartmentName(departmentName);
        employee.setManagerId(request.managerId());
        employee.setManagerName(managerName);
        employee.setJobTitle(request.jobTitle().trim());
        if (request.level() != null) employee.setLevel(request.level());
        employee.setEmploymentType(request.employmentType());
        employee.setLocationId(request.locationId());
        employee.setLocationName(locationName);
        if (request.avatarUrl() != null) employee.setAvatarUrl(request.avatarUrl());
        if (request.bankAccountReference() != null) employee.setBankAccountReference(request.bankAccountReference());
        if (request.ifscCode() != null) employee.setIfscCode(request.ifscCode());
        if (request.panNumber() != null) employee.setPanNumber(request.panNumber());
        if (request.uanNumber() != null) employee.setUanNumber(request.uanNumber());

        if (request.ctcAnnual() != null) {
            employee.setCtcAnnual(request.ctcAnnual());
            employee.setBaseMonthly(request.ctcAnnual().divide(BigDecimal.valueOf(20), 2, RoundingMode.HALF_UP));
        }
        employee.setUpdatedAt(Instant.now());
    }

    public EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
            employee.getId(),
            employee.getEmployeeCode(),
            employee.getFirstName(),
            employee.getLastName(),
            employee.getFirstName() + " " + employee.getLastName(),
            employee.getEmail(),
            employee.getPhone(),
            employee.getDateOfBirth(),
            employee.getDateOfJoining(),
            employee.getDepartmentId(),
            employee.getDepartmentName(),
            employee.getManagerId(),
            employee.getManagerName(),
            employee.getJobTitle(),
            employee.getLevel(),
            employee.getEmploymentType(),
            employee.getLocationId(),
            employee.getLocationName(),
            employee.getStatus(),
            employee.getAvatarUrl(),
            employee.getBankAccountReference(),
            employee.getIfscCode(),
            employee.getPanNumber(),
            employee.getUanNumber(),
            employee.getCtcAnnual(),
            employee.getBaseMonthly(),
            employee.getVersion(),
            employee.getCreatedAt(),
            employee.getUpdatedAt()
        );
    }
}
