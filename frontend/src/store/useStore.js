import { create } from 'zustand'
import { getOrCreateFile, setCachedFile, detectLanguage, fileCache } from './fileStorage'

const useStore = create((set, get) => ({
  // ── UI State ──────────────────────────────────────────
  activeTab: 'pr',
  sidebarSection: 'repositories',

  // ── Repositories & Files ─────────────────────────────
  repositories: [],

  selectedFile: null,
  openTabs: [
    { id: 'welcome', name: 'Welcome', icon: '✨', closable: true },
  ],
  activeEditorTab: 'welcome',
  lastFileAction: null,

  // ── PR / Diff ─────────────────────────────────────────
  currentPR: {
    number: 452,
    title: 'Fix data fetch issues and improve error handling',
    status: 'Open',
    diffOld: '',
    diffNew: '',
  },

  // ── AI Chat ───────────────────────────────────────────
  chatMessages: [
    {
      id: 1,
      role: 'assistant',
      content: `👋 **Welcome to DevSphere AI Studio!** I am your autonomous AI developer agent.

You can ask me to:
• **Create new files** in C, C++, Java, Python, and JavaScript (e.g. \`create main.py\`, \`create Main.java\`, \`create main.cpp\`)
• **Open & modify repository files** (e.g. \`add caching to AppService.java\`)
• **Refactor, optimize, or test** active code in the editor

How can I help you build today?`,
      timestamp: new Date(),
    },
  ],
  chatInput: '',
  isAiTyping: false,
  aiModel: 'Gemini 3.8 Flash (Free)',
  aiTemperature: 0.2,
  mcpConnected: true,

  // ── Actions ───────────────────────────────────────────
  setAiTemperature: (temperature) => set({ aiTemperature: temperature }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveEditorTab: (tab) => set({ activeEditorTab: tab }),
  setSidebarSection: (section) => set({ sidebarSection: section }),
  selectedDiffFile: 'AppController.java',
  setSelectedDiffFile: (name) => set({ selectedDiffFile: name }),
  setSelectedFile: (file) => set({
    selectedFile: file,
    selectedDiffFile: file?.name || 'AppController.java',
  }),
  setChatInput: (input) => set({ chatInput: input }),

  activeRepoName: 'workspace',
  setActiveRepoName: (name) => set({ activeRepoName: name }),

  collapseAll: () => {
    const collapse = (nodes) =>
      nodes.map((n) => ({
        ...n,
        expanded: false,
        children: n.children ? collapse(n.children) : undefined,
      }))
    set((s) => ({ repositories: collapse(s.repositories) }))
  },

  expandAll: () => {
    const expand = (nodes) =>
      nodes.map((n) => ({
        ...n,
        expanded: true,
        children: n.children ? expand(n.children) : undefined,
      }))
    set((s) => ({ repositories: expand(s.repositories) }))
  },

  toggleFolder: (nodeId) => {
    const toggle = (nodes) =>
      nodes.map((n) => {
        if (n.id === nodeId) return { ...n, expanded: !n.expanded }
        if (n.children) return { ...n, children: toggle(n.children) }
        return n
      })
    set((s) => ({ repositories: toggle(s.repositories) }))
  },

  addChatMessage: (message) =>
    set((s) => ({
      chatMessages: [...s.chatMessages, { id: Date.now(), timestamp: new Date(), ...message }],
    })),

  setAiTyping: (typing) => set({ isAiTyping: typing }),

  // ── Folder & Workspace Loading ─────────────────────
  loadFolder: (folderName, files) => {
    if (!files || files.length === 0) return
    const rootName = folderName || 'workspace'

    files.forEach((f) => {
      setCachedFile(f.name, f.content, f.lang || detectLanguage(f.name))
      if (f.path && f.path !== f.name) {
        setCachedFile(f.path, f.content, f.lang || detectLanguage(f.name))
      }
    })

    const children = files.map((f, i) => ({
      id: Date.now() + i + 1,
      name: f.name,
      path: f.path || f.name,
      type: 'file',
      lang: f.lang || detectLanguage(f.name),
    }))

    const folderNode = {
      id: Date.now(),
      name: rootName,
      type: 'folder',
      expanded: true,
      children,
    }

    const firstFile = files.find((f) => !f.name.startsWith('.')) || files[0]

    set((s) => ({
      repositories: [folderNode, ...s.repositories.filter((r) => r.name !== rootName)],
      activeRepoName: rootName,
      selectedFile: firstFile,
      openTabs: [
        ...s.openTabs.filter((t) => t.id !== 'welcome' && t.id !== firstFile.name),
        { id: firstFile.name, name: firstFile.name, icon: '📄', closable: true },
      ],
      activeEditorTab: firstFile.name,
      lastFileAction: { type: 'opened_folder', folderName: rootName, filename: firstFile.name, timestamp: Date.now() },
    }))
  },

  // ── File Management Actions ─────────────────────────
  createFile: (rawName, content = null, by = 'user') => {
    const filename = (rawName || '').trim()
    if (!filename) return
    const fileObj = getOrCreateFile(filename, content)

    set((s) => {
      const fileNode = {
        id: Date.now(),
        name: filename,
        type: 'file',
        lang: fileObj.lang,
      }
      const updatedRepos = s.repositories.map((repo) => {
        if (repo.name === 'core-service') {
          const exists = (repo.children || []).some((c) => c.name === filename)
          if (exists) return repo
          return {
            ...repo,
            expanded: true,
            children: [...(repo.children || []), fileNode],
          }
        }
        return repo
      })

      const tabExists = s.openTabs.some((t) => t.id === filename || t.name === filename)
      const newTabs = tabExists
        ? s.openTabs
        : [...s.openTabs, { id: filename, name: filename, icon: '📄', closable: true }]

      return {
        repositories: updatedRepos,
        openTabs: newTabs,
        activeEditorTab: filename,
        lastFileAction: { type: 'created', filename, by, timestamp: Date.now() },
      }
    })
  },

  updateFile: (filename, content, by = 'user') => {
    if (!filename) return
    const lang = detectLanguage(filename)
    setCachedFile(filename, content, lang)

    set((s) => {
      const tabExists = s.openTabs.some((t) => t.id === filename || t.name === filename)
      const newTabs = tabExists
        ? s.openTabs
        : [...s.openTabs, { id: filename, name: filename, icon: '📄', closable: true }]

      return {
        openTabs: newTabs,
        activeEditorTab: filename,
        lastFileAction: { type: 'modified', filename, by, timestamp: Date.now() },
      }
    })
  },

  openFile: (filename) => {
    if (!filename) return
    getOrCreateFile(filename)
    set((s) => {
      const tabExists = s.openTabs.some((t) => t.id === filename || t.name === filename)
      const newTabs = tabExists
        ? s.openTabs
        : [...s.openTabs, { id: filename, name: filename, icon: '📄', closable: true }]
      return {
        openTabs: newTabs,
        activeEditorTab: filename,
      }
    })
  },

  deleteFile: (filename) => {
    delete fileCache[filename]
    set((s) => {
      const filterNodes = (nodes) =>
        nodes
          .filter((n) => n.name !== filename)
          .map((n) => ({
            ...n,
            children: n.children ? filterNodes(n.children) : undefined,
          }))

      const newTabs = s.openTabs.filter((t) => t.id !== filename && t.name !== filename)
      const nextActive = s.activeEditorTab === filename ? (newTabs[newTabs.length - 1]?.id || 'welcome') : s.activeEditorTab

      return {
        repositories: filterNodes(s.repositories),
        openTabs: newTabs,
        activeEditorTab: nextActive,
      }
    })
  },

  closeTab: (tabId) =>
    set((s) => {
      const tabs = s.openTabs.filter((t) => t.id !== tabId)
      const active = s.activeEditorTab === tabId ? (tabs[tabs.length - 1]?.id || 'welcome') : s.activeEditorTab
      return { openTabs: tabs, activeEditorTab: active }
    }),
}))

export default useStore
