// ── DevSphere File Storage & Language Registry ──

export const INITIAL_FILES = {
  'AppController.java': {
    name: 'AppController.java',
    path: 'src/main/java/com/company/service/AppController.java',
    lang: 'java',
    content: `package com.company.service;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
public class AppController {

    private final AppService appService;

    public AppController(AppService appService) {
        this.appService = appService;
    }

    @GetMapping("/data")
    public ResponseEntity<Data> getData() {
        Optional<Data> result = appService.getData();
        return result
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/status")
    public ResponseEntity<String> getStatus() {
        return ResponseEntity.ok("Service is running smoothly (v1.0.0)");
    }
}`,
  },
  'AppService.java': {
    name: 'AppService.java',
    path: 'src/main/java/com/company/service/AppService.java',
    lang: 'java',
    content: `package com.company.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

@Service
public class AppService {

    private static final Logger logger = LoggerFactory.getLogger(AppService.class);
    private final DataRepository repository;

    public AppService(DataRepository repository) {
        this.repository = repository;
    }

    public Optional<Data> getData() {
        try {
            Data data = repository.fetchData();
            return Optional.ofNullable(data);
        } catch (Exception ex) {
            logger.error("Failed to fetch data from repository: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    public String checkSystemStatus() {
        return "ACTIVE";
    }
}`,
  },
  'application.yml': {
    name: 'application.yml',
    path: 'src/main/resources/application.yml',
    lang: 'yaml',
    content: `server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: core-service
  data:
    mongodb:
      uri: mongodb://localhost:27017/developer_assistant
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=500,expireAfterAccess=300s

logging:
  level:
    root: INFO
    com.company.service: DEBUG`,
  },
  'AppControllerTest.java': {
    name: 'AppControllerTest.java',
    path: 'src/test/java/com/company/service/AppControllerTest.java',
    lang: 'java',
    content: `package com.company.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.http.ResponseEntity;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AppControllerTest {

    private AppService appService;
    private AppController appController;

    @BeforeEach
    void setUp() {
        appService = mock(AppService.class);
        appController = new AppController(appService);
    }

    @Test
    void testGetDataReturnsOk() {
        Data mockData = new Data("test-data");
        when(appService.getData()).thenReturn(Optional.of(mockData));

        ResponseEntity<Data> response = appController.getData();
        assertEquals(200, response.getStatusCodeValue());
        assertNotNull(response.getBody());
    }
}`,
  },
  'pom.xml': {
    name: 'pom.xml',
    path: 'pom.xml',
    lang: 'xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.company</groupId>
    <artifactId>core-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>core-service</name>
    <properties>
        <java.version>17</java.version>
    </properties>
</project>`,
  },
}

// In-memory runtime cache for open/edited files
export const fileCache = { ...INITIAL_FILES }

/**
 * Detect language identifier from filename extension
 */
export function detectLanguage(filename = '') {
  const ext = filename.split('.').pop().toLowerCase()
  const map = {
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    java: 'java',
    py: 'python',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
  }
  return map[ext] || 'c'
}

/**
 * Generate standard boilerplate starter code for any language
 */
export function getBoilerplate(filename = '', targetLang = '') {
  const lang = targetLang || detectLanguage(filename)
  switch (lang) {
    case 'c':
      return `// ${filename || 'main.c'}\n#include <stdio.h>\n\nint main() {\n    printf("Hello from C in DevSphere AI Studio!\\n");\n    int a = 15, b = 27;\n    printf("Sum: %d\\n", a + b);\n    return 0;\n}\n`
    case 'cpp':
      return `// ${filename || 'main.cpp'}\n#include <iostream>\n#include <vector>\n\nint main() {\n    std::cout << "Hello from C++ in DevSphere AI Studio!" << std::endl;\n    std::vector<std::string> tools = {"VS Code UI", "Compiler", "Gemini AI"};\n    for (const auto& tool : tools) {\n        std::cout << "  • " << tool << std::endl;\n    }\n    return 0;\n}\n`
    case 'java': {
      const className = filename.replace(/\.[^.]+$/, '') || 'Main'
      return `// ${filename || 'Main.java'}\npublic class ${className} {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java in DevSphere AI Studio!");\n    }\n}\n`
    }
    case 'python':
      return `# ${filename || 'main.py'}\n"""\nDevSphere AI Python Script\n"""\n\ndef main():\n    print("Hello from Python in DevSphere AI Studio!")\n    numbers = [x * 2 for x in range(1, 6)]\n    print(f"Computed numbers: {numbers}")\n\nif __name__ == '__main__':\n    main()\n`
    case 'javascript':
      return `// ${filename || 'index.js'}\n/**\n * DevSphere AI JavaScript Script\n */\n\nfunction main() {\n  console.log("Hello from JavaScript in DevSphere AI Studio!");\n  const techStack = ["Node.js", "React", "Gemini 3.8", "Tailwind"];\n  console.log("Active Stack:", techStack.join(" • "));\n}\n\nmain();\n`
    default:
      return `// ${filename || 'main.c'}\n#include <stdio.h>\n\nint main() {\n    printf("Hello from C in DevSphere AI Studio!\\n");\n    return 0;\n}\n`
  }
}

/**
 * Helper to get or initialize file in cache
 */
export function getOrCreateFile(filename, initialContent = null) {
  if (fileCache[filename]) {
    return fileCache[filename]
  }

  const lang = detectLanguage(filename)
  const content = initialContent !== null ? initialContent : getBoilerplate(filename, lang)
  const fileObj = {
    name: filename,
    path: `src/${filename}`,
    lang,
    content,
    createdAt: new Date().toISOString(),
  }

  fileCache[filename] = fileObj
  return fileObj
}

/**
 * Set or update file content in cache
 */
export function setCachedFile(filename, content, lang = null) {
  const language = lang || detectLanguage(filename)
  fileCache[filename] = {
    name: filename,
    path: fileCache[filename]?.path || `src/${filename}`,
    lang: language,
    content,
    updatedAt: new Date().toISOString(),
  }
  return fileCache[filename]
}

