package com.icr.backend.storage;

import org.springframework.core.io.Resource;

import java.io.InputStream;

public interface StorageService {

    String store(InputStream inputStream, String directory, String filename, String contentType);

    Resource load(String filePath);

    void delete(String filePath);

    String getPublicUrl(String filePath);
}
