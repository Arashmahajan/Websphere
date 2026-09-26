package com.worksphere.hcm.organization.service;

import com.worksphere.hcm.organization.dto.CreateOrganizationRequest;
import com.worksphere.hcm.organization.dto.OrganizationResponse;
import com.worksphere.hcm.organization.dto.UpdateOrganizationRequest;
import com.worksphere.hcm.organization.entity.OrganizationStatus;

import java.util.List;

public interface OrganizationService {
    List<OrganizationResponse> getAllOrganizations();
    OrganizationResponse getOrganizationById(String id);
    OrganizationResponse createOrganization(CreateOrganizationRequest request, String actingUserEmail);
    OrganizationResponse updateOrganization(String id, UpdateOrganizationRequest request, String actingUserEmail);
    OrganizationResponse changeStatus(String id, OrganizationStatus status, String actingUserEmail);
}
