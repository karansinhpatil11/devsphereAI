import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyAccessToken,
  verifyAndRotateRefreshToken,
} from '../../src/services/authService.js'
import {
  createUser,
  findUserByEmail,
  findUserById,
  saveRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
  users,
} from '../../src/models/userStore.js'

describe('Unit Testing: Auth Service & User Store', () => {
  beforeEach(() => {
    users.clear()
  })

  it('should hash and verify passwords correctly', async () => {
    const raw = 'SecurePass123!'
    const hashed = await hashPassword(raw)
    assert.notEqual(hashed, raw)
    const isValid = await comparePassword(raw, hashed)
    assert.equal(isValid, true)
    const isInvalid = await comparePassword('WrongPassword', hashed)
    assert.equal(isInvalid, false)
  })

  it('should create and retrieve users by email and ID', () => {
    const user = createUser({
      id: 'test-user-1',
      name: 'Test Dev',
      email: 'test@example.com',
      password: 'hashed-password-123',
    })

    assert.equal(user.id, 'test-user-1')
    assert.equal(user.email, 'test@example.com')
    assert.equal(user.role, 'developer')

    const byId = findUserById('test-user-1')
    assert.deepEqual(byId, user)

    const byEmail = findUserByEmail('test@example.com')
    assert.deepEqual(byEmail, user)

    const notFound = findUserByEmail('nonexistent@example.com')
    assert.equal(notFound, null)
  })

  it('should generate valid access and refresh JWT tokens', () => {
    const user = createUser({
      id: 'token-user',
      name: 'Token Dev',
      email: 'token@example.com',
    })

    const { accessToken, refreshToken } = generateTokens(user)
    assert.ok(accessToken, 'Access token must be generated')
    assert.ok(refreshToken, 'Refresh token must be generated')

    const decoded = verifyAccessToken(accessToken)
    assert.equal(decoded.sub, user.id)
    assert.equal(decoded.email, user.email)
    assert.equal(decoded.role, 'developer')

    assert.equal(isRefreshTokenValid(refreshToken), true)
  })

  it('should rotate refresh token and revoke old token', async () => {
    const user = createUser({
      id: 'rotate-user',
      name: 'Rotate Dev',
      email: 'rotate@example.com',
    })

    const { refreshToken } = generateTokens(user)
    assert.equal(isRefreshTokenValid(refreshToken), true)

    const rotated = await verifyAndRotateRefreshToken(refreshToken)
    assert.ok(rotated.accessToken)
    assert.ok(rotated.refreshToken)
    assert.notEqual(rotated.refreshToken, refreshToken)

    // Old token should now be revoked
    assert.equal(isRefreshTokenValid(refreshToken), false)
  })

  it('should throw when an invalid or revoked refresh token is presented', async () => {
    await assert.rejects(
      async () => {
        await verifyAndRotateRefreshToken('fake.invalid.token')
      },
      /Refresh token revoked|jwt malformed/i
    )
  })
})
