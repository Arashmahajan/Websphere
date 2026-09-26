package com.worksphere.hcm.organization.dto;

public class InitialSetupResponse {

    private boolean success;
    private String message;
    private OrganizationResponse organization;
    private String adminEmail;
    private String adminFullName;

    public InitialSetupResponse() {}

    public InitialSetupResponse(boolean success, String message, OrganizationResponse organization, String adminEmail, String adminFullName) {
        this.success = success;
        this.message = message;
        this.organization = organization;
        this.adminEmail = adminEmail;
        this.adminFullName = adminFullName;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public OrganizationResponse getOrganization() { return organization; }
    public void setOrganization(OrganizationResponse organization) { this.organization = organization; }

    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }

    public String getAdminFullName() { return adminFullName; }
    public void setAdminFullName(String adminFullName) { this.adminFullName = adminFullName; }
}
