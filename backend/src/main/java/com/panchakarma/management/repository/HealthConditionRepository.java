package com.panchakarma.management.repository;

import com.panchakarma.management.model.HealthCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HealthConditionRepository extends JpaRepository<HealthCondition, Long> {
}