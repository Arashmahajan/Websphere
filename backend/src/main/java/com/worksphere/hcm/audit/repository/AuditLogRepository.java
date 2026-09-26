package com.worksphere.hcm.audit.repository;

import com.worksphere.hcm.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    Page<AuditLog> findByOrderByTimestampDesc(Pageable pageable);
    List<AuditLog> findByResourceTypeAndResourceIdOrderByTimestampDesc(String resourceType, String resourceId);
    List<AuditLog> findByUserEmailOrderByTimestampDesc(String userEmail);
}
