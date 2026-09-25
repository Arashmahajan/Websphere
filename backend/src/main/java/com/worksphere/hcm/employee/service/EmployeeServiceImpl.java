package com.worksphere.hcm.employee.service;

import com.worksphere.hcm.employee.dto.*;
import com.worksphere.hcm.employee.entity.*;
import com.worksphere.hcm.employee.exception.*;
import com.worksphere.hcm.employee.mapper.EmployeeMapper;
import com.worksphere.hcm.employee.repository.DepartmentRepository;
import com.worksphere.hcm.employee.repository.EmployeeRepository;
import com.worksphere.hcm.employee.repository.LocationRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
        "firstName", "lastName", "employeeCode", "dateOfJoining", "departmentName", "status", "createdAt"
    );

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final LocationRepository locationRepository;
    private final EmployeeMapper employeeMapper;

    public EmployeeServiceImpl(
        EmployeeRepository employeeRepository,
        DepartmentRepository departmentRepository,
        LocationRepository locationRepository,
        EmployeeMapper employeeMapper
    ) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.locationRepository = locationRepository;
        this.employeeMapper = employeeMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EmployeeResponse> getEmployees(
        int page,
        int size,
        String sort,
        String direction,
        String search,
        String departmentId,
        String locationId,
        EmployeeStatus status,
        EmploymentType employmentType
    ) {
        // Enforce safe, whitelisted sorting
        String safeSort = (sort != null && ALLOWED_SORT_FIELDS.contains(sort)) ? sort : "lastName";
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(sortDirection, safeSort));

        Specification<Employee> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Server-side text search
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("employeeCode")), pattern);
                Predicate firstMatch = cb.like(cb.lower(root.get("firstName")), pattern);
                Predicate lastMatch = cb.like(cb.lower(root.get("lastName")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), pattern);
                Predicate titleMatch = cb.like(cb.lower(root.get("jobTitle")), pattern);
                predicates.add(cb.or(codeMatch, firstMatch, lastMatch, emailMatch, titleMatch));
            }

            // Server-side filters
            if (departmentId != null && !departmentId.isBlank() && !"all".equalsIgnoreCase(departmentId)) {
                predicates.add(cb.equal(root.get("departmentId"), departmentId));
            }

            if (locationId != null && !locationId.isBlank() && !"all".equalsIgnoreCase(locationId)) {
                predicates.add(cb.equal(root.get("locationId"), locationId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (employmentType != null) {
                predicates.add(cb.equal(root.get("employmentType"), employmentType));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Employee> employeePage = employeeRepository.findAll(spec, pageRequest);
        Page<EmployeeResponse> responsePage = employeePage.map(employeeMapper::toResponse);
        return PageResponse.of(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(String id) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new EmployeeNotFoundException("Employee record not found for id: " + id));
        return employeeMapper.toResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        // 1. Email Uniqueness Check
        if (employeeRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateEmployeeException("Employee with email '" + normalizedEmail + "' already exists");
        }

        // 2. Employee Code Uniqueness Check
        String employeeCode = request.employeeCode();
        if (employeeCode != null && !employeeCode.isBlank()) {
            if (employeeRepository.existsByEmployeeCode(employeeCode.trim())) {
                throw new DuplicateEmployeeException("Employee with code '" + employeeCode + "' already exists");
            }
        } else {
            employeeCode = generateUniqueEmployeeCode();
        }

        // 3. Department validation
        Department department = departmentRepository.findById(request.departmentId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid department ID: " + request.departmentId()));

        // 4. Location validation
        Location location = locationRepository.findById(request.locationId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid location ID: " + request.locationId()));

        // 5. Manager validation
        String managerName = null;
        if (request.managerId() != null && !request.managerId().isBlank()) {
            Employee manager = employeeRepository.findById(request.managerId())
                .orElseThrow(() -> new IllegalArgumentException("Assigned manager not found: " + request.managerId()));
            managerName = manager.getFirstName() + " " + manager.getLastName();
        }

        Employee employee = employeeMapper.toEntity(
            request,
            employeeCode,
            department.getName(),
            location.getName(),
            managerName
        );

        Employee saved = employeeRepository.save(employee);
        return employeeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployee(String id, UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new EmployeeNotFoundException("Employee record not found for id: " + id));

        // Optimistic locking verification
        if (request.version() != null && !request.version().equals(employee.getVersion())) {
            throw new OptimisticLockConflictException(
                "EMPLOYEE_MODIFIED_BY_ANOTHER_USER: This employee record was modified by another user. Please refresh and try again."
            );
        }

        // Email uniqueness if modified
        String normalizedEmail = request.email().trim().toLowerCase();
        if (!employee.getEmail().equalsIgnoreCase(normalizedEmail)) {
            if (employeeRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new DuplicateEmployeeException("Employee with email '" + normalizedEmail + "' already exists");
            }
        }

        // Manager validation - Prevent self-management
        String managerName = null;
        if (request.managerId() != null && !request.managerId().isBlank()) {
            if (request.managerId().equals(id)) {
                throw new InvalidManagerAssignmentException("An employee cannot be assigned as their own manager.");
            }
            Employee manager = employeeRepository.findById(request.managerId())
                .orElseThrow(() -> new IllegalArgumentException("Assigned manager not found: " + request.managerId()));
            managerName = manager.getFirstName() + " " + manager.getLastName();
        }

        Department department = departmentRepository.findById(request.departmentId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid department ID: " + request.departmentId()));

        Location location = locationRepository.findById(request.locationId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid location ID: " + request.locationId()));

        employeeMapper.updateEntity(employee, request, department.getName(), location.getName(), managerName);
        Employee updated = employeeRepository.save(employee);
        return employeeMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public EmployeeResponse changeEmployeeStatus(String id, ChangeStatusRequest request) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new EmployeeNotFoundException("Employee record not found for id: " + id));

        // Optimistic locking verification
        if (request.version() != null && !request.version().equals(employee.getVersion())) {
            throw new OptimisticLockConflictException(
                "EMPLOYEE_MODIFIED_BY_ANOTHER_USER: This employee record was modified by another user. Please refresh and try again."
            );
        }

        EmployeeStatus currentStatus = employee.getStatus();
        EmployeeStatus targetStatus = request.status();

        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new InvalidStatusTransitionException(
                String.format("Invalid lifecycle transition: Cannot change status from %s to %s.", currentStatus, targetStatus)
            );
        }

        employee.setStatus(targetStatus);
        Employee updated = employeeRepository.save(employee);
        return employeeMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getEligibleManagers() {
        return employeeRepository.findAllEligibleManagers()
            .stream()
            .map(employeeMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getDepartments() {
        return departmentRepository.findAll()
            .stream()
            .map(d -> new DepartmentResponse(d.getId(), d.getCode(), d.getName(), d.getHeadEmployeeId(), d.getHeadcountTarget()))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocationResponse> getLocations() {
        return locationRepository.findAll()
            .stream()
            .map(l -> new LocationResponse(l.getId(), l.getCode(), l.getName(), l.getCity(), l.getState(), l.getCountry(), l.getAddress()))
            .toList();
    }

    private String generateUniqueEmployeeCode() {
        long count = employeeRepository.count();
        long candidateNumber = count + 1;
        String candidate;
        do {
            candidate = String.format("EMP-%06d", candidateNumber++);
        } while (employeeRepository.existsByEmployeeCode(candidate));
        return candidate;
    }
}
