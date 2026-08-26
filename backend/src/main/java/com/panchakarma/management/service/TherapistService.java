package com.panchakarma.management.service;

import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.PatientSummaryResponse;
import com.panchakarma.management.dto.TherapistAssignedBookingDto;
import com.panchakarma.management.dto.TherapistWalletDto;
import com.panchakarma.management.model.User;

import java.util.List;

public interface TherapistService {
    List<TherapistAssignedBookingDto> getMyBookings();
    List<PatientSummaryResponse> getMyPatients();
    List<User> listTherapists();
    List<TherapistAssignedBookingDto> getAssignedBookingsForPatient(Long patientId);
    
    List<com.panchakarma.management.dto.TherapistWeeklyScheduleDto> getMyWeeklySchedule();
    List<com.panchakarma.management.dto.TherapistWeeklyScheduleDto> updateMyWeeklySchedule(List<com.panchakarma.management.dto.TherapistWeeklyScheduleDto> schedules);
    List<com.panchakarma.management.dto.TherapistDateOverrideDto> getMyDateOverrides();
    com.panchakarma.management.dto.TherapistDateOverrideDto createOrUpdateDateOverride(com.panchakarma.management.dto.TherapistDateOverrideDto override);
    void deleteDateOverride(Long overrideId);

    TherapistWalletDto getTherapistWallet();
}