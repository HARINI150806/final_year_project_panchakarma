package com.panchakarma.management.service;

import com.panchakarma.management.dto.DashboardStatsResponse;
import com.panchakarma.management.model.UserRole;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    public DashboardStatsResponse buildDashboard(UserRole role) {
        List<Map<String, Object>> stats = switch (role) {
            case ADMIN -> List.of(
                    stat("Total Patients", "184", "+12 this month"),
                    stat("Care Staff", "14", "2 available now"),
                    stat("Therapists", "21", "18 on duty"),
                    stat("Today's Appointments", "39", "7 pending confirmation")
            );
            case THERAPIST -> List.of(
                    stat("Assigned Sessions", "8", "2 in progress"),
                    stat("Completed Today", "5", "3 remaining"),
                    stat("Room Utilization", "82%", "Across 6 rooms"),
                    stat("Patient Updates", "11", "Need review")
            );
            case PATIENT -> List.of(
                    stat("Upcoming Appointments", "3", "Next on Thursday"),
                    stat("Therapy Sessions", "9/12", "Treatment plan progress"),
                    stat("Recovery Score", "74%", "Improving steadily"),
                    stat("Notifications", "4", "2 reminders today")
            );
        };

        List<Map<String, Object>> activities = List.of(
                Map.of("title", "Therapy appointment confirmed", "time", "09:15 AM"),
                Map.of("title", "Dosha assessment updated", "time", "10:40 AM"),
                Map.of("title", "Recovery note added by therapist", "time", "12:05 PM"),
                Map.of("title", "Follow-up reminder scheduled", "time", "02:30 PM")
        );

        List<Map<String, Object>> modules = switch (role) {
            case ADMIN -> List.of(
                    module("Manage care team", "Onboard, edit, and assign staff"),
                    module("Manage therapists", "Track schedules and availability"),
                    module("Manage therapy rooms", "Allocate rooms automatically"),
                    module("Recovery reports", "View trends and feedback")
            );
            case THERAPIST -> List.of(
                    module("Assigned therapies", "See today's therapy list"),
                    module("Session updates", "Record pain, sleep, and energy"),
                    module("Patient history", "Review previous therapy notes"),
                    module("Completion tracking", "Mark sessions completed")
            );
            case PATIENT -> List.of(
                    module("Book consultation", "Schedule care visits"),
                    module("Book therapy", "Auto-assign therapist and room"),
                    module("Track recovery", "View charts and progress bars"),
                    module("Feedback", "Rate therapies and care quality")
            );
        };

        return new DashboardStatsResponse(stats, activities, modules);
    }

    private Map<String, Object> stat(String title, String value, String subtitle) {
        return Map.of("title", title, "value", value, "subtitle", subtitle);
    }

    private Map<String, Object> module(String title, String description) {
        return Map.of("title", title, "description", description);
    }
}
