package com.worksphere.hcm.organization.controller;

import com.worksphere.hcm.organization.dto.InitialSetupRequest;
import com.worksphere.hcm.organization.dto.InitialSetupResponse;
import com.worksphere.hcm.organization.service.SetupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/setup")
public class SetupController {

    private final SetupService setupService;

    public SetupController(SetupService setupService) {
        this.setupService = setupService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSetupStatus() {
        return ResponseEntity.ok(setupService.getSetupStatus());
    }

    @PostMapping("/initialize")
    public ResponseEntity<InitialSetupResponse> initializeSetup(@Valid @RequestBody InitialSetupRequest request) {
        InitialSetupResponse response = setupService.initializeSetup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
