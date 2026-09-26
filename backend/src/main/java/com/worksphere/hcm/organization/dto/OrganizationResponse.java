package com.worksphere.hcm.organization.dto;

import com.worksphere.hcm.organization.entity.Organization;
import com.worksphere.hcm.organization.entity.OrganizationStatus;

import java.time.Instant;

public class OrganizationResponse {

    private String id;
    private String organizationCode;
    private String name;
    private String legalName;
    private String industry;
    private String country;
    private String timezone;
    private String primaryEmail;
    private String phone;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String website;
    private OrganizationStatus status;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;

    public OrganizationResponse() {}

    public static OrganizationResponse fromEntity(Organization org) {
        OrganizationResponse dto = new OrganizationResponse();
        dto.id = org.getId();
        dto.organizationCode = org.getOrganizationCode();
        dto.name = org.getName();
        dto.legalName = org.getLegalName();
        dto.industry = org.getIndustry();
        dto.country = org.getCountry();
        dto.timezone = org.getTimezone();
        dto.primaryEmail = org.getPrimaryEmail();
        dto.phone = org.getPhone();
        dto.addressLine1 = org.getAddressLine1();
        dto.addressLine2 = org.getAddressLine2();
        dto.city = org.getCity();
        dto.state = org.getState();
        dto.postalCode = org.getPostalCode();
        dto.website = org.getWebsite();
        dto.status = org.getStatus();
        dto.version = org.getVersion();
        dto.createdAt = org.getCreatedAt();
        dto.updatedAt = org.getUpdatedAt();
        return dto;
    }

    public String getId() { return id; }
    public String getOrganizationCode() { return organizationCode; }
    public String getName() { return name; }
    public String getLegalName() { return legalName; }
    public String getIndustry() { return industry; }
    public String getCountry() { return country; }
    public String getTimezone() { return timezone; }
    public String getPrimaryEmail() { return primaryEmail; }
    public String getPhone() { return phone; }
    public String getAddressLine1() { return addressLine1; }
    public String getAddressLine2() { return addressLine2; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getPostalCode() { return postalCode; }
    public String getWebsite() { return website; }
    public OrganizationStatus getStatus() { return status; }
    public Long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
