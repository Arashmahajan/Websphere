package com.worksphere.hcm.organization.controller;

import com.worksphere.hcm.organization.dto.CreateOrganizationRequest;
import com.worksphere.hcm.organization.dto.OrganizationResponse;
import com.worksphere.hcm.organization.dto.UpdateOrganizationRequest;
import com.worksphere.hcm.organization.entity.OrganizationStatus;
import com.worksphere.hcm.organization.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping
    public ResponseEntity<List<OrganizationResponse>> getOrganizations() {
        return ResponseEntity.ok(organizationService.getAllOrganizations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationResponse> getOrganizationById(@PathVariable String id) {
        return ResponseEntity.ok(organizationService.getOrganizationById(id));
    }

    @PostMapping
    public ResponseEntity<OrganizationResponse> createOrganization(
        @Valid @RequestBody CreateOrganizationRequest request,
        Principal principal
    ) {
        String userEmail = principal != null ? principal.getName() : "system@worksphere.local";
        OrganizationResponse created = organizationService.createOrganization(request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrganizationResponse> updateOrganization(
        @PathVariable String id,
        @Valid @RequestBody UpdateOrganizationRequest request,
        Principal principal
    ) {
        String userEmail = principal != null ? principal.getName() : "system@worksphere.local";
        return ResponseEntity.ok(organizationService.updateOrganization(id, request, userEmail));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrganizationResponse> changeStatus(
        @PathVariable String id,
        @RequestBody Map<String, String> statusBody,
        Principal principal
    ) {
        String userEmail = principal != null ? principal.getName() : "system@worksphere.local";
        OrganizationStatus status = OrganizationStatus.valueOf(statusBody.get("status").toUpperCase());
        return ResponseEntity.ok(organizationService.changeStatus(id, status, userEmail));
    }
}
