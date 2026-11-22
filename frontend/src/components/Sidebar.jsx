import React, { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import {
  ChevronDown, ChevronRight, Folder, FolderOpen, FolderClosed,
  FileCode, Settings, Plus, RefreshCw, Loader2, GitBranch,
  GitCommit, AlertCircle, Check, Minimize2, ExternalLink
} from 'lucide-react'
import { githubAPI } from '../services/api'

// ── File Icon ─────────────────────────────────────────
function FileIcon({ name }) {
  const ext = name.split('.').pop()?.toLowerCase()
  const iconMap = {
    java: <span className="text-[12px] font-bold text-amber-400 select-none leading-none">☕</span>,
    js: <span className="text-[10px] font-bold text-ide-yellow select-none">JS</span>,
    jsx: <span className="text-[10px] font-bold text-ide-yellow select-none">JSX</span>,
    ts: <span className="text-[10px] font-bold text-ide-blue select-none">TS</span>,
    tsx: <span className="text-[10px] font-bold text-ide-blue select-none">TSX</span>,
    py: <span className="text-[10px] font-bold text-sky-400 select-none">PY</span>,
    cpp: <span className="text-[10px] font-bold text-cyan-400 select-none">C++</span>,
    c: <span className="text-[10px] font-bold text-slate-300 select-none">C</span>,
    go: <span className="text-[10px] font-bold text-teal-400 select-none">GO</span>,
    rs: <span className="text-[10px] font-bold text-rose-400 select-none">RS</span>,
    html: <span className="text-[10px] font-bold text-orange-400 select-none">HTML</span>,
    css: <span className="text-[10px] font-bold text-blue-300 select-none">CSS</span>,
    json: <span className="text-[10px] text-ide-yellow select-none">{'{}'}</span>,
    sql: <span className="text-[10px] text-indigo-400 select-none">SQL</span>,
    yml: <span className="text-[10px] text-ide-purple select-none">⚙</span>,
    yaml: <span className="text-[10px] text-ide-purple select-none">⚙</span>,
    xml: <span className="text-[10px] text-ide-red select-none">XML</span>,
    md: <span className="text-[10px] text-ide-text select-none">MD</span>,
  }
  return iconMap[ext] || <FileCode size={13} className="text-ide-text" />
}

// ── Tree Node ─────────────────────────────────────────
function TreeNode({ node, depth = 0 }) {
  const { toggleFolder, setSelectedFile, selectedFile, openTabs, setActiveEditorTab, setSelectedDiffFile } = useStore()
  const isFolder = node.type === 'folder' || (node.children !== undefined)
  const isFile = node.type === 'file'
  const isSelected = selectedFile?.id === node.id

  const handleClick = () => {
    if (isFolder) toggleFolder(node.id)
    if (isFile) {
      setSelectedFile(node)
      useStore.getState().openFile(node.name)
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        title={node.name}
        style={{ paddingLeft: `${6 + depth * 8}px` }}
        className={`
          flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer text-xs transition-colors group select-none
          ${isSelected ? 'bg-ide-accent/20 text-ide-accent font-medium' : 'text-ide-text hover:bg-ide-border/60 hover:text-ide-text-bright'}
        `}
      >
        {isFolder ? (
          <>
            <span className="text-ide-text/60 shrink-0">
              {node.expanded
                ? <ChevronDown size={12} />
                : <ChevronRight size={12} />
              }
            </span>
            {node.expanded
              ? <FolderOpen size={13} className="text-amber-400 shrink-0" />
              : <Folder size={13} className="text-amber-400/80 shrink-0" />
            }
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <span className="shrink-0 flex items-center justify-center"><FileIcon name={node.name} /></span>
          </>
        )}
        <span className="truncate leading-none" title={node.name}>{node.name}</span>
      </div>

      {isFolder && node.expanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

// ── Repo Details Drawer (PRs, Commits, Issues, Files) ────────
function RepoDetailsPanel({ repo, onClose }) {
  const [tab, setTab] = useState('files') // 'files' | 'prs' | 'commits' | 'issues'
  const [prs, setPrs] = useState([])
  const [commits, setCommits] = useState([])
  const [issues, setIssues] = useState([])
  const [repoTree, setRepoTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingFile, setLoadingFile] = useState(null)
  const { setActiveEditorTab, createFile } = useStore()

  // Build nested tree structure from flat GitHub tree API
  const buildNestedTree = (flatTree) => {
    if (!Array.isArray(flatTree)) return []
    const root = []
    const map = {}

    for (const item of flatTree) {
      const parts = item.path.split('/')
      let current = root

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const fullPath = parts.slice(0, i + 1).join('/')
        const isLast = i === parts.length - 1

        if (!map[fullPath]) {
          const node = {
            id: fullPath,
            name: part,
            path: fullPath,
            type: isLast && item.type === 'blob' ? 'file' : 'folder',
            expanded: i < 2,
            children: [],
          }
          map[fullPath] = node
          current.push(node)
        }
        current = map[fullPath].children
      }
    }
    return root
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.allSettled([
      githubAPI.getTree(repo),
      githubAPI.getPullRequests(repo),
      githubAPI.getCommits(repo),
      githubAPI.getIssues(repo),
    ])
      .then(([treeRes, prRes, commitRes, issueRes]) => {
        if (treeRes.status === 'fulfilled') {
          const treeData = treeRes.value.data?.tree || treeRes.value.data || []
          setRepoTree(buildNestedTree(treeData))
        }
        if (prRes.status === 'fulfilled') setPrs(prRes.value.data || [])
        if (commitRes.status === 'fulfilled') setCommits(commitRes.value.data || [])
        if (issueRes.status === 'fulfilled') setIssues(issueRes.value.data || [])
      })
      .catch((e) => setError(e.response?.data?.error || 'Failed to load repository info'))
      .finally(() => setLoading(false))
  }, [repo])

  const handleOpenRepoFile = async (node) => {
    if (node.type !== 'file') return
    setLoadingFile(node.path)
    try {
      const res = await githubAPI.getFile(repo, node.path)
      const content = res.data?.content || res.data || ''
      const filename = node.name
      createFile(filename, typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'user')
    } catch (err) {
      console.error('Failed to fetch file:', err)
    } finally {
      setLoadingFile(null)
    }
  }

  const toggleTreeNode = (nodePath) => {
    const toggleIn = (nodes) =>
      nodes.map((n) => {
        if (n.path === nodePath) return { ...n, expanded: !n.expanded }
        if (n.children?.length) return { ...n, children: toggleIn(n.children) }
        return n
      })
    setRepoTree(toggleIn(repoTree))
  }

  const RepoTreeNode = ({ node, depth = 0 }) => (
    <div>
      <div
        onClick={() => node.type === 'folder' ? toggleTreeNode(node.path) : handleOpenRepoFile(node)}
        style={{ paddingLeft: `${6 + depth * 10}px` }}
        className={`flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer text-[11px] transition-colors group select-none hover:bg-ide-border/60 hover:text-ide-text-bright ${
          loadingFile === node.path ? 'text-ide-accent' : 'text-ide-text'
        }`}
      >
        {node.type === 'folder' ? (
          <>
            <span className="text-ide-text/50 shrink-0">
              {node.expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </span>
            {node.expanded ? (
              <FolderOpen size={12} className="text-amber-400 shrink-0" />
            ) : (
              <Folder size={12} className="text-amber-400/80 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <span className="shrink-0"><FileIcon name={node.name} /></span>
          </>
        )}
        <span className="truncate leading-none">{node.name}</span>
        {loadingFile === node.path && <Loader2 size={10} className="animate-spin text-ide-accent ml-auto shrink-0" />}
      </div>
      {node.type === 'folder' && node.expanded && node.children?.map((child) => (
        <RepoTreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )

  return (
    <div className="border-t border-ide-border bg-ide-panel/40">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-ide-bg/80 border-b border-ide-border/60">
        <div className="flex items-center gap-2 overflow-x-auto text-[10px] font-semibold">
          <button
            onClick={() => setTab('files')}
            className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
              tab === 'files' ? 'border-ide-accent text-ide-accent' : 'border-transparent text-ide-text/60 hover:text-ide-text'
            }`}
          >
            📁 Files
          </button>
          <button
            onClick={() => setTab('prs')}
            className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
              tab === 'prs' ? 'border-ide-accent text-ide-accent' : 'border-transparent text-ide-text/60 hover:text-ide-text'
            }`}
          >
            PRs ({prs.length})
          </button>
          <button
            onClick={() => setTab('commits')}
            className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
              tab === 'commits' ? 'border-ide-accent text-ide-accent' : 'border-transparent text-ide-text/60 hover:text-ide-text'
            }`}
          >
            Commits ({commits.length})
          </button>
          <button
            onClick={() => setTab('issues')}
            className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
              tab === 'issues' ? 'border-ide-accent text-ide-accent' : 'border-transparent text-ide-text/60 hover:text-ide-text'
            }`}
          >
            Issues ({issues.length})
          </button>
        </div>
        <button onClick={onClose} className="text-[11px] text-ide-text/60 hover:text-ide-text cursor-pointer p-0.5">✕</button>
      </div>

      {loading && <div className="flex justify-center py-4"><Loader2 size={14} className="animate-spin text-ide-accent" /></div>}
      {error && <p className="text-[10px] text-ide-red px-3 py-2">{error}</p>}

      {!loading && (
        <div className="max-h-64 overflow-y-auto divide-y divide-ide-border/40 text-[11px]">
          {/* Files Tab — GitHub Repo Tree */}
          {tab === 'files' && (
            repoTree.length === 0 ? (
              <p className="text-[10px] text-ide-text/40 px-3 py-2">No files found. Repository may be empty or private.</p>
            ) : (
              <div className="py-1">
                {repoTree.map((node) => (
                  <RepoTreeNode key={node.id} node={node} depth={0} />
                ))}
              </div>
            )
          )}

          {/* PRs */}
          {tab === 'prs' && (
            prs.length === 0 ? (
              <p className="text-[10px] text-ide-text/40 px-3 py-2">No pull requests found.</p>
            ) : (
              prs.map((pr) => (
                <div
                  key={pr.number}
                  onClick={() => {
                    const tabs = useStore.getState().openTabs
                    if (!tabs.some((t) => t.id === 'AppService')) {
                      useStore.setState({
                        openTabs: [...tabs, { id: 'AppService', name: 'AppService.java', icon: '📄', closable: true }],
                      })
                    }
                    setActiveEditorTab('AppService')
                  }}
                  className="px-3 py-2 hover:bg-ide-border/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <GitBranch size={11} className="text-ide-purple shrink-0" />
                    <span className="text-[10px] text-ide-blue font-mono">#{pr.number}</span>
                    <span className={`text-[9px] px-1.5 py-px rounded-full font-medium ${
                      pr.state === 'open' ? 'bg-ide-green/20 text-ide-green' : 'bg-ide-red/20 text-ide-red'
                    }`}>{pr.state}</span>
                  </div>
                  <p className="text-[10px] text-ide-text-bright truncate">{pr.title}</p>
                </div>
              ))
            )
          )}

          {/* Commits */}
          {tab === 'commits' && (
            commits.length === 0 ? (
              <p className="text-[10px] text-ide-text/40 px-3 py-2">No commit history found.</p>
            ) : (
              commits.slice(0, 8).map((c) => (
                <div key={c.sha || c.fullSha} className="px-3 py-1.5 hover:bg-ide-border/40 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <GitCommit size={11} className="text-ide-yellow shrink-0" />
                    <span className="text-[9px] font-mono text-ide-accent">{c.sha}</span>
                    <span className="text-[9px] text-ide-text/40 ml-auto truncate">{c.author}</span>
                  </div>
                  <p className="text-[10px] text-ide-text-bright truncate mt-0.5">{c.message}</p>
                </div>
              ))
            )
          )}

          {/* Issues */}
          {tab === 'issues' && (
            issues.length === 0 ? (
              <p className="text-[10px] text-ide-text/40 px-3 py-2">No open issues found.</p>
            ) : (
              issues.map((i) => (
                <div key={i.id || i.number} className="px-3 py-1.5 hover:bg-ide-border/40 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={11} className="text-ide-red shrink-0" />
                    <span className="text-[9px] font-mono text-ide-blue">#{i.number}</span>
                    <span className="text-[9px] px-1.5 py-px rounded-full bg-ide-green/10 text-ide-green">{i.state}</span>
                  </div>
                  <p className="text-[10px] text-ide-text-bright truncate mt-0.5">{i.title}</p>
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────
import TaskPanel from './TaskPanel'
import DocPanel from './DocPanel'
import SettingsPanel from './SettingsPanel'

export default function Sidebar() {
  const {
    sidebarSection,
    activeRepoName,
    setActiveRepoName,
    collapseAll,
    expandAll,
  } = useStore()
  const { toggleFolder } = useStore()
  const [remoteRepos, setRemoteRepos] = useState([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [repoError, setRepoError] = useState('')
  const [selectedPRRepo, setSelectedPRRepo] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [showRepoMenu, setShowRepoMenu] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const fetchRepos = async () => {
    setLoadingRepos(true)
    setRepoError('')
    try {
      const res = await githubAPI.getRepositories()
      setRemoteRepos(res.data)
    } catch (e) {
      // Not configured — just show local repos
      setRepoError(e.response?.data?.error || '')
    } finally {
      setLoadingRepos(false)
    }
  }

  const handleImportRepo = async (e) => {
    e.preventDefault()
    if (!importUrl.trim()) return
    setImporting(true)
    try {
      const res = await githubAPI.importRepo({ url: importUrl.trim() })
      await fetchRepos()
      setImportUrl('')
      setShowImportModal(false)
      setActiveRepoName(res.data.name)
    } catch (err) {
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  // Try to load repos on mount
  useEffect(() => { fetchRepos() }, [])

  // If Tasks section is active
  if (sidebarSection === 'tasks') {
    return (
      <div className="w-64 flex flex-col bg-ide-sidebar border-r border-ide-border shrink-0 overflow-hidden">
        <TaskPanel />
      </div>
    )
  }

  // If Documentation section is active
  if (sidebarSection === 'docs') {
    return (
      <div className="w-64 flex flex-col bg-ide-sidebar border-r border-ide-border shrink-0 overflow-hidden">
        <DocPanel />
      </div>
    )
  }

  // Settings section
  if (sidebarSection === 'settings') {
    return (
      <div className="w-64 flex flex-col bg-ide-sidebar border-r border-ide-border shrink-0 overflow-hidden">
        <SettingsPanel />
      </div>
    )
  }

  const handleAddFile = (e) => {
    e.preventDefault()
    const trimmed = newFileName.trim()
    if (!trimmed) return
    useStore.getState().createFile(trimmed)
    setNewFileName('')
    setShowAddModal(false)
  }

  return (
    <div className="w-64 flex flex-col bg-ide-sidebar border-r border-ide-border shrink-0 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ide-border shrink-0 bg-ide-bg/30">
        {/* Clickable Repositories Dropdown Options Button */}
        <div className="relative">
          <button
            onClick={() => setShowRepoMenu(!showRepoMenu)}
            title="Repositories Options & Switcher"
            className="flex items-center gap-1 px-1.5 py-0.5 -ml-1 rounded hover:bg-ide-border/60 transition-colors cursor-pointer group"
          >
            <span className="text-[11px] font-semibold text-ide-text-bright uppercase tracking-wider group-hover:text-ide-accent">
              Repositories
            </span>
            <ChevronDown
              size={12}
              className={`text-ide-text/60 group-hover:text-ide-accent transition-transform duration-200 ${
                showRepoMenu ? 'rotate-180 text-ide-accent' : ''
              }`}
            />
          </button>

          {/* Repositories Options Dropdown Menu */}
          {showRepoMenu && (
            <div className="absolute top-full left-0 mt-1 w-60 bg-ide-panel border border-ide-border rounded-xl shadow-2xl z-50 p-2 text-xs slide-in">
              {/* GitHub Repositories List */}
              {remoteRepos.length > 0 && (
                <>
                  <div className="px-2 py-1 text-[10px] text-ide-text/50 font-semibold uppercase tracking-wider">
                    GitHub Repositories ({remoteRepos.length})
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {remoteRepos.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setActiveRepoName(r.name)
                          setSelectedPRRepo(r.name)
                          setShowRepoMenu(false)
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          activeRepoName === r.name
                            ? 'bg-ide-accent/20 text-ide-accent font-medium'
                            : 'text-ide-text hover:bg-ide-border hover:text-ide-text-bright'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <GitBranch size={12} className="text-ide-purple shrink-0" />
                          <span className="truncate text-xs">{r.name}</span>
                        </div>
                        {r.language && <span className="text-[9px] text-ide-text/40 shrink-0">{r.language}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {remoteRepos.length === 0 && (
                <div className="px-2 py-2 text-[10px] text-ide-text/40 text-center">No repos loaded yet.</div>
              )}

              {/* Actions */}
              <div className="mt-1.5 pt-1.5 border-t border-ide-border/50 space-y-0.5">
                <button
                  onClick={() => {
                    fetchRepos()
                    setShowRepoMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-ide-text hover:text-ide-text-bright hover:bg-ide-border rounded-lg transition-colors cursor-pointer text-left text-xs"
                >
                  <RefreshCw size={12} className="text-ide-green shrink-0" />
                  <span>Refresh Repositories</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(true)
                    setShowRepoMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-ide-text hover:text-ide-text-bright hover:bg-ide-border rounded-lg transition-colors cursor-pointer text-left text-xs"
                >
                  <Plus size={12} className="text-ide-accent shrink-0" />
                  <span>New File</span>
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(true)
                    setShowRepoMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-ide-text hover:text-ide-text-bright hover:bg-ide-border rounded-lg transition-colors cursor-pointer text-left text-xs"
                >
                  <GitBranch size={12} className="text-emerald-400 shrink-0" />
                  <span>Import Repository</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-1">
          <button
            title="Collapse All Folders"
            onClick={collapseAll}
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <FolderClosed size={12} />
          </button>
          <button
            title="Refresh Repositories"
            onClick={fetchRepos}
            disabled={loadingRepos}
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer disabled:opacity-50"
          >
            {loadingRepos ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
          <button
            onClick={() => setShowAddModal(!showAddModal)}
            title="New File / Module"
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Import Repo inline input */}
      {showImportModal && (
        <form onSubmit={handleImportRepo} className="p-2 bg-ide-bg border-b border-ide-border flex flex-col gap-1.5 shrink-0">
          <span className="text-[10px] text-emerald-400 font-medium">Import GitHub Repository:</span>
          <input
            type="text"
            placeholder="e.g. https://github.com/org/repo"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            className="w-full bg-ide-panel border border-ide-border rounded px-2 py-1 text-xs text-ide-text-bright outline-none focus:border-emerald-500"
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="px-2 py-0.5 text-[10px] text-ide-text/50 hover:text-ide-text cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importing}
              className="px-2 py-0.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium cursor-pointer"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </form>
      )}

      {/* Add File inline input */}
      {showAddModal && (
        <form onSubmit={handleAddFile} className="p-2 bg-ide-bg border-b border-ide-border flex flex-col gap-1.5 shrink-0">
          <span className="text-[10px] text-ide-text/50 font-medium">New file name:</span>
          <input
            type="text"
            placeholder="e.g. UserService.java"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-ide-panel border border-ide-border rounded px-2 py-1 text-xs text-ide-text-bright outline-none focus:border-ide-accent"
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-2 py-0.5 text-[10px] text-ide-text/50 hover:text-ide-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-0.5 text-[10px] bg-ide-accent hover:bg-ide-accent-hover text-white rounded font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* File Tree — Only GitHub Repos */}
      <div className="flex-1 overflow-y-auto">
        {loadingRepos && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 size={18} className="animate-spin text-ide-accent" />
            <span className="text-[10px] text-ide-text/50">Loading repositories...</span>
          </div>
        )}

        {!loadingRepos && remoteRepos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 gap-2 text-center">
            <GitBranch size={22} className="text-ide-text/30" />
            <span className="text-[11px] text-ide-text/50">No GitHub repositories found.</span>
            <span className="text-[10px] text-ide-text/30">Connect your GitHub account or import a repo.</span>
            <button
              onClick={() => setShowImportModal(true)}
              className="mt-1 px-3 py-1 text-[10px] bg-ide-accent hover:bg-ide-accent-hover text-white rounded-lg font-medium cursor-pointer"
            >
              Import Repository
            </button>
          </div>
        )}

        {!loadingRepos && remoteRepos.length > 0 && (
          <>
            <div className="px-3 py-1.5 flex items-center justify-between border-b border-ide-border/40">
              <span className="text-[10px] text-ide-text/40 uppercase tracking-wider font-semibold">
                GitHub Repos ({remoteRepos.length})
              </span>
            </div>
            {remoteRepos.map((repo) => (
              <div key={repo.id}>
                <div
                  onClick={() => {
                    setActiveRepoName(repo.name)
                    setSelectedPRRepo(selectedPRRepo === repo.name ? null : repo.name)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-xs transition-colors select-none
                    ${selectedPRRepo === repo.name
                      ? 'bg-ide-accent/15 text-ide-accent font-medium'
                      : 'text-ide-text hover:bg-ide-border/60 hover:text-ide-text-bright'
                    }`}
                >
                  {selectedPRRepo === repo.name ? (
                    <ChevronDown size={11} className="shrink-0 text-ide-accent" />
                  ) : (
                    <ChevronRight size={11} className="shrink-0 text-ide-text/50" />
                  )}
                  <GitBranch size={12} className="shrink-0 text-ide-purple" />
                  <span className="truncate flex-1">{repo.name}</span>
                  {repo.language && (
                    <span className="text-[9px] text-ide-text/40 shrink-0">{repo.language}</span>
                  )}
                </div>

                {/* Expanded repo details with files/PRs/commits/issues */}
                {selectedPRRepo === repo.name && (
                  <RepoDetailsPanel
                    repo={repo.name}
                    onClose={() => setSelectedPRRepo(null)}
                  />
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

