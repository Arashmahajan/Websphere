package com.worksphere.hcm.infrastructure.config;

import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.DescribeClusterResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.concurrent.TimeUnit;

/**
 * WorkSphere Enterprise HCM: Actuator HealthIndicator for Apache Kafka
 * Tests connectivity to Kafka broker within a 2-second timeout window.
 * Reports status cleanly without exposing credentials or internal IP topology.
 */
@Component("kafka")
public class KafkaHealthIndicator implements HealthIndicator {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Override
    public Health health() {
        try (AdminClient adminClient = AdminClient.create(
            Collections.singletonMap(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers)
        )) {
            DescribeClusterResult cluster = adminClient.describeCluster();
            String clusterId = cluster.clusterId().get(2, TimeUnit.SECONDS);
            int nodeCount = cluster.nodes().get(2, TimeUnit.SECONDS).size();

            return Health.up()
                .withDetail("clusterId", clusterId)
                .withDetail("nodeCount", nodeCount)
                .withDetail("status", "CONNECTED")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("status", "UNAVAILABLE")
                .withDetail("reason", e.getMessage() != null ? e.getMessage() : "Connection timed out")
                .build();
        }
    }
}
