package com.worksphere.hcm.employee.repository;

import com.worksphere.hcm.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByEmployeeCode(String employeeCode);

    Optional<Employee> findByEmailIgnoreCase(String email);

    boolean existsByEmployeeCode(String employeeCode);

    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT e FROM Employee e WHERE e.status = 'ACTIVE' ORDER BY e.firstName ASC, e.lastName ASC")
    List<Employee> findAllEligibleManagers();
}
