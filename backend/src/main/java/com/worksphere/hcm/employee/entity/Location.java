package com.worksphere.hcm.employee.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "locations")
public class Location {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "code", length = 32, nullable = false, unique = true)
    private String code;

    @Column(name = "name", length = 128, nullable = false)
    private String name;

    @Column(name = "city", length = 64, nullable = false)
    private String city;

    @Column(name = "state", length = 64, nullable = false)
    private String state;

    @Column(name = "country", length = 64, nullable = false)
    private String country = "India";

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "organization_id", length = 64)
    private String organizationId;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public Location() {}

    public Location(String id, String code, String name, String city, String state, String country, String address) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.city = city;
        this.state = state;
        this.country = country;
        this.address = address;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
