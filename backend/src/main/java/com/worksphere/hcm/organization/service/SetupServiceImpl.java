package com.worksphere.hcm.organization.service;

import com.worksphere.hcm.audit.entity.AuditLog;
import com.worksphere.hcm.audit.repository.AuditLogRepository;
import com.worksphere.hcm.auth.entity.Role;
import com.worksphere.hcm.auth.entity.User;
import com.worksphere.hcm.auth.repository.RoleRepository;
import com.worksphere.hcm.auth.repository.UserRepository;
import com.worksphere.hcm.organization.dto.CreateOrganizationRequest;
import com.worksphere.hcm.organization.dto.InitialSetupRequest;
import com.worksphere.hcm.organization.dto.InitialSetupResponse;
import com.worksphere.hcm.organization.dto.OrganizationResponse;
import com.worksphere.hcm.organization.entity.Organization;
import com.worksphere.hcm.organization.entity.OrganizationStatus;
import com.worksphere.hcm.organization.repository.OrganizationRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class SetupServiceImpl implements SetupService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public SetupServiceImpl(
        OrganizationRepository organizationRepository,
        UserRepository userRepository,
        RoleRepository roleRepository,
        AuditLogRepository auditLogRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSetupStatus() {
        long orgCount = organizationRepository.count();
        long userCount = userRepository.count();

        Map<String, Object> status = new HashMap<>();
        status.put("initialized", orgCount > 0 && userCount > 0);
        status.put("organizationCount", orgCount);
        status.put("userCount", userCount);
        return status;
    }

    @Override
    @Transactional
    public InitialSetupResponse initializeSetup(InitialSetupRequest request) {
        CreateOrganizationRequest orgDto = request.getOrganization();
        InitialSetupRequest.AdminUserDto adminDto = request.getAdministrator();

        if (organizationRepository.existsByOrganizationCode(orgDto.getOrganizationCode())) {
            throw new IllegalArgumentException("Organization code already registered: " + orgDto.getOrganizationCode());
        }
        if (userRepository.existsByEmail(adminDto.getEmail())) {
            throw new IllegalArgumentException("Administrator email already registered: " + adminDto.getEmail());
        }

        // 1. Transactionally persist Organization
        Organization org = new Organization();
        String orgId = "org-" + UUID.randomUUID().toString().substring(0, 8);
        org.setId(orgId);
        org.setOrganizationCode(orgDto.getOrganizationCode().trim().toUpperCase());
        org.setName(orgDto.getName().trim());
        org.setLegalName(orgDto.getLegalName().trim());
        org.setIndustry(orgDto.getIndustry());
        org.setCountry(orgDto.getCountry().trim());
        org.setTimezone(orgDto.getTimezone().trim());
        org.setPrimaryEmail(orgDto.getPrimaryEmail().trim().toLowerCase());
        org.setPhone(orgDto.getPhone());
        org.setAddressLine1(orgDto.getAddressLine1());
        org.setAddressLine2(orgDto.getAddressLine2());
        org.setCity(orgDto.getCity());
        org.setState(orgDto.getState());
        org.setPostalCode(orgDto.getPostalCode());
        org.setWebsite(orgDto.getWebsite());
        org.setStatus(OrganizationStatus.ACTIVE);
        org.setCreatedAt(Instant.now());
        org.setUpdatedAt(Instant.now());

        Organization savedOrg = organizationRepository.save(org);

        // 2. Transactionally persist Initial Administrator with BCrypt password hashing
        User admin = new User();
        String adminId = "usr-" + UUID.randomUUID().toString().substring(0, 8);
        admin.setId(adminId);
        admin.setEmail(adminDto.getEmail().trim().toLowerCase());
        admin.setFullName(adminDto.getFirstName().trim() + " " + adminDto.getLastName().trim());
        admin.setPasswordHash(passwordEncoder.encode(adminDto.getPassword()));
        admin.setTitle("Enterprise Executive Administrator");
        admin.setDepartment("Executive / C-Suite");
        admin.setEnabled(true);
        admin.setCreatedAt(Instant.now());
        admin.setUpdatedAt(Instant.now());

        // Assign SYSTEM_ADMIN role
        Role adminRole = roleRepository.findByName("SYSTEM_ADMIN")
            .orElseGet(() -> roleRepository.save(new Role("role-sysadmin", "SYSTEM_ADMIN", "Global system administrator")));
        admin.getRoles().add(adminRole);

        User savedAdmin = userRepository.save(admin);

        // 3. Generate initial audit logs
        AuditLog orgAudit = new AuditLog(
            "aud-" + UUID.randomUUID().toString().substring(0, 8),
            savedAdmin.getId(),
            savedAdmin.getEmail(),
            "ORGANIZATION_INITIALIZED",
            "ORGANIZATION",
            savedOrg.getId(),
            "Initial setup completed: Created organization " + savedOrg.getName() + " (" + savedOrg.getOrganizationCode() + ")"
        );
        auditLogRepository.save(orgAudit);

        AuditLog adminAudit = new AuditLog(
            "aud-" + UUID.randomUUID().toString().substring(0, 8),
            savedAdmin.getId(),
            savedAdmin.getEmail(),
            "INITIAL_ADMIN_CREATED",
            "USER",
            savedAdmin.getId(),
            "Initial system administrator account established with SYSTEM_ADMIN privileges"
        );
        auditLogRepository.save(adminAudit);

        return new InitialSetupResponse(
            true,
            "Initial organization and administrator successfully established",
            OrganizationResponse.fromEntity(savedOrg),
            savedAdmin.getEmail(),
            savedAdmin.getFullName()
        );
    }
}
