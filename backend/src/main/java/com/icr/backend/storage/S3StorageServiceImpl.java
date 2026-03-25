package com.icr.backend.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3StorageServiceImpl implements StorageService {

    private UnsupportedOperationException unsupported() {
        return new UnsupportedOperationException("Configure AWS credentials to enable S3 storage");
    }

    @Override
    public String store(InputStream inputStream, String directory, String filename, String contentType) {
        throw unsupported();
    }

    @Override
    public Resource load(String filePath) {
        throw unsupported();
    }

    @Override
    public void delete(String filePath) {
        throw unsupported();
    }

    @Override
    public String getPublicUrl(String filePath) {
        throw unsupported();
    }
}
