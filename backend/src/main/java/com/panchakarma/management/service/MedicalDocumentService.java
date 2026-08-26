package com.panchakarma.management.service;

import com.panchakarma.management.dto.MedicalDocumentDto;
import com.panchakarma.management.model.MedicalDocument;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.MedicalDocumentRepository;
import com.panchakarma.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MedicalDocumentService {

    private final MedicalDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final Path storageLocation;

    public MedicalDocumentService(MedicalDocumentRepository documentRepository,
                                  UserRepository userRepository,
                                  @Value("${file.upload-dir:uploads/medical-documents}") String uploadDir) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.storageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.storageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create directory for medical document uploads.", ex);
        }
    }

    @Transactional
    public MedicalDocumentDto.Response uploadDocument(MultipartFile file, String documentType, String patientEmail) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        // Limit file size to 10 MB (10 * 1024 * 1024 bytes)
        long maxSizeBytes = 10 * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 10MB");
        }

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();
        String extension = getFileExtension(originalFilename).toLowerCase();

        // Validate allowed file types: PDF, JPG, JPEG, PNG
        if (!extension.equals("pdf") && !extension.equals("jpg") && !extension.equals("jpeg") && !extension.equals("png")) {
            throw new IllegalArgumentException("Unsupported file type. Only PDF, JPG, JPEG, and PNG files are allowed.");
        }

        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        String storedFilename = UUID.randomUUID().toString() + "_" + (originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_") : "document");
        Path targetPath = this.storageLocation.resolve(storedFilename);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + originalFilename, e);
        }

        MedicalDocument document = new MedicalDocument();
        document.setPatient(patient);
        document.setDocumentName(originalFilename != null ? originalFilename : "Document");
        document.setDocumentType(documentType != null && !documentType.isBlank() ? documentType : "Other");
        document.setFilePath(targetPath.toString());
        document.setFileType(contentType != null ? contentType : getMimeType(extension));
        document.setFileSize(file.getSize());
        document.setUploadedBy(patient.getFullName());

        MedicalDocument saved = documentRepository.save(document);
        return mapToDto(saved);
    }

    public List<MedicalDocumentDto.Response> getPatientDocuments(String patientEmail) {
        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        return documentRepository.findByPatientIdOrderByUploadedDateDesc(patient.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<MedicalDocumentDto.Response> getPatientDocumentsByPatientId(Long patientId) {
        return documentRepository.findByPatientIdOrderByUploadedDateDesc(patientId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public MedicalDocument getDocumentEntity(Long documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID " + documentId));
    }

    public Resource loadDocumentAsResource(MedicalDocument document) {
        try {
            Path filePath = Paths.get(document.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read document file: " + document.getDocumentName());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Could not read document file: " + document.getDocumentName(), e);
        }
    }

    @Transactional
    public void deleteDocument(Long documentId, String requestingUserEmail) {
        MedicalDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID " + documentId));

        // Delete physical file
        try {
            Path filePath = Paths.get(document.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log and proceed with entity deletion
        }

        documentRepository.delete(document);
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    private String getMimeType(String extension) {
        switch (extension.toLowerCase()) {
            case "pdf": return "application/pdf";
            case "png": return "image/png";
            case "jpg":
            case "jpeg": return "image/jpeg";
            default: return "application/octet-stream";
        }
    }

    private MedicalDocumentDto.Response mapToDto(MedicalDocument doc) {
        MedicalDocumentDto.Response dto = new MedicalDocumentDto.Response();
        dto.setDocumentId(doc.getDocumentId());
        dto.setPatientId(doc.getPatient() != null ? doc.getPatient().getId() : null);
        dto.setPatientName(doc.getPatient() != null ? doc.getPatient().getFullName() : null);
        dto.setDocumentName(doc.getDocumentName());
        dto.setDocumentType(doc.getDocumentType());
        dto.setFileType(doc.getFileType());
        dto.setFileSize(doc.getFileSize());
        dto.setUploadedDate(doc.getUploadedDate() != null ? doc.getUploadedDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) : "");
        dto.setUploadedBy(doc.getUploadedBy());
        dto.setStatus("Uploaded");
        return dto;
    }
}
