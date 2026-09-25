package com.worksphere.hcm.employee.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "employee_code", length = 64, nullable = false, unique = true)
    private String employeeCode;

    @Column(name = "first_name", length = 128, nullable = false)
    private String firstName;

    @Column(name = "last_name", length = 128, nullable = false)
    private String lastName;

    @Column(name = "email", length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "phone", length = 32)
    private String phone;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "date_of_joining", nullable = false)
    private LocalDate dateOfJoining;

    @Column(name = "department_id", length = 64)
    private String departmentId;

    @Column(name = "department_name", length = 128)
    private String departmentName;

    @Column(name = "manager_id", length = 64)
    private String managerId;

    @Column(name = "manager_name", length = 128)
    private String managerName;

    @Column(name = "job_title", length = 128, nullable = false)
    private String jobTitle;

    @Column(name = "level", length = 32, nullable = false)
    private String level = "Level IC-3";

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", length = 32, nullable = false)
    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    @Column(name = "location_id", length = 64)
    private String locationId;

    @Column(name = "location_name", length = 128)
    private String locationName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "bank_account_ref", length = 64)
    private String bankAccountReference;

    @Column(name = "ifsc_code", length = 32)
    private String ifscCode;

    @Column(name = "pan_number", length = 32)
    private String panNumber;

    @Column(name = "uan_number", length = 32)
    private String uanNumber;

    @Column(name = "ctc_annual", precision = 15, scale = 2, nullable = false)
    private BigDecimal ctcAnnual = BigDecimal.ZERO;

    @Column(name = "base_monthly", precision = 15, scale = 2, nullable = false)
    private BigDecimal baseMonthly = BigDecimal.ZERO;

    @Version
    @Column(name = "version")
    private Long version = 0L;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Employee() {}

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (version == null) version = 0L;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }

    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public EmploymentType getEmploymentType() { return employmentType; }
    public void setEmploymentType(EmploymentType employmentType) { this.employmentType = employmentType; }

    public String getLocationId() { return locationId; }
    public void setLocationId(String locationId) { this.locationId = locationId; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public EmployeeStatus getStatus() { return status; }
    public void setStatus(EmployeeStatus status) { this.status = status; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getBankAccountReference() { return bankAccountReference; }
    public void setBankAccountReference(String bankAccountReference) { this.bankAccountReference = bankAccountReference; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public String getUanNumber() { return uanNumber; }
    public void setUanNumber(String uanNumber) { this.uanNumber = uanNumber; }

    public BigDecimal getCtcAnnual() { return ctcAnnual; }
    public void setCtcAnnual(BigDecimal ctcAnnual) { this.ctcAnnual = ctcAnnual; }

    public BigDecimal getBaseMonthly() { return baseMonthly; }
    public void setBaseMonthly(BigDecimal baseMonthly) { this.baseMonthly = baseMonthly; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
