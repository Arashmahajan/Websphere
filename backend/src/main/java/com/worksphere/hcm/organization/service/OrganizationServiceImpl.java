package com.worksphere.hcm.organization.service;

import com.worksphere.hcm.audit.entity.AuditLog;
import com.worksphere.hcm.audit.repository.AuditLogRepository;
import com.worksphere.hcm.organization.dto.CreateOrganizationRequest;
import com.worksphere.hcm.organization.dto.OrganizationResponse;
import com.worksphere.hcm.organization.dto.UpdateOrganizationRequest;
import com.worksphere.hcm.organization.entity.Organization;
import com.worksphere.hcm.organization.entity.OrganizationStatus;
import com.worksphere.hcm.organization.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final AuditLogRepository auditLogRepository;

    public OrganizationServiceImpl(
        OrganizationRepository organizationRepository,
        AuditLogRepository auditLogRepository
    ) {
        this.organizationRepository = organizationRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrganizationResponse> getAllOrganizations() {
        return organizationRepository.findAll().stream()
            .map(OrganizationResponse::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationResponse getOrganizationById(String id) {
        Organization org = organizationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Organization not found with ID: " + id));
        return OrganizationResponse.fromEntity(org);
    }

    @Override
    @Transactional
    public OrganizationResponse createOrganization(CreateOrganizationRequest request, String actingUserEmail) {
        if (organizationRepository.existsByOrganizationCode(request.getOrganizationCode())) {
            throw new IllegalArgumentException("Organization code already exists: " + request.getOrganizationCode());
        }

        Organization org = new Organization();
        org.setId("org-" + UUID.randomUUID().toString().substring(0, 8));
        org.setOrganizationCode(request.getOrganizationCode().toUpperCase());
        org.setName(request.getName());
        org.setLegalName(request.getLegalName());
        org.setIndustry(request.getIndustry());
        org.setCountry(request.getCountry());
        org.setTimezone(request.getTimezone());
        org.setPrimaryEmail(request.getPrimaryEmail());
        org.setPhone(request.getPhone());
        org.setAddressLine1(request.getAddressLine1());
        org.setAddressLine2(request.getAddressLine2());
        org.setCity(request.getCity());
        org.setState(request.getState());
        org.setPostalCode(request.getPostalCode());
        org.setWebsite(request.getWebsite());
        org.setStatus(OrganizationStatus.ACTIVE);
        org.setCreatedAt(Instant.now());
        org.setUpdatedAt(Instant.now());

        Organization saved = organizationRepository.save(org);

        // Record immutable audit event
        AuditLog audit = new AuditLog(
            "aud-" + UUID.randomUUID().toString().substring(0, 8),
            actingUserEmail != null ? actingUserEmail : "SYSTEM_SETUP",
            actingUserEmail != null ? actingUserEmail : "setup@worksphere.local",
            "ORGANIZATION_CREATED",
            "ORGANIZATION",
            saved.getId(),
            "Created organization " + saved.getName() + " [" + saved.getOrganizationCode() + "]"
        );
        auditLogRepository.save(audit);

        return OrganizationResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public OrganizationResponse updateOrganization(String id, UpdateOrganizationRequest request, String actingUserEmail) {
        Organization org = organizationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Organization not found with ID: " + id));

        org.setName(request.getName());
        org.setLegalName(request.getLegalName());
        org.setIndustry(request.getIndustry());
        if (request.getCountry() != null) org.setCountry(request.getCountry());
        if (request.getTimezone() != null) org.setTimezone(request.getTimezone());
        org.setPrimaryEmail(request.getPrimaryEmail());
        org.setPhone(request.getPhone());
        org.setAddressLine1(request.getAddressLine1());
        org.setAddressLine2(request.getAddressLine2());
        org.setCity(request.getCity());
        org.setState(request.getState());
        org.setPostalCode(request.getPostalCode());
        org.setWebsite(request.getWebsite());
        if (request.getStatus() != null) org.setStatus(request.getStatus());
        org.setUpdatedAt(Instant.now());

        Organization saved = organizationRepository.save(org);

        AuditLog audit = new AuditLog(
            "aud-" + UUID.randomUUID().toString().substring(0, 8),
            actingUserEmail != null ? actingUserEmail : "SYSTEM",
            actingUserEmail != null ? actingUserEmail : "admin@worksphere.local",
            "ORGANIZATION_UPDATED",
            "ORGANIZATION",
            saved.getId(),
            "Updated organization profile for " + saved.getName()
        );
        auditLogRepository.save(audit);

        return OrganizationResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public OrganizationResponse changeStatus(String id, OrganizationStatus status, String actingUserEmail) {
        Organization org = organizationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Organization not found with ID: " + id));

        OrganizationStatus oldStatus = org.getStatus();
        org.setStatus(status);
        org.setUpdatedAt(Instant.now());

        Organization saved = organizationRepository.save(org);

        AuditLog audit = new AuditLog(
            "aud-" + UUID.randomUUID().toString().substring(0, 8),
            actingUserEmail != null ? actingUserEmail : "SYSTEM",
            actingUserEmail != null ? actingUserEmail : "admin@worksphere.local",
            "ORGANIZATION_STATUS_CHANGED",
            "ORGANIZATION",
            saved.getId(),
            "Changed status from " + oldStatus + " to " + status
        );
        audit.setOldValue(oldStatus.name());
        audit.setNewValue(status.name());
        auditLogRepository.save(audit);

        return OrganizationResponse.fromEntity(saved);
    }
}
