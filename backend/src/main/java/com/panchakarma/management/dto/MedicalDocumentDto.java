package com.panchakarma.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class MedicalDocumentDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long documentId;
        private Long patientId;
        private String patientName;
        private String documentName;
        private String documentType;
        private String fileType;
        private Long fileSize;
        private String uploadedDate;
        private String uploadedBy;
        private String status; // "Uploaded"
    }
}
