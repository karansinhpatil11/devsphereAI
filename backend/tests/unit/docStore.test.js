import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getAllDocs,
  getDocById,
  searchDocs,
  createDoc,
  updateDoc,
  deleteDoc,
} from '../../src/models/docStore.js'

describe('Unit Testing: Documentation Store', () => {
  it('should retrieve existing documentation entries', () => {
    const all = getAllDocs()
    assert.ok(Array.isArray(all))
    assert.ok(all.length > 0)
  })

  it('should create and retrieve a new document', () => {
    const doc = createDoc({
      title: 'Unit Test Documentation',
      category: 'Testing',
      content: 'Detailed testing instructions for the developer platform.',
      tags: ['test', 'unit', 'qa'],
    })

    assert.ok(doc.id.startsWith('doc-'))
    assert.equal(doc.title, 'Unit Test Documentation')
    assert.equal(doc.category, 'Testing')

    const fetched = getDocById(doc.id)
    assert.deepEqual(fetched, doc)
  })

  it('should search documents by keyword query', () => {
    createDoc({
      title: 'Specialized Webhook Architecture Guide',
      category: 'Architecture',
      content: 'Explains asynchronous webhook listeners and delivery guarantees.',
      tags: ['webhook', 'async'],
    })

    const results = searchDocs('webhook')
    assert.ok(results.length > 0)
    assert.ok(results.some((d) => d.title.includes('Webhook')))
  })

  it('should update document properties', () => {
    const doc = createDoc({
      title: 'Doc To Update',
      category: 'General',
      content: 'Initial text',
    })

    const updated = updateDoc(doc.id, {
      title: 'Updated Documentation Title',
      content: 'Updated revised text',
      category: 'Guides',
    })

    assert.equal(updated.title, 'Updated Documentation Title')
    assert.equal(updated.content, 'Updated revised text')
    assert.equal(updated.category, 'Guides')
  })

  it('should delete a document successfully', () => {
    const doc = createDoc({
      title: 'Doc To Delete',
      category: 'Temporary',
    })

    const deleted = deleteDoc(doc.id)
    assert.equal(deleted, true)

    const notFound = getDocById(doc.id)
    assert.equal(notFound, null)
  })
})
