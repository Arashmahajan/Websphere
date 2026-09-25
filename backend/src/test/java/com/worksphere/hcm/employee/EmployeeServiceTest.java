package com.worksphere.hcm.employee;

import com.worksphere.hcm.employee.dto.*;
import com.worksphere.hcm.employee.entity.*;
import com.worksphere.hcm.employee.exception.*;
import com.worksphere.hcm.employee.mapper.EmployeeMapper;
import com.worksphere.hcm.employee.repository.DepartmentRepository;
import com.worksphere.hcm.employee.repository.EmployeeRepository;
import com.worksphere.hcm.employee.repository.LocationRepository;
import com.worksphere.hcm.employee.service.EmployeeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private LocationRepository locationRepository;

    private EmployeeMapper employeeMapper;
    private EmployeeServiceImpl employeeService;

    private Department sampleDepartment;
    private Location sampleLocation;
    private Employee sampleEmployee;

    @BeforeEach
    void setUp() {
        employeeMapper = new EmployeeMapper();
        employeeService = new EmployeeServiceImpl(
            employeeRepository, departmentRepository, locationRepository, employeeMapper
        );

        sampleDepartment = new Department("dept-1", "ENG", "Engineering & Product", 450);
        sampleLocation = new Location("loc-blr", "BLR", "Bengaluru (Campus 1 & 2)", "Bangalore", "Karnataka", "India", "ORR");

        sampleEmployee = new Employee();
        sampleEmployee.setId("emp-101");
        sampleEmployee.setEmployeeCode("EMP-000101");
        sampleEmployee.setFirstName("Aarav");
        sampleEmployee.setLastName("Sharma");
        sampleEmployee.setEmail("aarav.sharma@worksphere.local");
        sampleEmployee.setDateOfBirth(LocalDate.of(1992, 5, 14));
        sampleEmployee.setDateOfJoining(LocalDate.of(2021, 3, 1));
        sampleEmployee.setDepartmentId("dept-1");
        sampleEmployee.setDepartmentName("Engineering & Product");
        sampleEmployee.setLocationId("loc-blr");
        sampleEmployee.setLocationName("Bengaluru (Campus 1 & 2)");
        sampleEmployee.setJobTitle("Staff Software Engineer");
        sampleEmployee.setEmploymentType(EmploymentType.FULL_TIME);
        sampleEmployee.setStatus(EmployeeStatus.ACTIVE);
        sampleEmployee.setVersion(0L);
    }

    @Test
    @DisplayName("Create employee successfully")
    void testCreateEmployee_Success() {
        CreateEmployeeRequest request = new CreateEmployeeRequest(
            "EMP-000101",
            "Aarav",
            "Sharma",
            "aarav.sharma@worksphere.local",
            "+91 98000 11111",
            LocalDate.of(1992, 5, 14),
            LocalDate.of(2021, 3, 1),
            "dept-1",
            null,
            "loc-blr",
            "Staff Software Engineer",
            "Level IC-4",
            EmploymentType.FULL_TIME,
            BigDecimal.valueOf(3000000),
            "HDFC-001",
            "HDFC0001223",
            "ABCDE1234F",
            "100999999999",
            null
        );

        when(employeeRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(employeeRepository.existsByEmployeeCode(anyString())).thenReturn(false);
        when(departmentRepository.findById("dept-1")).thenReturn(Optional.of(sampleDepartment));
        when(locationRepository.findById("loc-blr")).thenReturn(Optional.of(sampleLocation));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeResponse response = employeeService.createEmployee(request);

        assertNotNull(response);
        assertEquals("EMP-000101", response.employeeCode());
        assertEquals("Aarav", response.firstName());
        assertEquals("Engineering & Product", response.departmentName());
        assertEquals(EmployeeStatus.ACTIVE, response.status());
    }

    @Test
    @DisplayName("Reject duplicate employee code with Conflict")
    void testCreateEmployee_DuplicateCode() {
        CreateEmployeeRequest request = new CreateEmployeeRequest(
            "EMP-000101", "Aarav", "Sharma", "new.email@worksphere.local",
            null, LocalDate.of(1992, 5, 14), LocalDate.of(2021, 3, 1),
            "dept-1", null, "loc-blr", "Engineer", "IC-3", EmploymentType.FULL_TIME,
            null, null, null, null, null, null
        );

        when(employeeRepository.existsByEmailIgnoreCase("new.email@worksphere.local")).thenReturn(false);
        when(employeeRepository.existsByEmployeeCode("EMP-000101")).thenReturn(true);

        assertThrows(DuplicateEmployeeException.class, () -> employeeService.createEmployee(request));
    }

    @Test
    @DisplayName("Reject duplicate email with Conflict")
    void testCreateEmployee_DuplicateEmail() {
        CreateEmployeeRequest request = new CreateEmployeeRequest(
            null, "Aarav", "Sharma", "aarav.sharma@worksphere.local",
            null, LocalDate.of(1992, 5, 14), LocalDate.of(2021, 3, 1),
            "dept-1", null, "loc-blr", "Engineer", "IC-3", EmploymentType.FULL_TIME,
            null, null, null, null, null, null
        );

        when(employeeRepository.existsByEmailIgnoreCase("aarav.sharma@worksphere.local")).thenReturn(true);

        assertThrows(DuplicateEmployeeException.class, () -> employeeService.createEmployee(request));
    }

    @Test
    @DisplayName("Reject invalid department")
    void testCreateEmployee_InvalidDepartment() {
        CreateEmployeeRequest request = new CreateEmployeeRequest(
            null, "Aarav", "Sharma", "unique@worksphere.local",
            null, LocalDate.of(1992, 5, 14), LocalDate.of(2021, 3, 1),
            "dept-invalid", null, "loc-blr", "Engineer", "IC-3", EmploymentType.FULL_TIME,
            null, null, null, null, null, null
        );

        when(employeeRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(departmentRepository.findById("dept-invalid")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> employeeService.createEmployee(request));
    }

    @Test
    @DisplayName("Reject self as manager")
    void testUpdateEmployee_SelfAsManager() {
        UpdateEmployeeRequest request = new UpdateEmployeeRequest(
            "Aarav", "Sharma", "aarav.sharma@worksphere.local",
            null, LocalDate.of(1992, 5, 14), LocalDate.of(2021, 3, 1),
            "dept-1", "emp-101", "loc-blr", "Engineer", "IC-3", EmploymentType.FULL_TIME,
            null, null, null, null, null, null, 0L
        );

        when(employeeRepository.findById("emp-101")).thenReturn(Optional.of(sampleEmployee));

        assertThrows(InvalidManagerAssignmentException.class, () -> employeeService.updateEmployee("emp-101", request));
    }

    @Test
    @DisplayName("Get employee by ID - Not found")
    void testGetEmployeeById_NotFound() {
        when(employeeRepository.findById("unknown-id")).thenReturn(Optional.empty());
        assertThrows(EmployeeNotFoundException.class, () -> employeeService.getEmployeeById("unknown-id"));
    }

    @Test
    @DisplayName("Status transition: ACTIVE -> SUSPENDED (Valid)")
    void testStatusTransition_Valid() {
        when(employeeRepository.findById("emp-101")).thenReturn(Optional.of(sampleEmployee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> i.getArgument(0));

        ChangeStatusRequest request = new ChangeStatusRequest(EmployeeStatus.SUSPENDED, "Pending inquiry", 0L);
        EmployeeResponse response = employeeService.changeEmployeeStatus("emp-101", request);

        assertEquals(EmployeeStatus.SUSPENDED, response.status());
    }

    @Test
    @DisplayName("Status transition: TERMINATED -> ACTIVE (Invalid, Terminal state)")
    void testStatusTransition_InvalidFromTerminated() {
        sampleEmployee.setStatus(EmployeeStatus.TERMINATED);
        when(employeeRepository.findById("emp-101")).thenReturn(Optional.of(sampleEmployee));

        ChangeStatusRequest request = new ChangeStatusRequest(EmployeeStatus.ACTIVE, "Rehire attempt", 0L);
        assertThrows(InvalidStatusTransitionException.class, () -> employeeService.changeEmployeeStatus("emp-101", request));
    }

    @Test
    @DisplayName("Optimistic locking conflict on update")
    void testUpdateEmployee_OptimisticLockConflict() {
        sampleEmployee.setVersion(2L);
        when(employeeRepository.findById("emp-101")).thenReturn(Optional.of(sampleEmployee));

        UpdateEmployeeRequest request = new UpdateEmployeeRequest(
            "Aarav", "Sharma", "aarav.sharma@worksphere.local",
            null, null, null, "dept-1", null, "loc-blr", "Engineer", null, EmploymentType.FULL_TIME,
            null, null, null, null, null, null, 1L // Stale version
        );

        assertThrows(OptimisticLockConflictException.class, () -> employeeService.updateEmployee("emp-101", request));
    }

    @Test
    @DisplayName("Server-side pagination and search")
    void testGetEmployees_PaginationAndSearch() {
        Page<Employee> page = new PageImpl<>(List.of(sampleEmployee), PageRequest.of(0, 20), 1);
        when(employeeRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        PageResponse<EmployeeResponse> result = employeeService.getEmployees(
            0, 20, "lastName", "asc", "aarav", "dept-1", "loc-blr", EmployeeStatus.ACTIVE, EmploymentType.FULL_TIME
        );

        assertNotNull(result);
        assertEquals(1, result.totalElements());
        assertEquals(1, result.content().size());
        assertEquals("Aarav", result.content().get(0).firstName());
    }
}
