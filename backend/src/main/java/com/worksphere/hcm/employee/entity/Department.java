package com.worksphere.hcm.employee.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "code", length = 32, nullable = false, unique = true)
    private String code;

    @Column(name = "name", length = 128, nullable = false)
    private String name;

    @Column(name = "head_employee_id", length = 64)
    private String headEmployeeId;

    @Column(name = "headcount_target")
    private Integer headcountTarget = 0;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public Department() {}

    public Department(String id, String code, String name, Integer headcountTarget) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.headcountTarget = headcountTarget;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getHeadEmployeeId() { return headEmployeeId; }
    public void setHeadEmployeeId(String headEmployeeId) { this.headEmployeeId = headEmployeeId; }
    public Integer getHeadcountTarget() { return headcountTarget; }
    public void setHeadcountTarget(Integer headcountTarget) { this.headcountTarget = headcountTarget; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
