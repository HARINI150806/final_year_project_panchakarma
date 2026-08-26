package com.panchakarma.management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class PanchakarmaManagementApplication {

    static {
        try {
            java.io.File envFile = new java.io.File(".env");
            if (!envFile.exists()) {
                envFile = new java.io.File("backend/.env");
            }
            if (!envFile.exists()) {
                envFile = new java.io.File("../.env");
            }
            if (envFile.exists()) {
                System.out.println("Loading environment variables from: " + envFile.getAbsolutePath());
                java.nio.file.Files.lines(envFile.toPath())
                        .map(String::trim)
                        .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                        .forEach(line -> {
                            int eqIdx = line.indexOf('=');
                            if (eqIdx > 0) {
                                String key = line.substring(0, eqIdx).trim();
                                String val = line.substring(eqIdx + 1).trim();
                                if ("MAIL_PASSWORD".equalsIgnoreCase(key)) {
                                    val = val.replaceAll("\\s+", "");
                                }
                                System.setProperty(key, val);
                            }
                        });
            } else {
                System.out.println(".env file not found. System environment/properties will be used.");
            }
        } catch (Exception e) {
            System.err.println("Failed to load .env file: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        SpringApplication.run(PanchakarmaManagementApplication.class, args);
    }
}
