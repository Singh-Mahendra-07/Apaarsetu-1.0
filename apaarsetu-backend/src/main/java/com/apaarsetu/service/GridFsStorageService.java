package com.apaarsetu.service;

import com.apaarsetu.common.exception.BadRequestException;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import com.mongodb.client.gridfs.model.GridFSFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GridFsStorageService {

    private final GridFsTemplate gridFsTemplate;

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public String storeFile(MultipartFile file, String studentId, String uploadedBy) {
        if (file.isEmpty()) {
            throw new BadRequestException("Cannot upload an empty file");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds maximum allowed 10MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Only PDF, PNG, JPG, or JPEG evidence files are permitted");
        }

        String sanitizedFilename = sanitizeFilename(file.getOriginalFilename());
        String storedFilename = studentId + "_" + UUID.randomUUID().toString().substring(0, 8) + "_" + sanitizedFilename;

        try {
            byte[] fileBytes = file.getBytes();
            validateMagicBytes(fileBytes, contentType);

            Document metadata = new Document();
            metadata.put("studentId", studentId);
            metadata.put("uploadedBy", uploadedBy);
            metadata.put("originalFilename", sanitizedFilename);
            metadata.put("contentType", contentType);

            try (InputStream is = new java.io.ByteArrayInputStream(fileBytes)) {
                ObjectId fileId = gridFsTemplate.store(is, storedFilename, contentType, metadata);
                log.info("Stored file '{}' in GridFS with ID: {}", storedFilename, fileId);
                return storedFilename;
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to store file in GridFS: {}", e.getMessage());
            throw new RuntimeException("Could not store evidence file in MongoDB GridFS", e);
        }
    }

    public String storeFile(InputStream is, String originalFilename, String contentType, String entityId, String category) {
        String sanitizedFilename = sanitizeFilename(originalFilename);
        String storedFilename = entityId + "_" + UUID.randomUUID().toString().substring(0, 8) + "_" + sanitizedFilename;
        Document metadata = new Document();
        metadata.put("entityId", entityId);
        metadata.put("category", category);
        metadata.put("originalFilename", sanitizedFilename);
        metadata.put("contentType", contentType);

        ObjectId fileId = gridFsTemplate.store(is, storedFilename, contentType != null ? contentType : "application/pdf", metadata);
        log.info("Stored stream file '{}' in GridFS with ID: {}", storedFilename, fileId);
        return storedFilename;
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "evidence_" + UUID.randomUUID() + ".pdf";
        }
        String base = java.nio.file.Path.of(filename).getFileName().toString();
        String clean = base.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (clean.isBlank()) {
            clean = "evidence_" + UUID.randomUUID() + ".pdf";
        }
        return clean;
    }

    private void validateMagicBytes(byte[] bytes, String contentType) {
        if (bytes == null || bytes.length < 4) {
            throw new BadRequestException("Uploaded file is too small or corrupt");
        }
        String mime = contentType.toLowerCase();
        if ("application/pdf".equals(mime)) {
            if (!(bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46)) {
                throw new BadRequestException("File content signature does not match PDF format");
            }
        } else if ("image/png".equals(mime)) {
            if (!((bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47)) {
                throw new BadRequestException("File content signature does not match PNG format");
            }
        } else if ("image/jpeg".equals(mime) || "image/jpg".equals(mime)) {
            if (!((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF)) {
                throw new BadRequestException("File content signature does not match JPEG format");
            }
        }
    }

    public GridFsResource getFile(String filename) {
        GridFSFile gridFSFile = gridFsTemplate.findOne(new Query(Criteria.where("filename").is(filename)));
        if (gridFSFile == null) {
            throw new ResourceNotFoundException("Evidence document not found: " + filename);
        }
        return gridFsTemplate.getResource(gridFSFile);
    }

    public void deleteFile(String filename) {
        gridFsTemplate.delete(new Query(Criteria.where("filename").is(filename)));
        log.info("Deleted file '{}' from GridFS", filename);
    }
}
