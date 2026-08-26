package com.panchakarma.management.service;

import com.panchakarma.management.dto.GoogleMeetRequest;
import com.panchakarma.management.dto.GoogleMeetResponse;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import com.google.auth.oauth2.UserCredentials;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;
import com.google.api.client.util.DateTime;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.UUID;

@Service
public class GoogleMeetService {

    @Value("${google.calendar.client-id}")
    private String clientId;

    @Value("${google.calendar.client-secret}")
    private String clientSecret;

    @Value("${google.meet.default-link}")
    private String defaultLink;

    @Value("${google.calendar.refresh-token}")
    private String refreshToken;

    /**
     * Generates a Google Meet link for a consultation.
     * Checks configurations and uses:
     * 1. The static default meet link if configured.
     * 2. The Google Calendar API to create a real meeting if refresh token is configured.
     * 3. A mock meet link as a fallback.
     */
    public GoogleMeetResponse scheduleMeeting(GoogleMeetRequest request) {
        // 1. Check if a static default meet link is configured
        if (defaultLink != null && !defaultLink.trim().isEmpty()) {
            System.out.println("Using static default Google Meet link: " + defaultLink);
            return new GoogleMeetResponse(defaultLink.trim(), UUID.randomUUID().toString());
        }

        // 2. Try to use Google Calendar API to create a real meeting
        if (refreshToken != null && !refreshToken.trim().isEmpty() &&
            clientId != null && !clientId.trim().isEmpty() &&
            clientSecret != null && !clientSecret.trim().isEmpty()) {
            
            try {
                System.out.println("Attempting to schedule a real Google Meet via Calendar API...");
                Calendar service = getCalendarService();
                
                Event event = new Event()
                    .setSummary(request.summary())
                    .setDescription("Panchakarma Consultation - Online");
                
                EventDateTime startTime = new EventDateTime()
                    .setDateTime(convertToGoogleDateTime(request.startDateTime()))
                    .setTimeZone(ZoneId.systemDefault().getId());
                EventDateTime endTime = new EventDateTime()
                    .setDateTime(convertToGoogleDateTime(request.endDateTime()))
                    .setTimeZone(ZoneId.systemDefault().getId());
                
                event.setStart(startTime);
                event.setEnd(endTime);
                
                EventAttendee patientAttendee = new EventAttendee().setEmail(request.patientEmail());
                EventAttendee doctorAttendee = new EventAttendee().setEmail(request.doctorEmail());
                event.setAttendees(Arrays.asList(patientAttendee, doctorAttendee));
                
                // Add conference request for Google Meet
                ConferenceData conferenceData = new ConferenceData();
                CreateConferenceRequest createRequest = new CreateConferenceRequest()
                    .setRequestId(UUID.randomUUID().toString())
                    .setConferenceSolutionKey(new ConferenceSolutionKey().setType("hangoutsMeet"));
                conferenceData.setCreateRequest(createRequest);
                event.setConferenceData(conferenceData);
                
                Event createdEvent = service.events().insert("primary", event)
                    .setConferenceDataVersion(1)
                    .execute();
                
                String meetLink = null;
                if (createdEvent.getConferenceData() != null && 
                    createdEvent.getConferenceData().getEntryPoints() != null && 
                    !createdEvent.getConferenceData().getEntryPoints().isEmpty()) {
                    meetLink = createdEvent.getConferenceData().getEntryPoints().get(0).getUri();
                }
                
                if (meetLink != null) {
                    System.out.println("Successfully generated real Google Meet link: " + meetLink);
                    return new GoogleMeetResponse(meetLink, createdEvent.getId());
                } else {
                    System.err.println("Google Calendar event created, but no Meet link was returned in conference data.");
                }
            } catch (Exception e) {
                System.err.println("Error scheduling meeting with Google Calendar API: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("Google Calendar API credentials/refresh token not fully configured. Using mock link.");
        }

        // 3. Fallback to mock meet link
        String meetId = generateMockMeetId();
        String meetLink = "https://meet.google.com/" + meetId;
        String eventId = UUID.randomUUID().toString();
        
        System.out.println("Generated mock Google Meet link (will show invalid code on Google): " + meetLink);
        return new GoogleMeetResponse(meetLink, eventId);
    }

    /**
     * Checks doctor availability for a given time slot.
     * In production, this would check the doctor's calendar.
     */
    public boolean isDoctorAvailable(String doctorEmail, LocalDateTime startTime, LocalDateTime endTime) {
        // In production, this would:
        // 1. Query the doctor's calendar using Google Calendar API
        // 2. Check for conflicts with existing events
        // 3. Respect doctor's working hours

        // For now, return true (available)
        return true;
    }

    /**
     * Finds the next available slot for the doctor.
     * In production, this would check the doctor's calendar.
     */
    public LocalDateTime findNextAvailableSlot(String doctorEmail, LocalDateTime preferredTime) {
        // In production, this would:
        // 1. Query the doctor's calendar
        // 2. Find the next available 30-60 minute slot
        // 3. Consider doctor's working hours and preferences

        // For now, return the preferred time
        return preferredTime;
    }

    /**
     * Cancels a Google Meet event.
     */
    public void cancelMeeting(String eventId) {
        // In production, this would:
        // 1. Authenticate with Google OAuth 2.0
        // 2. Use Google Calendar API to delete the event
        // 3. Send cancellation emails to attendees
    }

    /**
     * Updates a Google Meet event.
     */
    public GoogleMeetResponse updateMeeting(String eventId, GoogleMeetRequest request) {
        // In production, this would:
        // 1. Authenticate with Google OAuth 2.0
        // 2. Update the event in Google Calendar API
        // 3. Notify attendees of the change

        return scheduleMeeting(request);
    }

    private String generateMockMeetId() {
        String alphabet = "abcdefghijklmnopqrstuvwxyz";
        java.util.Random random = new java.util.Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 3; i++) {
            sb.append(alphabet.charAt(random.nextInt(26)));
        }
        sb.append('-');
        for (int i = 0; i < 4; i++) {
            sb.append(alphabet.charAt(random.nextInt(26)));
        }
        sb.append('-');
        for (int i = 0; i < 3; i++) {
            sb.append(alphabet.charAt(random.nextInt(26)));
        }
        return sb.toString();
    }

    private Calendar getCalendarService() throws Exception {
        UserCredentials credentials = UserCredentials.newBuilder()
                .setClientId(clientId)
                .setClientSecret(clientSecret)
                .setRefreshToken(refreshToken)
                .build();

        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("Panchakarma Management")
                .build();
    }

    private DateTime convertToGoogleDateTime(LocalDateTime localDateTime) {
        java.time.ZonedDateTime zonedDateTime = localDateTime.atZone(ZoneId.systemDefault());
        return new DateTime(zonedDateTime.toInstant().toEpochMilli());
    }
}
