package com.worksphere.hcm.infrastructure;

import com.worksphere.hcm.infrastructure.config.KafkaHealthIndicator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * WorkSphere Enterprise HCM: Infrastructure Bean Verification Test
 * Verifies that Spring Boot correctly configures Redis and Kafka connection infrastructure.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/worksphere",
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.data.redis.url=redis://localhost:6379",
    "spring.kafka.bootstrap-servers=localhost:9092"
})
public class InfrastructureConnectionVerificationTest {

    @Autowired(required = false)
    private RedisConnectionFactory redisConnectionFactory;

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired(required = false)
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private KafkaHealthIndicator kafkaHealthIndicator;

    @Test
    @DisplayName("Verify Redis connection factory and template are initialized")
    void testRedisInfrastructureConfigured() {
        assertNotNull(redisConnectionFactory, "RedisConnectionFactory bean must be created");
        assertNotNull(redisTemplate, "RedisTemplate bean must be created");
    }

    @Test
    @DisplayName("Verify Kafka template and health indicator are initialized")
    void testKafkaInfrastructureConfigured() {
        assertNotNull(kafkaTemplate, "KafkaTemplate bean must be created");
        assertNotNull(kafkaHealthIndicator, "KafkaHealthIndicator bean must be created");

        // Calling health check should evaluate gracefully (UP or DOWN depending on local broker)
        Health health = kafkaHealthIndicator.health();
        assertNotNull(health, "Health check must return a non-null Health status");
        assertNotNull(health.getStatus(), "Health status must not be null");
    }
}
