import React, { useState, useEffect } from 'react'
import { Copy, Check, GitPullRequest, FileCode, Play, Sparkles } from 'lucide-react'
import useStore from '../store/useStore'
import { githubAPI } from '../services/api'

export const REPO_FILES = {
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

    /**
     * Refactored in PR #452 to safely handle potential NullPointerExceptions
     */
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
    com.company.service: DEBUG

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics`,
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

    @Test
    void testGetDataReturnsNotFound() {
        when(appService.getData()).thenReturn(Optional.empty());

        ResponseEntity<Data> response = appController.getData();
        assertEquals(404, response.getStatusCodeValue());
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
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    <groupId>com.company</groupId>
    <artifactId>core-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>core-service</name>
    <description>Core Service with AI Developer Assistant integration</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-mongodb</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>`,
  },
}

// In-memory cache for edits across tab switching
export const fileCache = { ...REPO_FILES }

export default function CodeEditor({ tabId }) {
  const { setActiveEditorTab, setSelectedDiffFile, activeRepoName } = useStore()
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Resolve matching file key
  const resolveFileKey = (id) => {
    if (!id) return 'AppController.java'
    if (fileCache[id]) return id
    if (fileCache[`${id}.java`]) return `${id}.java`
    if (fileCache[`${id}.yml`]) return `${id}.yml`
    if (fileCache[`${id}.xml`]) return `${id}.xml`
    const found = Object.keys(fileCache).find((k) => k.toLowerCase().startsWith(id.toLowerCase()))
    return found || id
  }

  const fileKey = resolveFileKey(tabId)
  const currentFile = fileCache[fileKey] || {
    name: fileKey.includes('.') ? fileKey : `${fileKey}.java`,
    path: `src/main/java/com/company/service/${fileKey.includes('.') ? fileKey : `${fileKey}.java`}`,
    lang: fileKey.endsWith('.yml') ? 'yaml' : fileKey.endsWith('.xml') ? 'xml' : 'java',
    content: `package com.company.service;\n\npublic class ${fileKey.replace(/\.[^.]+$/, '')} {\n    // Code for ${fileKey}\n}`,
  }

  const [code, setCode] = useState(currentFile.content)

  useEffect(() => {
    const key = resolveFileKey(tabId)
    if (fileCache[key]) {
      setCode(fileCache[key].content)
    } else {
      // Attempt fetching from backend API
      setIsLoading(true)
      githubAPI
        .getFile(activeRepoName || 'core-service', tabId)
        .then((res) => {
          if (res.data?.content) {
            fileCache[key] = {
              name: tabId,
              path: res.data.path || tabId,
              lang: 'java',
              content: res.data.content,
            }
            setCode(res.data.content)
          }
        })
        .catch(() => {
          setCode(currentFile.content)
        })
        .finally(() => setIsLoading(false))
    }
  }, [tabId, activeRepoName])

  const handleCodeChange = (e) => {
    const val = e.target.value
    setCode(val)
    if (!fileCache[fileKey]) {
      fileCache[fileKey] = {
        name: currentFile.name,
        path: currentFile.path,
        lang: currentFile.lang,
        content: val,
      }
    } else {
      fileCache[fileKey].content = val
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const lines = (code || '').split('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCompareDiff = () => {
    setSelectedDiffFile(currentFile.name)
    setActiveEditorTab('pr-452')
  }

  return (
    <div className="flex flex-col h-full bg-ide-bg overflow-hidden text-xs font-mono">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-ide-sidebar border-b border-ide-border shrink-0 text-ide-text">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileCode size={13} className="text-ide-accent shrink-0" />
          <span className="text-ide-text-bright font-semibold truncate">{currentFile.name}</span>
          <span className="text-[10px] text-ide-text/40 hidden sm:inline">
            ({currentFile.path})
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-ide-accent/15 text-ide-accent border border-ide-accent/30">
            {currentFile.lang}
          </span>
          <span className="text-[10px] text-ide-text/40">({lines.length} lines)</span>
          {saved && (
            <span className="text-[10px] text-ide-green flex items-center gap-1 animate-pulse">
              <Check size={10} /> Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick jump to PR Diff for this file */}
          {(currentFile.name === 'AppController.java' || currentFile.name === 'AppService.java') && (
            <button
              onClick={handleCompareDiff}
              title="Compare in PR #452 Diff"
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-ide-purple/15 text-ide-purple hover:bg-ide-purple/25 border border-ide-purple/30 transition-colors cursor-pointer text-[11px]"
            >
              <GitPullRequest size={11} />
              <span>Compare Diff</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy Code"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer text-[11px]"
          >
            {copied ? <Check size={11} className="text-ide-green" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Editor body with synchronized line numbers and textarea */}
      <div className="flex-1 flex overflow-hidden relative bg-[#0b1021]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-ide-text/50">
            Loading file content...
          </div>
        ) : (
          <>
            {/* Line numbers column */}
            <div className="w-12 py-3 bg-[#080d1c] select-none border-r border-ide-border/50 text-right pr-3 text-ide-text/30 font-mono overflow-hidden shrink-0">
              {lines.map((_, idx) => (
                <div key={idx} className="leading-6 h-6">
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Editable textarea */}
            <textarea
              value={code}
              onChange={handleCodeChange}
              spellCheck={false}
              className="flex-1 p-3 bg-transparent text-ide-text-bright font-mono text-xs leading-6 resize-none outline-none overflow-auto whitespace-pre tab-4 border-none selection:bg-ide-accent/30 caret-ide-accent"
            />
          </>
        )}
      </div>
    </div>
  )
}
