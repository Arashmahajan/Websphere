package com.worksphere.hcm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * WorkSphere Enterprise HCM Modular Monolith Application
 * Java 21 / Spring Boot 3.3.2 Production Backend
 */
@SpringBootApplication
@EnableTransactionManagement
@EnableAsync
public class WorkSphereApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkSphereApplication.class, args);
    }
}
