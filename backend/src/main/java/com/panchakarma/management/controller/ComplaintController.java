package com.panchakarma.management.controller;

import com.panchakarma.management.dto.ComplaintRequest;
import com.panchakarma.management.dto.ComplaintResponse;
import com.panchakarma.management.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @PostMapping({"/patient/complaint", "/patient/complaints"})
    public ResponseEntity<ComplaintResponse> createComplaint(@Valid @RequestBody ComplaintRequest complaintRequest) {
        ComplaintResponse createdComplaint = complaintService.createComplaint(complaintRequest);
        return new ResponseEntity<>(createdComplaint, HttpStatus.CREATED);
    }

    @GetMapping({"/patient/complaint", "/patient/complaints"})
    public ResponseEntity<List<ComplaintResponse>> getPatientComplaints() {
        List<ComplaintResponse> complaints = complaintService.getPatientComplaints();
        return ResponseEntity.ok(complaints);
    }

    @GetMapping({"/patient/complaint/{id}", "/patient/complaints/{id}"})
    public ResponseEntity<ComplaintResponse> getComplaintById(@PathVariable Long id) {
        ComplaintResponse complaint = complaintService.getComplaintById(id);
        return ResponseEntity.ok(complaint);
    }

    @PutMapping({"/patient/complaint/{id}", "/patient/complaints/{id}"})
    public ResponseEntity<ComplaintResponse> updateComplaint(@PathVariable Long id, @Valid @RequestBody ComplaintRequest complaintRequest) {
        ComplaintResponse updatedComplaint = complaintService.updateComplaint(id, complaintRequest);
        return ResponseEntity.ok(updatedComplaint);
    }

    @GetMapping("/admin/complaints")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints() {
        List<ComplaintResponse> complaints = complaintService.getAllComplaints();
        return ResponseEntity.ok(complaints);
    }
}
