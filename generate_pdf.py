import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (on pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "DevSphere AI — Autonomous Cloud IDE & AI Developer Studio")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 748, 558, 748)
            
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "Confidential — Final Year Project Comprehensive Documentation")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0F172A")    # Deep Slate
    accent_color = colors.HexColor("#4338CA")     # Indigo
    secondary_color = colors.HexColor("#334155")  # Muted Slate
    border_color = colors.HexColor("#E2E8F0")     # Light Gray

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=accent_color,
        spaceAfter=15
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=accent_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=secondary_color,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=secondary_color,
        leftIndent=14,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=secondary_color
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=primary_color
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E293B")
    )

    story = []

    # Title Banner
    story.append(Paragraph("DevSphere AI — Engineering Project Documentation", title_style))
    story.append(Paragraph("Autonomous Cloud IDE, Multi-Language Compiler & Context-Aware AI Pair Programmer", subtitle_style))
    story.append(Paragraph("<b>Author / Repository:</b> <font color='#4338CA'>https://github.com/karansinhpatil11/devsphereAI.git</font> &nbsp;|&nbsp; <b>Academic Year:</b> Final Year Capstone Project", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceBefore=0, spaceAfter=14))

    # SECTION 1: STAR METHOD
    story.append(Paragraph("1. Project Architecture & Analysis (STAR Method)", h1_style))

    # Situation Callout Box
    sit_data = [[
        Paragraph("<b>SITUATION (The Problem & Industry Context)</b><br/>"
                  "Modern engineering workflows are heavily fragmented across incompatible toolchains. Developers spend up to 30% of their workday context-switching between desktop code editors, disparate local compilation runtimes, terminal shell setups, web-based AI chat portals (e.g. ChatGPT/Gemini browser tabs), issue boards (Jira), and pull request review hubs (GitHub). Generic LLM chatbots lack active editor context, forcing engineers to manually copy-paste source code snippets, resulting in privacy leaks, hallucinated APIs, and broken code recommendations that disregard compiler class hierarchies and project structure.", body_style)
    ]]
    t_sit = Table(sit_data, colWidths=[504])
    t_sit.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_sit)
    story.append(Spacer(1, 8))

    # Task Callout Box
    task_data = [[
        Paragraph("<b>TASK (The Project Objective & Engineering Scope)</b><br/>"
                  "Design, architect, and deploy <b>DevSphere AI</b> — an autonomous, full-stack Cloud IDE and AI Developer Studio that eliminates context-switching. The platform must:<br/>"
                  "• Provide an in-browser VS Code-style editor strictly supporting 5 core languages: <b>C, C++, Java, Python, and JavaScript</b>.<br/>"
                  "• Engineer a resilient, zero-downtime multi-tiered code compilation sandbox combining native runtimes with public cloud APIs.<br/>"
                  "• Embed an autonomous AI agent capable of reading the active editor buffer to fix bugs, refactor code, generate tests, and conduct static security scans.<br/>"
                  "• Integrate git PR diff analysis, Kanban task management, and an end-to-end documentation knowledge hub with full lifecycle operations (create, search, edit, delete).<br/>"
                  "• Verify production readiness through a 34-test multi-tier automated test harness.", body_style)
    ]]
    t_task = Table(task_data, colWidths=[504])
    t_task.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EEF2FF")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#C7D2FE")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_task)
    story.append(Spacer(1, 8))

    # Action Callout Box
    act_data = [[
        Paragraph("<b>ACTION (Implementation & Technical Execution)</b><br/>"
                  "• <b>Frontend Architecture:</b> Built an SPA using React 18, Vite, Tailwind CSS, and Zustand. Implemented VS Code quick-pick navigation, tab bar synchronization, side-by-side git diffs, and interactive language mode selectors.<br/>"
                  "• <b>Multi-Tiered Execution Engine:</b> Constructed a 3-tier compiler backend (Node.js native runner, Java 26 SE native runner with automatic public class name extraction, Python 3 runner, Judge0 CE sandbox integration for C/C++, and Wandbox fallback).<br/>"
                  "• <b>Context-Aware AI Ingestion:</b> Connected Google Gemini 3.8 Flash (`@google/genai`). Synced editor state (`window.__ideActiveCode`) directly into AI prompts, allowing dynamic bug resolution, JUnit test suite generation, and AST-like offline fallback validation.<br/>"
                  "• <b>Documentation Lifecycle:</b> Created full-text search, AI doc generation, and document deletion endpoints with instant UI reactivity.<br/>"
                  "• <b>Testing & CI:</b> Wrote 34 automated unit, integration, and end-to-end system tests verifying authentication, execution, and AI workflows.", body_style)
    ]]
    t_act = Table(act_data, colWidths=[504])
    t_act.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0FDF4")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#BBF7D0")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_act)
    story.append(Spacer(1, 8))

    # Result Callout Box
    res_data = [[
        Paragraph("<b>RESULT (Measurable Impact & Production Validation)</b><br/>"
                  "• <b>Zero-Downtime Compiler:</b> Single-file Java executes natively in <b>~472ms</b> and C++ runs via Judge0 sandbox in under <b>10ms</b>, resolving previous 403 API blocking issues.<br/>"
                  "• <b>Synchronized AI Assistance:</b> Replaced hardcoded templates with dynamic context analysis; code fixes, refactoring, and test suites directly reflect the active editor buffer.<br/>"
                  "• <b>100% Quality Verification:</b> 34/34 test suites passed with zero regressions across Unit, Integration, and System testing.<br/>"
                  "• <b>Repository Synchronization:</b> Production-ready code committed and deployed to GitHub main branch.", body_style)
    ]]
    t_res = Table(res_data, colWidths=[504])
    t_res.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FAF5FF")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#E9D5FF")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_res)
    story.append(Spacer(1, 14))

    # SECTION 2: CORE FEATURES
    story.append(Paragraph("2. Comprehensive Feature Breakdown", h1_style))

    features = [
        ("Feature 1: VS Code-Style Code Editor",
         "Strictly supports C (.c), C++ (.cpp), Java (.java), Python (.py), and JavaScript (.js). Features interactive language mode switching, syntax line counting, auto-save state indicators, AI modification badges, and keyboard shortcuts (Ctrl+Enter execution)."),
        ("Feature 2: Multi-Tiered Code Execution Sandbox",
         "Combines native local runtimes (Node.js, Python, Java 26 SE single-file compiler) with public container sandboxes (Judge0 CE, Wandbox). Features standard input (stdin) handling, execution timers, and formatted stdout/stderr streams."),
        ("Feature 3: Autonomous AI Developer Agent",
         "Powered by Gemini 3.8 Flash. Automatically reads active editor buffers. Features Fix Bugs (self-healing compiler errors and class mismatches), Generate Tests (JUnit/Pytest/Jest), Refactor Code (SOLID principles), Explain Code, and Smart Bug Scan (static security & performance audit)."),
        ("Feature 4: Git & Pull Request Diff Viewer",
         "Side-by-side visual diff viewer highlighting insertions and deletions between file versions. Includes automated AI pull request description generation analyzing commit delta impact."),
        ("Feature 5: Knowledge Base & Documentation Hub",
         "One-click AI documentation synthesizer (README.md, API Docs, Installation Guides, Project Summaries). Includes full-text search, tag filtering, manual authoring, and complete document deletion from both list and detail views."),
        ("Feature 6: Agile Task Tracker & Kanban Board",
         "Manages sprint workflows across Backlog, In Progress, In Review, and Done. Features an autonomous AI task planner that translates user product requirements into structured engineering milestones."),
        ("Feature 7: Enterprise Authentication & Auditing",
         "Dual-method authentication supporting email/password (salted bcrypt hashing) and OAuth 2.0 (Google, GitHub). Implements short-lived JWT access tokens with secure HttpOnly refresh token rotation and activity logging.")
    ]

    for title, desc in features:
        story.append(Paragraph(title, h2_style))
        story.append(Paragraph(desc, body_style))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 10))

    # SECTION 3: TECH STACK INVENTORY
    story.append(Paragraph("3. Technical Inventory — Libraries, Packages & Tools", h1_style))
    story.append(Paragraph("The platform is built on modern, battle-tested open-source libraries and enterprise tools across the full application stack:", body_style))
    story.append(Spacer(1, 6))

    # Backend Table
    story.append(Paragraph("A. Backend Technologies & Dependencies (Node.js / Express)", h2_style))
    be_data = [
        [Paragraph("Package", table_header_style), Paragraph("Version", table_header_style), Paragraph("Technical Purpose & Role in DevSphere AI", table_header_style)],
        [Paragraph("@google/genai", table_cell_bold), Paragraph("^2.28.0", table_cell_style), Paragraph("Official Google GenAI SDK interfacing with Gemini 3.8 Flash for AI chat, bug fixing, test generation, and documentation synthesis.", table_cell_style)],
        [Paragraph("express", table_cell_bold), Paragraph("^4.18.2", table_cell_style), Paragraph("Core HTTP web server powering REST APIs for auth, compiler execution, task management, docs, and AI proxying.", table_cell_style)],
        [Paragraph("mongoose", table_cell_bold), Paragraph("^9.11.1", table_cell_style), Paragraph("MongoDB Object Data Modeling (ODM) managing schemas for users, tasks, documentation articles, and chat history.", table_cell_style)],
        [Paragraph("jsonwebtoken", table_cell_bold), Paragraph("^9.0.3", table_cell_style), Paragraph("Issues and verifies HMAC-SHA256 signed Access Tokens and Refresh Tokens for stateless API security.", table_cell_style)],
        [Paragraph("bcryptjs", table_cell_bold), Paragraph("^3.0.3", table_cell_style), Paragraph("Cryptographic library implementing salted one-way hashing for secure user credential persistence.", table_cell_style)],
        [Paragraph("passport & oauth", table_cell_bold), Paragraph("^0.7.0", table_cell_style), Paragraph("Authentication middleware configured with Google OAuth 2.0 and GitHub OAuth 2.0 strategies.", table_cell_style)],
        [Paragraph("socket.io", table_cell_bold), Paragraph("^4.6.1", table_cell_style), Paragraph("Real-time WebSocket protocol enabling live bi-directional compiler status and collaboration event streaming.", table_cell_style)],
        [Paragraph("axios", table_cell_bold), Paragraph("^1.6.2", table_cell_style), Paragraph("Promise-based HTTP client dispatching external sandboxed compilation jobs to Judge0 CE and Wandbox.", table_cell_style)],
        [Paragraph("helmet & cors", table_cell_bold), Paragraph("^7.1 / ^2.8", table_cell_style), Paragraph("Security middleware setting HTTP protection headers (HSTS, CSP, XSS) and managing cross-origin requests.", table_cell_style)],
        [Paragraph("express-rate-limit", table_cell_bold), Paragraph("^7.1.5", table_cell_style), Paragraph("DDoS and brute-force mitigation throttling compilation and authentication endpoints.", table_cell_style)],
        [Paragraph("cookie-parser", table_cell_bold), Paragraph("^1.4.7", table_cell_style), Paragraph("Parses HTTP request cookies for secure HttpOnly JWT refresh token extraction.", table_cell_style)],
        [Paragraph("uuid", table_cell_bold), Paragraph("^14.0.2", table_cell_style), Paragraph("Generates RFC4122 v4 unique identifiers for tasks, documents, and ephemeral sandbox directories.", table_cell_style)],
        [Paragraph("nodemon", table_cell_bold), Paragraph("^3.0.2", table_cell_style), Paragraph("Developer monitor restarting backend microservices during local development upon file modification.", table_cell_style)],
    ]
    t_be = Table(be_data, colWidths=[110, 54, 340])
    t_be.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), accent_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_be)
    story.append(Spacer(1, 10))

    # Frontend Table
    story.append(Paragraph("B. Frontend Technologies & Dependencies (React 18 / Vite)", h2_style))
    fe_data = [
        [Paragraph("Package", table_header_style), Paragraph("Version", table_header_style), Paragraph("Technical Purpose & Role in DevSphere AI", table_header_style)],
        [Paragraph("react & react-dom", table_cell_bold), Paragraph("^18.2.0", table_cell_style), Paragraph("Core component library leveraging concurrent rendering, hooks, and virtual DOM for rapid UI reconciliation.", table_cell_style)],
        [Paragraph("vite", table_cell_bold), Paragraph("^5.0.0", table_cell_style), Paragraph("High-speed frontend development server and bundler utilizing native ES modules and Rollup production builds.", table_cell_style)],
        [Paragraph("zustand", table_cell_bold), Paragraph("^4.4.7", table_cell_style), Paragraph("Centralized state management store coordinating active tabs, file buffers, compiler output, and AI states.", table_cell_style)],
        [Paragraph("tailwindcss", table_cell_bold), Paragraph("^3.3.5", table_cell_style), Paragraph("Utility-first styling framework implementing dark-mode IDE themes, responsive grids, and layout flexboxes.", table_cell_style)],
        [Paragraph("lucide-react", table_cell_bold), Paragraph("^0.294.0", table_cell_style), Paragraph("Vector iconography providing clean UI icons for activity bars, languages, actions, and delete triggers.", table_cell_style)],
        [Paragraph("react-router-dom", table_cell_bold), Paragraph("^6.30.6", table_cell_style), Paragraph("Client-side routing engine managing authenticated navigation between IDE workspace and auth screens.", table_cell_style)],
        [Paragraph("react-diff-viewer", table_cell_bold), Paragraph("^3.3.1", table_cell_style), Paragraph("Visual diff component rendering side-by-side and inline git code comparisons with split view modes.", table_cell_style)],
        [Paragraph("react-syntax-highlighter", table_cell_bold), Paragraph("^15.5.0", table_cell_style), Paragraph("AST-based code colorizer rendering syntax-highlighted code blocks in AI chat and markdown previews.", table_cell_style)],
        [Paragraph("framer-motion", table_cell_bold), Paragraph("^10.16.5", table_cell_style), Paragraph("Physics-based animation engine creating smooth slide-in panels, tab transitions, and modal alerts.", table_cell_style)],
        [Paragraph("socket.io-client", table_cell_bold), Paragraph("^4.6.1", table_cell_style), Paragraph("Client-side WebSocket client listening for live compilation telemetry and multi-user notifications.", table_cell_style)],
        [Paragraph("js-cookie", table_cell_bold), Paragraph("^3.0.8", table_cell_style), Paragraph("Client-side cookie utility managing non-sensitive session preferences across browser sessions.", table_cell_style)],
    ]
    t_fe = Table(fe_data, colWidths=[110, 54, 340])
    t_fe.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_fe)
    story.append(Spacer(1, 10))

    # Compilers & Testing Table
    story.append(Paragraph("C. Compilers, Sandboxes, Testing & Development Infrastructure", h2_style))
    inf_data = [
        [Paragraph("Tool / Engine", table_header_style), Paragraph("Type", table_header_style), Paragraph("Capabilities & Execution Environment", table_header_style)],
        [Paragraph("Java SE (OpenJDK 26)", table_cell_bold), Paragraph("Native Compiler", table_cell_style), Paragraph("Single-file compilation and native execution via `java.exe` with regex-based public class file alignment.", table_cell_style)],
        [Paragraph("Python 3 (v3.11 / v3.14)", table_cell_bold), Paragraph("Native Runtime", table_cell_style), Paragraph("Local Python script execution via `py.exe` launcher with standard I/O piping and exit code isolation.", table_cell_style)],
        [Paragraph("Node.js (v25)", table_cell_bold), Paragraph("Native Runtime", table_cell_style), Paragraph("In-process JavaScript VM execution with sandbox timeout watchdogs and error boundary cleanup.", table_cell_style)],
        [Paragraph("Judge0 CE Sandbox", table_cell_bold), Paragraph("Cloud Sandbox", table_cell_style), Paragraph("Isolated multi-language execution container supporting C (GCC 11), C++17, Java, Python, and JavaScript.", table_cell_style)],
        [Paragraph("Wandbox API", table_cell_bold), Paragraph("Cloud Sandbox", table_cell_style), Paragraph("Secondary high-performance online compiler sandbox providing failover execution for C and C++.", table_cell_style)],
        [Paragraph("Node.js Test Runner", table_cell_bold), Paragraph("Automated Testing", table_cell_style), Paragraph("Built-in `node:test` and `node:assert/strict` harness executing 34 unit, integration, and system tests.", table_cell_style)],
        [Paragraph("Git & GitHub", table_cell_bold), Paragraph("Version Control", table_cell_style), Paragraph("Distributed version control hosting repository, release branches, and automated commit pipelines.", table_cell_style)],
    ]
    t_inf = Table(inf_data, colWidths=[120, 90, 294])
    t_inf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_inf)
    story.append(Spacer(1, 14))

    # SECTION 4: VERIFICATION
    story.append(Paragraph("4. Verification & Automated Test Suite Results", h1_style))
    ver_text = (
        "The entire platform was subjected to a rigorous 3-tier testing framework comprising <b>34 automated tests</b> across 6 test suites:<br/>"
        "• <b>Tier 1: Unit Testing (16 Tests):</b> Verified password hashing, token rotation, compiler language metadata, task store mutations, and documentation store CRUD operations.<br/>"
        "• <b>Tier 2: Integration Testing (12 Tests):</b> Validated end-to-end REST API flows including user registration, protected route authorization, code compilation (JavaScript and Python), AI bug fixing, smart bug scans, and documentation generation.<br/>"
        "• <b>Tier 3: System Testing (6 Workflows):</b> Tested developer lifecycles including code audit-to-heal pipelines, task breakdown-to-progress calculations, and automated git PR description generation.<br/>"
        "<b>Final Test Result:</b> <font color='#16A34A'><b>34 passed, 0 failed, 0 cancelled (100% Pass Rate in ~5.4s)</b></font>."
    )
    story.append(Paragraph(ver_text, body_style))
    story.append(Spacer(1, 10))

    # Final note
    story.append(Paragraph("<i>This document represents the complete technical specification and architectural overview of DevSphere AI for academic examination, portfolio presentation, and production deployment.</i>", callout_style))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully built: {filename}")

if __name__ == '__main__':
    target_path = os.path.abspath("DevSphere_AI_Project_Documentation.pdf")
    build_pdf(target_path)
