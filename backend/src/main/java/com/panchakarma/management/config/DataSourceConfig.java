package com.panchakarma.management.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.io.File;
import java.sql.Connection;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/panchakarma_management}")
    private String primaryDbUrl;

    @Value("${spring.datasource.username:postgres}")
    private String primaryDbUsername;

    @Value("${spring.datasource.password:1256Harini..}")
    private String primaryDbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        // 1. Attempt to connect to the configured primary database
        log.info("Checking database connection for primary URL: {}", primaryDbUrl);
        HikariDataSource primaryDs = createHikariDataSource(
                primaryDbUrl,
                primaryDbUsername,
                primaryDbPassword,
                "org.postgresql.Driver",
                3000
        );

        if (testConnection(primaryDs, primaryDbUrl)) {
            log.info("✅ Successfully connected to primary PostgreSQL database: {}", primaryDbUrl);
            return primaryDs;
        }

        log.warn("⚠️ Failed to connect to primary database at {}. Cleaning up primary connection attempt...", primaryDbUrl);
        safeClose(primaryDs);

        // 2. If primary is remote or different from local PostgreSQL, try local PostgreSQL as fallback
        String localPgUrl = "jdbc:postgresql://localhost:5432/panchakarma_management";
        if (!localPgUrl.equalsIgnoreCase(primaryDbUrl.trim())) {
            log.info("Attempting fallback to local PostgreSQL: {}", localPgUrl);
            HikariDataSource localPgDs = createHikariDataSource(
                    localPgUrl,
                    "postgres",
                    "1256Harini..",
                    "org.postgresql.Driver",
                    3000
            );

            if (testConnection(localPgDs, localPgUrl)) {
                log.info("✅ Successfully connected to local PostgreSQL fallback database.");
                return localPgDs;
            }

            log.warn("⚠️ Local PostgreSQL is also unavailable.");
            safeClose(localPgDs);
        }

        // 3. Fallback to embedded local H2 database (persisted to disk)
        File dataDir = new File("data");
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }
        String h2FallbackUrl = "jdbc:h2:file:./data/panchakarma_fallback_db;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1";
        log.warn("🚨 All PostgreSQL databases unavailable. Initializing local embedded H2 database fallback: {}", h2FallbackUrl);

        HikariDataSource h2Ds = createHikariDataSource(
                h2FallbackUrl,
                "sa",
                "",
                "org.h2.Driver",
                5000
        );
        log.info("✅ Local embedded H2 fallback database is active.");
        return h2Ds;
    }

    private HikariDataSource createHikariDataSource(String url, String username, String password, String driverClassName, long timeoutMs) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driverClassName);
        config.setConnectionTimeout(timeoutMs);
        config.setMaximumPoolSize(10);
        return new HikariDataSource(config);
    }

    private boolean testConnection(HikariDataSource ds, String url) {
        try (Connection conn = ds.getConnection()) {
            return conn != null && !conn.isClosed();
        } catch (Exception e) {
            log.warn("Connection test failed for {}: {}", url, e.getMessage());
            return false;
        }
    }

    private void safeClose(HikariDataSource ds) {
        try {
            if (ds != null && !ds.isClosed()) {
                ds.close();
            }
        } catch (Exception ignored) {
        }
    }
}
