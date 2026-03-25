package com.icr.backend.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageServiceImpl implements StorageService {

    @Override
    public String store(InputStream inputStream, String directory, String filename, String contentType) {
        try {
            Path targetDirectory = Paths.get(directory).toAbsolutePath().normalize();
            Files.createDirectories(targetDirectory);
            Path destination = targetDirectory.resolve(filename).normalize();
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
            return destination.toString();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file", ex);
        }
    }

    @Override
    public Resource load(String filePath) {
        try {
            return new UrlResource(Paths.get(filePath).toUri());
        } catch (Exception ex) {
            throw new RuntimeException("Failed to load file", ex);
        }
    }

    @Override
    public void delete(String filePath) {
        try {
            Files.deleteIfExists(Paths.get(filePath));
        } catch (IOException ex) {
            throw new RuntimeException("Failed to delete file", ex);
        }
    }

    @Override
    public String getPublicUrl(String filePath) {
        return filePath;
    }
}
