package com.worksphere.hcm.organization.repository;

import com.worksphere.hcm.organization.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, String> {
    Optional<Organization> findByOrganizationCode(String organizationCode);
    boolean existsByOrganizationCode(String organizationCode);
}
