import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000'

describe('Integration Testing: Complete API & Services Flow', () => {
  let authToken = null
  let refreshTokenCookie = null
  let testUserId = null
  let createdTaskId = null
  let createdDocId = null

  const testUser = {
    name: 'Integration Tester',
    email: `integ_${Date.now()}@devsphere.ai`,
    password: 'Password123!',
  }

  it('1. System Health & Infrastructure API: GET /api/health', async () => {
    const res = await fetch(`${BASE_URL}/api/health`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.status, 'ok')
    assert.ok(data.aiProvider)
    assert.ok(data.database)
  })

  it('2. Auth API: POST /api/auth/register', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    })

    assert.equal(res.status, 201)
    const data = await res.json()
    assert.ok(data.user)
    assert.equal(data.user.email, testUser.email)
    assert.ok(data.accessToken)
    assert.equal(data.user.password, undefined) // Sensitive data stripped

    authToken = data.accessToken
    testUserId = data.user.id

    // Check Set-Cookie for refresh token
    const rawCookie = res.headers.get('set-cookie')
    if (rawCookie) {
      const match = rawCookie.match(/refreshToken=([^;]+)/)
      if (match) refreshTokenCookie = match[1]
    }
  })

  it('3. Auth API: POST /api/auth/login', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.accessToken)
    assert.ok(data.user)
    authToken = data.accessToken
  })

  it('4. Auth API: GET /api/auth/me (Protected Route with JWT Bearer)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.user)
    assert.equal(data.user.email, testUser.email)
  })

  it('5. Compiler API: GET /api/compiler/languages', async () => {
    const res = await fetch(`${BASE_URL}/api/compiler/languages`)
    assert.equal(res.status, 200)
    const data = await res.json()
    const languages = data.languages || data
    assert.ok(Array.isArray(languages))
    assert.ok(languages.length >= 7)
    const jsLang = languages.find((l) => l.id === 'javascript')
    assert.ok(jsLang)
    assert.equal(jsLang.extension, 'js')
  })

  it('6. Compiler API: POST /api/compiler/execute (JavaScript execution)', async () => {
    const payload = {
      language: 'javascript',
      code: `
        const a = 35;
        const b = 15;
        console.log("INTEGRATION_SUM=" + (a + b));
      `,
    }

    const res = await fetch(`${BASE_URL}/api/compiler/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.exitCode, 0)
    assert.ok(data.stdout.includes('INTEGRATION_SUM=50'))
  })

  it('7. Compiler API: POST /api/compiler/execute (Python 3 execution)', async () => {
    const payload = {
      language: 'python',
      code: 'print("INTEGRATION_PY_CALC=" + str(sum([10, 20, 30])))',
    }

    const res = await fetch(`${BASE_URL}/api/compiler/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.exitCode, 0)
    assert.ok(data.stdout.includes('INTEGRATION_PY_CALC=60'))
  })

  it('8. AI Coding Assist: POST /api/ai/coding-assist (Action: fix_bugs)', async () => {
    const buggyCode = `
      function calculateAverage(numbers) {
        let sum = 0;
        for (let i = 0; i <= numbers.length; i++) {
          sum += numbers[i];
        }
        return sum / numbers.length;
      }
    `
    const res = await fetch(`${BASE_URL}/api/ai/coding-assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: 'fix_bugs',
        code: buggyCode,
        language: 'javascript',
        fileName: 'average.js',
      }),
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.action === 'fix_bugs')
    assert.ok(data.code || data.result)
  })

  it('9. AI Coding Assist: POST /api/ai/coding-assist (Action: generate_tests)', async () => {
    const code = `
      export function multiply(a, b) {
        return a * b;
      }
    `
    const res = await fetch(`${BASE_URL}/api/ai/coding-assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: 'generate_tests',
        code,
        language: 'javascript',
        fileName: 'math.js',
      }),
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.action === 'generate_tests')
    assert.ok(data.code || data.result)
  })

  it('10. Smart Bug Scan: POST /api/ai/smart-bug-scan', async () => {
    const vulnerableCode = `
      app.get('/user', (req, res) => {
        const query = "SELECT * FROM users WHERE id = '" + req.query.id + "'";
        db.query(query);
      });
    `
    const res = await fetch(`${BASE_URL}/api/ai/smart-bug-scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        code: vulnerableCode,
        language: 'javascript',
        fileName: 'auth.js',
      }),
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(typeof data.healthScore === 'number')
    assert.ok(Array.isArray(data.securityIssues) || Array.isArray(data.issues))
  })

  it('11. Task Tracker API: CRUD & Progress Flow', async () => {
    // 1. GET all tasks
    const getRes = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    assert.equal(getRes.status, 200)
    const tasks = await getRes.json()
    assert.ok(Array.isArray(tasks))

    // 2. POST create a new task
    const postRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: 'Integration Test Task',
        description: 'Verify task creation through integration API',
        priority: 'high',
        status: 'todo',
      }),
    })
    assert.equal(postRes.status, 201)
    const created = await postRes.json()
    assert.ok(created.id)
    assert.equal(created.title, 'Integration Test Task')
    createdTaskId = created.id

    // 3. PUT update task status
    const putRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'done' }),
    })
    assert.equal(putRes.status, 200)
    const updated = await putRes.json()
    assert.equal(updated.status, 'done')

    // 4. GET project progress
    const progressRes = await fetch(`${BASE_URL}/api/tasks/project/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    assert.equal(progressRes.status, 200)
    const progress = await progressRes.json()
    assert.ok(typeof progress.overallProgress === 'number')

    // 5. DELETE the task
    const delRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    })
    assert.equal(delRes.status, 200)
  })

  it('12. Documentation API: CRUD & Search Flow', async () => {
    // 1. POST create documentation
    const postRes = await fetch(`${BASE_URL}/api/docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: 'Integration API Specs',
        category: 'API Reference',
        content: '# Integration API Specs\nDetailed documentation for API testing.',
        tags: ['integration', 'test', 'api'],
      }),
    })
    assert.equal(postRes.status, 201)
    const doc = await postRes.json()
    assert.ok(doc.id)
    createdDocId = doc.id

    // 2. GET search docs
    const searchRes = await fetch(`${BASE_URL}/api/docs?q=Integration`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    assert.equal(searchRes.status, 200)
    const searchResults = await searchRes.json()
    assert.ok(Array.isArray(searchResults))
    assert.ok(searchResults.some((d) => d.id === createdDocId))

    // 3. DELETE doc
    const delRes = await fetch(`${BASE_URL}/api/docs/${createdDocId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    })
    assert.equal(delRes.status, 200)
  })

  it('13. AI Interactive Chat: POST /api/ai/chat', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message: 'Hello DevSphere AI assistant! Please confirm you are online.',
      }),
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    const responseText = data.content || data.reply || data.message || ''
    assert.ok(responseText.length > 5)
  })
})
