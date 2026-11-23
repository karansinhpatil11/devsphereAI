import React, { useState, useEffect } from 'react'
import { docAPI, generateDocs } from '../services/api'
import { BookOpen, Search, Plus, FileText, ChevronRight, ArrowLeft, Sparkles, Loader2, Trash2 } from 'lucide-react'

export default function DocPanel() {
  const [docs, setDocs] = useState([])
  const [search, setSearch] = useState('')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showAiMenu, setShowAiMenu] = useState(false)
  const [generatingAi, setGeneratingAi] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('General')
  const [newContent, setNewContent] = useState('')

  const fetchDocs = async (query = '') => {
    setLoading(true)
    try {
      const res = await docAPI.getDocs(query)
      setDocs(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDoc = async (id, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this document?')) return
    try {
      await docAPI.deleteDoc(id)
      setDocs((prev) => prev.filter((d) => d.id !== id))
      if (selectedDoc && selectedDoc.id === id) {
        setSelectedDoc(null)
      }
    } catch (err) {
      console.error('Failed to delete doc:', err)
    }
  }

  useEffect(() => {
    fetchDocs(search)
  }, [search])

  const handleAiGenerate = async (docType) => {
    setGeneratingAi(true)
    setShowAiMenu(false)
    try {
      const res = await generateDocs({
        docType,
        saveToDocs: true,
      })
      await fetchDocs()
      if (res.data) {
        setSelectedDoc({
          title: res.data.title,
          category: res.data.category,
          content: res.data.content,
          tags: res.data.tags || [],
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingAi(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      const res = await docAPI.createDoc({
        title: newTitle,
        category: newCategory,
        content: newContent,
      })
      setDocs([res.data, ...docs])
      setSelectedDoc(res.data)
      setShowCreate(false)
      setNewTitle('')
      setNewContent('')
    } catch (e) {
      console.error(e)
    }
  }

  if (selectedDoc) {
    return (
      <div className="flex flex-col h-full overflow-hidden text-xs">
        {/* Back header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-ide-border shrink-0 bg-ide-bg">
          <button
            onClick={() => setSelectedDoc(null)}
            className="flex items-center gap-1 text-[11px] text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>All Docs</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-ide-accent bg-ide-accent/10 px-2 py-0.5 rounded-full font-medium">
              {selectedDoc.category}
            </span>
            <button
              onClick={(e) => handleDeleteDoc(selectedDoc.id, e)}
              className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded transition-colors cursor-pointer border border-rose-500/20"
              title="Delete Document"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <h2 className="text-sm font-bold text-ide-text-bright">{selectedDoc.title}</h2>
          <div className="text-[11px] text-ide-text/70 whitespace-pre-wrap leading-relaxed font-mono bg-ide-bg p-3 rounded-xl border border-ide-border/50">
            {selectedDoc.content}
          </div>
          {selectedDoc.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {selectedDoc.tags.map((t) => (
                <span key={t} className="text-[9px] bg-ide-border/40 text-ide-text/50 px-1.5 py-0.5 rounded">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Search Header */}
      <div className="p-2 border-b border-ide-border shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-ide-text/40 font-semibold uppercase tracking-wider">
            Documentation ({docs.length})
          </span>
          <div className="flex items-center gap-1.5 relative">
            <button
              onClick={() => setShowAiMenu(!showAiMenu)}
              disabled={generatingAi}
              className="flex items-center gap-1 text-[11px] text-ide-purple hover:text-ide-purple/80 transition-colors cursor-pointer disabled:opacity-50"
              title="Generate with Gemini"
            >
              {generatingAi ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              <span>AI Generate</span>
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1 text-[11px] text-ide-accent hover:text-ide-accent-hover transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>New</span>
            </button>

            {/* AI Generator Dropdown Menu */}
            {showAiMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-ide-panel border border-ide-border rounded-xl shadow-2xl z-50 p-1.5 text-xs slide-in">
                <div className="px-2 py-1 text-[9px] text-ide-text/40 font-semibold uppercase tracking-wider border-b border-ide-border/50 mb-1">
                  Auto-Generate with Gemini
                </div>
                <button
                  onClick={() => handleAiGenerate('readme')}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-ide-text hover:text-ide-text-bright hover:bg-ide-border text-left cursor-pointer"
                >
                  <span>📘 README.md</span>
                </button>
                <button
                  onClick={() => handleAiGenerate('api_docs')}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-ide-text hover:text-ide-text-bright hover:bg-ide-border text-left cursor-pointer"
                >
                  <span>📑 REST API Docs</span>
                </button>
                <button
                  onClick={() => handleAiGenerate('installation')}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-ide-text hover:text-ide-text-bright hover:bg-ide-border text-left cursor-pointer"
                >
                  <span>⚙️ Installation Guide</span>
                </button>
                <button
                  onClick={() => handleAiGenerate('summary')}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-ide-text hover:text-ide-text-bright hover:bg-ide-border text-left cursor-pointer"
                >
                  <span>📊 Project Summary</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative flex items-center">
          <Search size={12} className="absolute left-2.5 text-ide-text/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search docs or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ide-bg border border-ide-border rounded-lg pl-7 pr-2.5 py-1 text-xs text-ide-text-bright placeholder-ide-text/30 outline-none focus:border-ide-accent"
          />
        </div>
      </div>

      {/* New Doc Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="p-3 bg-ide-bg border-b border-ide-border flex flex-col gap-2 shrink-0">
          <input
            type="text"
            placeholder="Document title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-ide-panel border border-ide-border rounded-lg px-2.5 py-1.5 text-xs text-ide-text-bright placeholder-ide-text/30 outline-none focus:border-ide-accent"
            autoFocus
          />
          <input
            type="text"
            placeholder="Category (e.g. Architecture, API, Setup)..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full bg-ide-panel border border-ide-border rounded-lg px-2.5 py-1 text-xs text-ide-text-bright placeholder-ide-text/30 outline-none focus:border-ide-accent"
          />
          <textarea
            placeholder="Markdown content..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            className="w-full bg-ide-panel border border-ide-border rounded-lg px-2.5 py-1 text-xs text-ide-text-bright placeholder-ide-text/30 outline-none focus:border-ide-accent resize-none font-mono"
          />
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-2.5 py-1 rounded-lg text-ide-text/50 hover:text-ide-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-ide-accent hover:bg-ide-accent-hover text-white rounded-lg font-medium transition-colors"
            >
              Save Doc
            </button>
          </div>
        </form>
      )}

      {/* Docs List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {loading && <p className="text-center text-ide-text/40 py-4">Loading documents...</p>}
        {!loading && docs.length === 0 && (
          <div className="text-center py-8 text-ide-text/40">
            <BookOpen size={24} className="mx-auto mb-2 opacity-30" />
            <p>No documentation found</p>
          </div>
        )}
        {docs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            className="p-2.5 rounded-xl bg-ide-panel border border-ide-border hover:border-ide-accent/40 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
              <FileText size={14} className="text-ide-accent shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-xs text-ide-text-bright truncate">{doc.title}</p>
                <p className="text-[10px] text-ide-text/40">{doc.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={(e) => handleDeleteDoc(doc.id, e)}
                title="Delete Document"
                className="p-1 rounded text-ide-text/30 hover:text-rose-400 hover:bg-rose-500/15 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
              <ChevronRight size={13} className="text-ide-text/30 group-hover:text-ide-accent transition-colors shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
