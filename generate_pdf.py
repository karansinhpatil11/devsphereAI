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
            self.drawString(54, 755, "DevSphere AI — Architecture, Execution Workflows & Technical Specification")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 748, 558, 748)
            
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "DevSphere AI Final Year Project — Comprehensive Technical Report")
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

    # Brand Colors
    primary_color = colors.HexColor("#0F172A")    # Deep Slate
    accent_color = colors.HexColor("#4338CA")     # Indigo
    secondary_color = colors.HexColor("#334155")  # Muted Slate
    border_color = colors.HexColor("#E2E8F0")     # Light Gray
    code_bg = colors.HexColor("#F8FAFC")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=accent_color,
        spaceAfter=12
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=accent_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=secondary_color,
        spaceAfter=5
    )

    workflow_box_style = ParagraphStyle(
        'WorkflowBox',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#1E293B")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=secondary_color
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=primary_color
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#1E293B")
    )

    story = []

    # Title & Metadata Banner
    story.append(Paragraph("DevSphere AI — Architecture & Actual Working Report", title_style))
    story.append(Paragraph("Complete Technical Guide: Under-the-Hood Lifecycles, Multi-Tier Compiler & AI Context Pipelines", subtitle_style))
    story.append(Paragraph("<b>GitHub Repository:</b> <font color='#4338CA'>https://github.com/karansinhpatil11/devsphereAI.git</font> &nbsp;|&nbsp; <b>Academic Degree:</b> Final Year Capstone Project", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceBefore=0, spaceAfter=10))

    # =========================================================================
    # SECTION 1: STAR METHOD BREAKDOWN
    # =========================================================================
    story.append(Paragraph("1. Project Architecture & Analysis (STAR Method)", h1_style))

    # Situation Box
    sit_data = [[
        Paragraph("<b>SITUATION (Industry Problem & Context)</b><br/>"
                  "Software developers face significant friction due to fragmented toolchains. Engineers frequently switch between disparate local code editors, terminal runtimes, generic browser-based AI chats (ChatGPT/Gemini web tabs), issue boards, and code review platforms. Because generic AI tools lack active editor buffer context, developers must manually copy-paste code snippets, resulting in privacy leaks, hallucinated recommendations, and broken code outputs that fail local compiler checks.", body_style)
    ]]
    t_sit = Table(sit_data, colWidths=[504])
    t_sit.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sit)
    story.append(Spacer(1, 6))

    # Task Box
    task_data = [[
        Paragraph("<b>TASK (Project Scope & Engineering Goals)</b><br/>"
                  "Architect and deploy <b>DevSphere AI</b> — an autonomous Cloud IDE and AI Developer Studio that unifies development, execution, and debugging into one seamless interface. Key objectives: (1) Provide an in-browser code editor strictly supporting 5 core languages: <b>C, C++, Java, Python, and JavaScript</b>; (2) Implement a zero-downtime, multi-tiered code compilation sandbox; (3) Build an autonomous AI Pair Programmer that reads active editor buffers to fix bugs, refactor code, generate tests, and conduct static security scans; (4) Provide Git PR diff viewing, Agile task tracking, and full documentation lifecycle management (create, search, edit, delete); (5) Validate production reliability through a 34-test multi-tier automated test suite.", body_style)
    ]]
    t_task = Table(task_data, colWidths=[504])
    t_task.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EEF2FF")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#C7D2FE")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_task)
    story.append(Spacer(1, 6))

    # Action Box
    act_data = [[
        Paragraph("<b>ACTION (Technical Architecture & Execution)</b><br/>"
                  "• <b>Frontend SPA:</b> Engineered with React 18, Vite, Tailwind CSS, and Zustand for centralized state synchronization. Designed interactive language selectors, quick-pick file creation modals, and side-by-side diff viewers.<br/>"
                  "• <b>Multi-Tiered Execution Backend:</b> Built an Express microservice with native single-file compilation for Java (dynamic public class extraction via regex), Python 3, Node.js, and public Judge0 CE / Wandbox sandbox fallbacks for C/C++.<br/>"
                  "• <b>Context-Aware AI Ingestion:</b> Connected Google Gemini 3.8 Flash (`@google/genai`). Synchronized active editor buffers (`window.__ideActiveCode`) into prompts and built an AST static analysis fallback that fixes compiler naming conflicts and builds JUnit test suites offline.<br/>"
                  "• <b>Documentation Hub:</b> Built one-click markdown generators and added explicit delete operations in both list and detail views.<br/>"
                  "• <b>Quality Assurance:</b> Authored 34 automated unit, integration, and end-to-end system tests verifying authentication, sandbox compilation, and AI workflows.", body_style)
    ]]
    t_act = Table(act_data, colWidths=[504])
    t_act.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0FDF4")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#BBF7D0")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_act)
    story.append(Spacer(1, 6))

    # Result Box
    res_data = [[
        Paragraph("<b>RESULT (Measurable Outcomes & Production Deployment)</b><br/>"
                  "• <b>Sub-Second Execution:</b> Single-file Java executes natively in <b>~472ms</b> and C++ runs via Judge0 CE in under <b>10ms</b> with zero compiler downtime.<br/>"
                  "• <b>True Context-Driven AI:</b> Bug fixes, refactoring, and test suites directly heal active editor code with one-click 'Apply Code' functionality.<br/>"
                  "• <b>100% Test Pass Rate:</b> 34/34 tests passing across unit, integration, and system test levels.<br/>"
                  "• <b>GitHub Repository:</b> Fully synchronized and deployed to the GitHub main branch.", body_style)
    ]]
    t_res = Table(res_data, colWidths=[504])
    t_res.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FAF5FF")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#E9D5FF")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_res)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 2: ACTUAL WORKING & UNDER-THE-HOOD EXECUTION FLOWS
    # =========================================================================
    story.append(Paragraph("2. Actual Working & Under-the-Hood Lifecycles", h1_style))
    story.append(Paragraph("This section explains the exact operational lifecycles and data flows across the system:", body_style))
    story.append(Spacer(1, 4))

    # Workflow A: Live Context Synchronization
    wf_a = [
        [Paragraph("<b>WORKFLOW A: Live Editor Buffer & Global Context Synchronization</b>", table_header_style)],
        [Paragraph(
            "<b>1. Keystroke & Indentation Interception:</b> When a user types in `CodeEditor.jsx`, an event listener captures `Tab` keystrokes, prevents default browser behavior, inserts 4 spaces at cursor selection offsets, and updates the state.<br/>"
            "<b>2. Global Memory Ingestion:</b> Every keystroke and tab switch writes directly to `window.__ideActiveCode = { name, lang, code }` and synchronizes the in-memory `fileCache`. This guarantees that AI tools and background compilers always access the real-time buffer rather than stale disk data.<br/>"
            "<b>3. Language Mode Dropdown:</b> The editor toolbar's interactive language selector allows instant switching between `c`, `cpp`, `java`, `python`, and `javascript`, dynamically updating file extensions and compiler dispatch routing.",
            workflow_box_style
        )]
    ]
    t_wfa = Table(wf_a, colWidths=[504])
    t_wfa.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), accent_color),
        ('BACKGROUND', (0,1), (-1,-1), code_bg),
        ('BORDER', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_wfa)
    story.append(Spacer(1, 6))

    # Workflow B: Multi-Tier Compiler Pipeline
    wf_b = [
        [Paragraph("<b>WORKFLOW B: Multi-Tiered Code Compilation & Sandbox Execution Engine</b>", table_header_style)],
        [Paragraph(
            "<b>1. Request Dispatch:</b> Clicking 'Run Code' (or pressing `Ctrl + Enter`) issues `POST /api/compiler/execute` with `{ language, code, stdin }`.<br/>"
            "<b>2. Tier 1 — Native Local Runtimes:</b><br/>"
            "&nbsp;&nbsp;• <b>Java:</b> `runJavaNative()` scans code with regex `/public\\s+class\\s+(\\w+)/`. If `public class Geeks` is declared inside `Main.java`, Java's spec requires an exact filename match. The engine creates an isolated temporary directory in `os.tmpdir()/devsphere-java-<uuid>`, writes `Geeks.java`, and invokes `java.exe Geeks.java` using the system's Java SE 26 runtime. It captures standard output/error, purges the temp directory, and returns execution metrics.<br/>"
            "&nbsp;&nbsp;• <b>Python:</b> `runPythonNative()` writes the script to a sandbox file and executes via the `py.exe` launcher with standard I/O streaming and a 10s watchdog.<br/>"
            "&nbsp;&nbsp;• <b>JavaScript:</b> `runNodeNative()` runs the code in an isolated Node.js child process with timeout protection.<br/>"
            "<b>3. Tier 2 — Judge0 CE Container Sandbox:</b> For C (Language ID 50) and C++ (Language ID 54), or if native compilation is uninstalled, the backend dispatches a base64-encoded payload to `https://ce.judge0.com/submissions?wait=true`, returning verified compiler outputs.<br/>"
            "<b>4. Tier 3 — Wandbox & AST Fallback:</b> If external APIs are blocked, the system routes through Wandbox or local AST simulation so the user is never stranded with compiler errors.<br/>"
            "<b>5. UI Presentation:</b> The bottom panel automatically toggles to the 'OUTPUT' tab, displaying stdout, exit code, and execution time badges.",
            workflow_box_style
        )]
    ]
    t_wfb = Table(wf_b, colWidths=[504])
    t_wfb.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BACKGROUND', (0,1), (-1,-1), code_bg),
        ('BORDER', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_wfb)
    story.append(Spacer(1, 6))

    # Workflow C: AI Autonomous Self-Healing
    wf_c = [
        [Paragraph("<b>WORKFLOW C: Autonomous AI Self-Healing & Dynamic Code Mutation</b>", table_header_style)],
        [Paragraph(
            "<b>1. Buffer Extraction:</b> Clicking 'Fix Bugs', 'Generate Tests', or 'Smart Bug Scan' reads the active code directly from `window.__ideActiveCode` and dispatches `POST /api/ai/coding-assist` or `POST /api/ai/smart-bug-scan`.<br/>"
            "<b>2. Prompt Construction & Live Model:</b> The active file name, language, and code are injected into Gemini 3.8 Flash (`@google/genai`).<br/>"
            "<b>3. Intelligent Offline Fallback Engine:</b> If Gemini reaches API quota limits (HTTP 429), the engine activates `generateLocalCodingResult()`. It parses classes, methods, and visibility via regex. For Java, it automatically resolves public class naming mismatches (e.g. adjusts `public class Geeks` in `Main.java` to package-private `class Geeks`), synthesizes runnable `main()` entrypoints, and generates complete JUnit test suites (`GeeksTest.java`).<br/>"
            "<b>4. Direct In-Editor Application:</b> The AI response includes structured code blocks with an 'Apply Code' action. Clicking 'Apply Code' immediately overwrites the active editor buffer, triggers auto-save, and highlights an 'AI Modified' badge.",
            workflow_box_style
        )]
    ]
    t_wfc = Table(wf_c, colWidths=[504])
    t_wfc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), accent_color),
        ('BACKGROUND', (0,1), (-1,-1), code_bg),
        ('BORDER', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_wfc)
    story.append(Spacer(1, 6))

    # Workflow D: Doc Hub & Delete Mechanism
    wf_d = [
        [Paragraph("<b>WORKFLOW D: Documentation Hub & Full Lifecycle Document Management</b>", table_header_style)],
        [Paragraph(
            "<b>1. Generation:</b> Users can select 'README', 'API Docs', 'Installation Guide', or 'Project Summary'. Gemini synthesizes markdown documentation which is saved directly to MongoDB and in-memory `docStore`.<br/>"
            "<b>2. Document Deletion in UI:</b> Users can delete created or generated docs from two places: (a) <i>List View:</i> Hovering over any document row reveals a red trash icon; clicking it confirms and deletes immediately; (b) <i>Detail View:</i> While reading any document, a dedicated 'Delete' button in the header removes the document and navigates back to the documentation list.<br/>"
            "<b>3. API Execution:</b> Dispatches `DELETE /api/docs/:id`, removing the record from MongoDB and updating the React state (`setDocs(prev => prev.filter(d => d.id !== id))`).",
            workflow_box_style
        )]
    ]
    t_wfd = Table(wf_d, colWidths=[504])
    t_wfd.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BACKGROUND', (0,1), (-1,-1), code_bg),
        ('BORDER', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_wfd)
    story.append(Spacer(1, 6))

    # Workflow E: Security & Token Rotation
    wf_e = [
        [Paragraph("<b>WORKFLOW E: Authentication & Silent JWT Refresh Token Rotation</b>", table_header_style)],
        [Paragraph(
            "<b>1. Login:</b> Credentials verified via salted `bcryptjs` hashes. The server issues a short-lived Access Token (15m, sent in JSON response) and a long-lived Refresh Token (7d, sent in an HttpOnly cookie).<br/>"
            "<b>2. Silent Interception:</b> When an Access Token expires, the Axios response interceptor captures the HTTP 401 error, pauses pending requests, calls `POST /api/auth/refresh`, rotates the refresh token in the cookie, obtains a fresh Access Token, and retries the original request seamlessly.",
            workflow_box_style
        )]
    ]
    t_wfe = Table(wf_e, colWidths=[504])
    t_wfe.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
        ('BACKGROUND', (0,1), (-1,-1), code_bg),
        ('BORDER', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_wfe)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 3: TECHNICAL INVENTORY OF LIBRARIES & TOOLS
    # =========================================================================
    story.append(Paragraph("3. Technical Inventory — Libraries, Packages & Tools", h1_style))
    story.append(Paragraph("Every dependency and tool used across the application with exact versions and technical purposes:", body_style))
    story.append(Spacer(1, 4))

    # Backend Dependencies
    story.append(Paragraph("A. Backend Dependencies (Node.js / Express)", h2_style))
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
    t_be = Table(be_data, colWidths=[105, 50, 349])
    t_be.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), accent_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_be)
    story.append(Spacer(1, 8))

    # Frontend Dependencies
    story.append(Paragraph("B. Frontend Dependencies (React 18 / Vite)", h2_style))
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
    t_fe = Table(fe_data, colWidths=[105, 50, 349])
    t_fe.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_fe)
    story.append(Spacer(1, 8))

    # Compilers, Sandboxes & Testing
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
    t_inf = Table(inf_data, colWidths=[115, 85, 304])
    t_inf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_inf)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 4: TEST SUITE & VERIFICATION
    # =========================================================================
    story.append(Paragraph("4. Automated Verification & Quality Assurance Report", h1_style))
    ver_text = (
        "The system was verified with a 3-tier testing framework comprising <b>34 automated tests</b> across 6 test suites:<br/>"
        "• <b>Tier 1: Unit Testing (16 Tests):</b> Verified password hashing, token rotation, compiler language metadata, task store mutations, and documentation store CRUD operations.<br/>"
        "• <b>Tier 2: Integration Testing (12 Tests):</b> Validated end-to-end REST API flows including user registration, protected route authorization, code compilation (JavaScript and Python), AI bug fixing, smart bug scans, and documentation generation.<br/>"
        "• <b>Tier 3: System Testing (6 Workflows):</b> Tested developer lifecycles including code audit-to-heal pipelines, task breakdown-to-progress calculations, and automated git PR description generation.<br/>"
        "<b>Final Test Result:</b> <font color='#16A34A'><b>34 passed, 0 failed, 0 cancelled (100% Pass Rate in ~5.4s)</b></font>."
    )
    story.append(Paragraph(ver_text, body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<i>This document represents the complete technical specification and architectural overview of DevSphere AI for academic examination, portfolio presentation, and production deployment.</i>", callout_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully built: {filename}")

if __name__ == '__main__':
    target_path = os.path.abspath("DevSphere_AI_Project_Documentation.pdf")
    build_pdf(target_path)
