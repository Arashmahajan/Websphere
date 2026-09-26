package com.worksphere.hcm.organization.service;

import com.worksphere.hcm.organization.dto.InitialSetupRequest;
import com.worksphere.hcm.organization.dto.InitialSetupResponse;

import java.util.Map;

public interface SetupService {
    Map<String, Object> getSetupStatus();
    InitialSetupResponse initializeSetup(InitialSetupRequest request);
}
