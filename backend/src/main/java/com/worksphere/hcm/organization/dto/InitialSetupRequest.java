package com.worksphere.hcm.organization.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class InitialSetupRequest {

    @NotNull(message = "Organization data is required")
    @Valid
    private CreateOrganizationRequest organization;

    @NotNull(message = "Administrator data is required")
    @Valid
    private AdminUserDto administrator;

    public static class AdminUserDto {
        @NotBlank(message = "First name is required")
        private String firstName;

        @NotBlank(message = "Last name is required")
        private String lastName;

        @NotBlank(message = "Email is required")
        @Email(message = "Valid administrator email is required")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        public AdminUserDto() {}

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public InitialSetupRequest() {}

    public CreateOrganizationRequest getOrganization() { return organization; }
    public void setOrganization(CreateOrganizationRequest organization) { this.organization = organization; }

    public AdminUserDto getAdministrator() { return administrator; }
    public void setAdministrator(AdminUserDto administrator) { this.administrator = administrator; }
}
