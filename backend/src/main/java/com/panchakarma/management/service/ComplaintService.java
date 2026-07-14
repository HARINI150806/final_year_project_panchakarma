package com.panchakarma.management.service;

import com.panchakarma.management.dto.ComplaintRequest;
import com.panchakarma.management.dto.ComplaintResponse;

import java.util.List;

public interface ComplaintService {
    ComplaintResponse createComplaint(ComplaintRequest complaintRequest);
    List<ComplaintResponse> getPatientComplaints();
    ComplaintResponse getComplaintById(Long id);
    ComplaintResponse updateComplaint(Long id, ComplaintRequest complaintRequest);
    List<ComplaintResponse> getAllComplaints();
}
