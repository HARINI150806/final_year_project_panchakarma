package com.panchakarma.management.controller;

import com.panchakarma.management.dto.MedicalDocumentDto;
import com.panchakarma.management.model.MedicalDocument;
import com.panchakarma.management.service.MedicalDocumentService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/medical-documents")
public class MedicalDocumentController {

    private final MedicalDocumentService documentService;

    public MedicalDocumentController(MedicalDocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/upload")
    public ResponseEntity<MedicalDocumentDto.Response> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @AuthenticationPrincipal UserDetails userDetails) {
        MedicalDocumentDto.Response response = documentService.uploadDocument(file, documentType, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient")
    public ResponseEntity<List<MedicalDocumentDto.Response>> getMyMedicalDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<MedicalDocumentDto.Response> list = documentService.getPatientDocuments(userDetails.getUsername());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalDocumentDto.Response>> getMedicalDocumentsByPatientId(
            @PathVariable Long patientId) {
        List<MedicalDocumentDto.Response> list = documentService.getPatientDocumentsByPatientId(patientId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}/view")
    public ResponseEntity<Resource> viewDocument(@PathVariable Long id) {
        MedicalDocument doc = documentService.getDocumentEntity(id);
        Resource resource = documentService.loadDocumentAsResource(doc);

        String contentType = doc.getFileType() != null ? doc.getFileType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getDocumentName() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        MedicalDocument doc = documentService.getDocumentEntity(id);
        Resource resource = documentService.loadDocumentAsResource(doc);

        String contentType = doc.getFileType() != null ? doc.getFileType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getDocumentName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        documentService.deleteDocument(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
