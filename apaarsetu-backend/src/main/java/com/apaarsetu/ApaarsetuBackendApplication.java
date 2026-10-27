package com.apaarsetu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@ConfigurationPropertiesScan
public class ApaarsetuBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApaarsetuBackendApplication.class, args);
    }
}
