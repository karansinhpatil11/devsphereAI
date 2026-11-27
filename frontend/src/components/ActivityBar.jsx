import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import useAuthStore from '../store/authStore'
import { authAPI } from '../services/api'
import devsphereLogo from '../assets/Devsphere.jpg'
import {
  GitBranch, CheckSquare, Settings, BookOpen, User, LogOut, LogIn, UserPlus
} from 'lucide-react'

const navItems = [
  { id: 'repositories', icon: GitBranch, label: 'Repositories' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'docs', icon: BookOpen, label: 'Documentation' },
]

export default function ActivityBar() {
  const navigate = useNavigate()
  const { sidebarSection, setSidebarSection, isSidebarOpen } = useStore()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    try {
      await authAPI.logout()
    } catch {}
    logout()
    setShowUserMenu(false)
    navigate('/login')
  }

  return (
    <div className="w-14 flex flex-col items-center bg-ide-sidebar border-r border-ide-border py-2 gap-1 shrink-0 relative">
      {/* ── App Logo ── */}
      <div className="relative mb-2 mt-1">
        <div
          title="DevSphere AI Studio"
          className="w-9 h-9 rounded-full overflow-hidden border border-ide-accent/60 shadow-[0_0_12px_rgba(0,255,136,0.35)] bg-ide-panel flex items-center justify-center cursor-pointer hover:scale-105 transition-all"
        >
          <img
            src={devsphereLogo}
            alt="DevSphere Logo"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = '/Devsphere.jpg'
            }}
          />
        </div>
      </div>

      <div className="w-8 border-b border-ide-border mb-2" />

      {/* Navigation Icons (Repositories, Tasks, Documentation) */}
      {navItems.map(({ id, icon: Icon, label }) => {
        const isActive = isSidebarOpen && sidebarSection === id
        return (
          <button
            key={id}
            title={label}
            onClick={() => setSidebarSection(id)}
            className={`
              w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer
              ${isActive
                ? 'bg-ide-accent/20 text-ide-accent border-l-2 border-ide-accent shadow-[0_0_8px_rgba(0,255,136,0.2)]'
                : 'text-ide-text hover:bg-ide-border hover:text-ide-text-bright'
              }
            `}
          >
            <Icon size={18} />
          </button>
        )
      })}

      {/* ── Bottom: Account Option (KP) & Settings ── */}
      <div className="mt-auto flex flex-col items-center gap-2">
        {/* User Account Option (KP Avatar & Menu placed in bottom above settings) */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={isAuthenticated ? user?.name || 'User Profile' : 'Sign In / Sign Up'}
            className="w-8 h-8 rounded-full bg-ide-accent/20 flex items-center justify-center cursor-pointer hover:bg-ide-accent/40 transition-colors border border-ide-accent/50 shadow-[0_0_10px_rgba(0,255,136,0.25)]"
          >
            {isAuthenticated && user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : isAuthenticated && user?.name ? (
              <span className="font-bold text-[11px] text-ide-accent">
                {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'KP'}
              </span>
            ) : (
              <span className="font-bold text-[11px] text-ide-accent">KP</span>
            )}
          </button>

          {/* User Popover Menu (opens upwards from bottom) */}
          {showUserMenu && (
            <div className="absolute bottom-0 left-full ml-2 w-48 bg-ide-panel border border-ide-border rounded-xl shadow-2xl z-50 p-2 text-xs slide-in">
              {isAuthenticated ? (
                <div>
                  <div className="px-2 py-1.5 border-b border-ide-border/60 mb-1">
                    <p className="font-semibold text-ide-text-bright truncate">{user?.name || 'Developer'}</p>
                    <p className="text-[10px] text-ide-text/50 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-ide-red hover:bg-ide-red/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="px-2 py-1 border-b border-ide-border/60 mb-1">
                    <p className="text-[11px] text-ide-text/70">Developer Account (KP)</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/login')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-ide-text hover:text-ide-text-bright hover:bg-ide-border rounded-lg transition-colors cursor-pointer"
                  >
                    <LogIn size={13} className="text-ide-accent" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/signup')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-ide-text hover:text-ide-text-bright hover:bg-ide-border rounded-lg transition-colors cursor-pointer mt-0.5"
                  >
                    <UserPlus size={13} className="text-ide-green" />
                    <span>Create Account</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          title="Settings"
          onClick={() => setSidebarSection('settings')}
          className={`
            w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer
            ${isSidebarOpen && sidebarSection === 'settings'
              ? 'bg-ide-accent/20 text-ide-accent border-l-2 border-ide-accent shadow-[0_0_8px_rgba(0,255,136,0.2)]'
              : 'text-ide-text hover:bg-ide-border hover:text-ide-text-bright'
            }
          `}
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}
