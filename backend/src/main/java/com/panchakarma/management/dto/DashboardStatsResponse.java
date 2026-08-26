package com.panchakarma.management.dto;

import java.util.List;
import java.util.Map;

public record DashboardStatsResponse(
        List<Map<String, Object>> stats,
        List<Map<String, Object>> activities,
        List<Map<String, Object>> modules
) {
}
