import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000'

describe('System Testing: End-to-End Developer Lifecycle & AI Workflows', () => {
  let authToken = null
  let currentUser = null
  let plannedTaskIds = []
  let generatedDocId = null

  // ── WORKFLOW 1: User Onboarding & Session Security ─────────────────────
  it('Workflow 1: User Registration, JWT Issuance & Authenticated Profile Retrieval', async () => {
    const email = `sysdev_${Date.now()}@devsphere.io`
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Senior DevSphere Engineer',
        email,
        password: 'SecureSystemPassword2026!',
      }),
    })

    assert.equal(regRes.status, 201)
    const regData = await regRes.json()
    assert.ok(regData.accessToken)
    assert.equal(regData.user.email, email)
    authToken = regData.accessToken

    // Verify authenticated session
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    assert.equal(meRes.status, 200)
    currentUser = await meRes.json()
    assert.equal(currentUser.user.email, email)
  })

  // ── WORKFLOW 2: Multi-Language Sandbox Code Compilation ────────────────
  it('Workflow 2: End-to-End Code Compilation, Input Processing & Execution Sandbox', async () => {
    // 1. JavaScript execution with array transformations
    const jsCode = `
      const numbers = [10, 20, 30, 40, 50];
      const sum = numbers.reduce((acc, curr) => acc + curr, 0);
      const avg = sum / numbers.length;
      console.log(\`COMPUTED: sum=\${sum}, avg=\${avg}\`);
    `
    const jsRes = await fetch(`${BASE_URL}/api/compiler/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ language: 'javascript', code: jsCode }),
    })

    assert.equal(jsRes.status, 200)
    const jsData = await jsRes.json()
    assert.equal(jsData.exitCode, 0)
    assert.ok(jsData.stdout.includes('COMPUTED: sum=150, avg=30'))

    // 2. Python execution with data structures
    const pyCode = `
def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print(f"FIB_SEQ={fibonacci(7)}")
    `
    const pyRes = await fetch(`${BASE_URL}/api/compiler/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ language: 'python', code: pyCode }),
    })

    assert.equal(pyRes.status, 200)
    const pyData = await pyRes.json()
    assert.equal(pyData.exitCode, 0)
    assert.ok(pyData.stdout.includes('FIB_SEQ=[0, 1, 1, 2, 3, 5, 8]'))
  })

  // ── WORKFLOW 3: AI Code Auditing, Bug Healing & Test Generation ────────
  it('Workflow 3: AI Code Audit -> Bug Detection -> Code Healing -> Test Suite Generation', async () => {
    const rawVulnerableCode = `
      function getUserRecord(id) {
        if (!id) {
          return null;
        }
        return { id: id, name: "User " + id };
      }

      function processUser(id) {
        const user = getUserRecord(id);
        return user.name.toUpperCase();
      }
    `

    // Step A: Smart Bug Scan identifies unhandled null dereference
    const auditRes = await fetch(`${BASE_URL}/api/ai/smart-bug-scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        code: rawVulnerableCode,
        language: 'javascript',
        fileName: 'userService.js',
      }),
    })

    assert.equal(auditRes.status, 200)
    const audit = await auditRes.json()
    assert.ok(typeof audit.healthScore === 'number')
    assert.ok(audit.summary)

    // Step B: AI Fix Bugs generates hardened code
    const fixRes = await fetch(`${BASE_URL}/api/ai/coding-assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: 'fix_bugs',
        code: rawVulnerableCode,
        language: 'javascript',
        fileName: 'userService.js',
      }),
    })

    assert.equal(fixRes.status, 200)
    const fixed = await fixRes.json()
    assert.equal(fixed.action, 'fix_bugs')
    assert.ok(fixed.code || fixed.content)

    // Step C: AI Generate Tests creates verification suite
    const testGenRes = await fetch(`${BASE_URL}/api/ai/coding-assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: 'generate_tests',
        code: fixed.code || rawVulnerableCode,
        language: 'javascript',
        fileName: 'userService.js',
      }),
    })

    assert.equal(testGenRes.status, 200)
    const testGen = await testGenRes.json()
    assert.equal(testGen.action, 'generate_tests')
    assert.ok(testGen.code || testGen.content)
  })

  // ── WORKFLOW 4: Autonomous Task Planning & Project Progress Tracking ───
  it('Workflow 4: Autonomous Task Planning -> Task Lifecycle Updates -> Metric Recalculation', async () => {
    // Step A: AI Agent plans sprint tasks
    const planRes = await fetch(`${BASE_URL}/api/ai/plan-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ focus: 'resilience, security, performance' }),
    })

    assert.equal(planRes.status, 200)
    const planData = await planRes.json()
    assert.ok(planData.success)
    assert.ok(Array.isArray(planData.tasks))
    assert.ok(planData.tasks.length > 0)
    plannedTaskIds = planData.tasks.map((t) => t.id)

    // Step B: Update one of the tasks to in-progress, then done
    const targetTaskId = plannedTaskIds[0]
    const updateRes = await fetch(`${BASE_URL}/api/tasks/${targetTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'done' }),
    })
    assert.equal(updateRes.status, 200)
    const updated = await updateRes.json()
    assert.equal(updated.status, 'done')

    // Step C: Verify project metrics recalculate
    const progressRes = await fetch(`${BASE_URL}/api/tasks/project/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    assert.equal(progressRes.status, 200)
    const metrics = await progressRes.json()
    assert.ok(typeof metrics.overallProgress === 'number')
    assert.ok(metrics.tasks.completed >= 1)
  })

  // ── WORKFLOW 5: Documentation Generation, Persistence & Knowledge Search ─
  it('Workflow 5: AI Documentation Generation -> Auto-Persistence -> Knowledge Search', async () => {
    // Step A: Generate README documentation with auto-save
    const docRes = await fetch(`${BASE_URL}/api/ai/generate-docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        docType: 'readme',
        saveToDocs: true,
      }),
    })

    assert.equal(docRes.status, 200)
    const docData = await docRes.json()
    assert.ok(docData.title)
    assert.ok(docData.content)
    if (docData.savedId) generatedDocId = docData.savedId

    // Step B: Query knowledge base
    const searchRes = await fetch(`${BASE_URL}/api/docs?q=Microservice`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    assert.equal(searchRes.status, 200)
    const results = await searchRes.json()
    assert.ok(Array.isArray(results))
    assert.ok(results.length > 0)
  })

  // ── WORKFLOW 6: GitHub AI Code Review & Pull Request Description ───────
  it('Workflow 6: Code Diff Analysis & Automated Pull Request Description Generation', async () => {
    const diffSample = `
diff --git a/src/AppService.java b/src/AppService.java
index e69de29..b2a8d11 100644
--- a/src/AppService.java
+++ b/src/AppService.java
@@ -10,3 +10,7 @@ public class AppService {
-    public Data getData() {
-        return repository.fetchData();
+    public Optional<Data> getData() {
+        return Optional.ofNullable(repository.fetchData());
     }
    `

    // Step A: Code Review & Diff Analysis
    const reviewRes = await fetch(`${BASE_URL}/api/ai/analyze-diff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ diff: diffSample }),
    })

    assert.equal(reviewRes.status, 200)
    const reviewData = await reviewRes.json()
    assert.ok(reviewData.analysis || reviewData.content || reviewData.summary)

    // Step B: PR Description Generator
    const prRes = await fetch(`${BASE_URL}/api/ai/generate-pr-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        changes: diffSample,
        diff: diffSample,
        title: 'Harden AppService with Optional Null-Safety',
      }),
    })

    assert.equal(prRes.status, 200)
    const prData = await prRes.json()
    assert.ok(prData.description || prData.content || prData.title || prData.prTitle)
  })
})
