import React, { useState, useEffect } from 'react'
import { taskAPI } from '../services/api'
import { CheckSquare, Plus, Trash2, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react'

export default function TaskPanel() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [isPlanning, setIsPlanning] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [selectedIds, setSelectedIds] = useState([])
  const [isDeletingBatch, setIsDeletingBatch] = useState(false)

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await taskAPI.getTasks()
      setTasks(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    const handleSync = () => fetchTasks()
    window.addEventListener('tasks-updated', handleSync)
    return () => window.removeEventListener('tasks-updated', handleSync)
  }, [])

  const handleAIPlan = async () => {
    setIsPlanning(true)
    try {
      const res = await taskAPI.planTasks()
      if (res.data?.tasks) {
        setTasks(res.data.tasks)
      } else {
        await fetchTasks()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsPlanning(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      const res = await taskAPI.createTask({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        status: 'todo',
      })
      setTasks([res.data, ...tasks])
      setNewTitle('')
      setNewDesc('')
      setShowAddModal(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done'
    try {
      const res = await taskAPI.updateTask(task.id, { status: nextStatus })
      setTasks(tasks.map((t) => (t.id === task.id ? res.data : t)))
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await taskAPI.deleteTask(id)
      setTasks(tasks.filter((t) => t.id !== id))
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleSelect = (id, e) => {
    e.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAllToggle = () => {
    if (selectedIds.length === tasks.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(tasks.map((t) => t.id))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} selected task(s)?`)) return
    setIsDeletingBatch(true)
    try {
      await Promise.all(selectedIds.map((id) => taskAPI.deleteTask(id)))
      setTasks((prev) => prev.filter((t) => !selectedIds.includes(t.id)))
      setSelectedIds([])
    } catch (e) {
      console.error(e)
    } finally {
      setIsDeletingBatch(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Subheader */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ide-border shrink-0">
        <span className="text-[10px] text-ide-text/40 font-semibold uppercase tracking-wider">
          Task Tracker ({tasks.length})
        </span>
        <div className="flex items-center gap-1.5">
          {tasks.length > 0 && (
            <button
              onClick={handleSelectAllToggle}
              title="Select / Multi-select Tasks"
              className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                selectedIds.length > 0
                  ? 'bg-ide-accent/20 border-ide-accent text-ide-accent font-semibold'
                  : 'border-ide-border text-ide-text hover:text-ide-text-bright'
              }`}
            >
              <CheckSquare size={11} />
              <span>{selectedIds.length > 0 ? `${selectedIds.length} Sel` : 'Select'}</span>
            </button>
          )}
          <button
            onClick={handleAIPlan}
            disabled={isPlanning}
            title="Auto-plan tasks using Gemini AI"
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-ide-accent/15 border border-ide-accent/30 text-ide-accent hover:bg-ide-accent/25 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={11} className={isPlanning ? 'animate-spin' : ''} />
            <span>{isPlanning ? 'Planning...' : '✨ Plan'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-[10px] text-ide-accent hover:text-ide-accent-hover transition-colors cursor-pointer"
          >
            <Plus size={12} />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Multi-Selection Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-ide-panel border-b border-ide-accent/30 shrink-0 text-xs slide-in">
          <label className="flex items-center gap-2 cursor-pointer text-ide-text-bright text-[11px] font-medium">
            <input
              type="checkbox"
              checked={tasks.length > 0 && selectedIds.length === tasks.length}
              onChange={handleSelectAllToggle}
              className="w-3.5 h-3.5 rounded accent-ide-accent cursor-pointer"
            />
            <span>{selectedIds.length} Selected</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="text-[10px] text-ide-text/50 hover:text-ide-text cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={isDeletingBatch}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 transition-colors cursor-pointer shadow-sm"
            >
              <Trash2 size={11} />
              <span>Delete ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* New Task Form Modal */}
      {showAddModal && (
        <form onSubmit={handleCreate} className="p-3 bg-ide-bg border-b border-ide-border flex flex-col gap-2 shrink-0">
          <input
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-ide-panel border border-ide-border rounded-lg px-2.5 py-1.5 text-xs text-ide-text-bright placeholder-ide-text/30 outline-none focus:border-ide-accent"
            autoFocus
          />
          <textarea
            placeholder="Description (optional)..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
            className="w-full bg-ide-panel border border-ide-border rounded-lg px-2.5 py-1 text-xs text-ide-text-bright placeholder-ide-text/30 outline-none focus:border-ide-accent resize-none"
          />
          <div className="flex items-center justify-between gap-2 mt-1">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="bg-ide-panel border border-ide-border rounded-lg px-2 py-1 text-[10px] text-ide-text outline-none"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-2.5 py-1 rounded-lg text-ide-text/50 hover:text-ide-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-ide-accent hover:bg-ide-accent-hover text-white rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && <p className="text-center text-ide-text/40 py-4">Loading tasks...</p>}
        {!loading && tasks.length === 0 && (
          <div className="text-center py-8 text-ide-text/40">
            <CheckSquare size={24} className="mx-auto mb-2 opacity-30" />
            <p>No active tasks</p>
          </div>
        )}
        {tasks.map((task) => {
          const isDone = task.status === 'done'
          const isSelected = selectedIds.includes(task.id)
          return (
            <div
              key={task.id}
              onClick={() => handleToggleStatus(task)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex flex-col gap-1.5 ${
                isSelected
                  ? 'bg-ide-accent/15 border-ide-accent shadow-[0_0_8px_rgba(0,255,136,0.15)]'
                  : isDone
                  ? 'bg-ide-bg/50 border-ide-border/40 opacity-60'
                  : 'bg-ide-panel border-ide-border hover:border-ide-accent/40 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleToggleSelect(task.id, e)}
                  onClick={(e) => e.stopPropagation()}
                  title="Select task"
                  className="mt-1 w-3.5 h-3.5 rounded accent-ide-accent cursor-pointer shrink-0"
                />
                <button
                  type="button"
                  className="mt-0.5 text-ide-text/40 group-hover:text-ide-accent transition-colors shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 size={14} className="text-ide-green" />
                  ) : (
                    <Clock size={14} className="text-ide-yellow" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-xs leading-snug truncate ${
                      isDone ? 'line-through text-ide-text/40' : 'text-ide-text-bright'
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-[11px] text-ide-text/50 line-clamp-2 mt-0.5">{task.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(task.id, e)}
                  className="text-ide-text/20 hover:text-ide-red opacity-0 group-hover:opacity-100 transition-all p-1"
                  title="Delete task"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Priority badge */}
              <div className="flex items-center justify-between text-[10px] text-ide-text/40 pt-1 border-t border-ide-border/30">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold ${
                    task.priority === 'high'
                      ? 'bg-ide-red/15 text-ide-red'
                      : task.priority === 'medium'
                      ? 'bg-ide-yellow/15 text-ide-yellow'
                      : 'bg-ide-blue/15 text-ide-blue'
                  }`}
                >
                  {task.priority}
                </span>
                <span>{task.assignee}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
