import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAllIssues,
  getProjectData,
  getProjectProgress,
} from '../../src/models/taskStore.js'

describe('Unit Testing: Task Store & Project Progress', () => {
  it('should create and retrieve a new development task', () => {
    const task = createTask({
      title: 'Unit Test Task Creation',
      description: 'Verifying task model integrity',
      priority: 'high',
      status: 'todo',
      assignee: 'Tester',
    })

    assert.ok(task.id.startsWith('task-'))
    assert.equal(task.title, 'Unit Test Task Creation')
    assert.equal(task.priority, 'high')
    assert.equal(task.status, 'todo')

    const fetched = getTaskById(task.id)
    assert.deepEqual(fetched, task)
  })

  it('should update task status and priority', () => {
    const task = createTask({
      title: 'Task To Update',
      priority: 'low',
      status: 'todo',
    })

    const updated = updateTask(task.id, {
      status: 'done',
      priority: 'high',
    })

    assert.equal(updated.status, 'done')
    assert.equal(updated.priority, 'high')
    assert.ok(new Date(updated.updatedAt).getTime() >= new Date(task.createdAt).getTime())
  })

  it('should delete a task and return null upon subsequent retrieval', () => {
    const task = createTask({
      title: 'Task To Delete',
      priority: 'medium',
    })

    const deleted = deleteTask(task.id)
    assert.equal(deleted, true)

    const notFound = getTaskById(task.id)
    assert.equal(notFound, null)
  })

  it('should return valid project issues and project progress metrics', () => {
    const issues = getAllIssues()
    assert.ok(Array.isArray(issues))
    assert.ok(issues.length > 0)

    const data = getProjectData()
    assert.ok(data.name)
    assert.ok(data.architecture)

    const progress = getProjectProgress()
    assert.ok(typeof progress.overallProgress === 'number')
    assert.ok(progress.overallProgress >= 0 && progress.overallProgress <= 100)
    assert.ok(typeof progress.readinessScore === 'number')
    assert.ok(progress.activeMilestone)
  })
})
