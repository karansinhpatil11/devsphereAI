import React, { useState, useRef } from 'react'
import {
  User,
  Users,
  Grid,
  UserPlus,
  Clock,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  TrendingUp,
  SlidersHorizontal,
  BarChart3,
  Target,
  Wallet,
  Building2,
  Code2,
  Terminal,
  Cpu,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowUpRight,
} from 'lucide-react'
import useStore from '../store/useStore'
import useAuthStore from '../store/authStore'

export default function ProtocolDashboard({ onNavigateView }) {
  const { user } = useAuthStore()
  const { openFile, setActiveEditorTab } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState('all')
  const carouselRef = useRef(null)

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // ── Top 4 KPI Metrics (Matching Reference Image) ────────────────────
  const kpiMetrics = [
    {
      id: 'active_emp',
      title: 'Active Employees',
      value: '1081',
      trend: '+55% than last week',
      icon: User,
      badgeColor: 'bg-[#0a385c]',
      onClick: () => onNavigateView?.('editor'),
    },
    {
      id: 'total_emp',
      title: 'Total Employee',
      value: '2,300',
      trend: '+3% than last week',
      icon: Users,
      badgeColor: 'bg-[#0a385c]',
      onClick: () => onNavigateView?.('compiler'),
    },
    {
      id: 'total_task',
      title: 'Total Task',
      value: '34',
      trend: '+1% than yesterday',
      icon: Grid,
      badgeColor: 'bg-[#0a385c]',
      onClick: () => onNavigateView?.('tasks'),
    },
    {
      id: 'attendance',
      title: 'Attendance',
      value: '+91',
      trend: 'Just updated',
      icon: UserPlus,
      badgeColor: 'bg-[#0a385c]',
      onClick: () => onNavigateView?.('ai_assistant'),
    },
  ]

  // ── Middle Row Category Cards (Matching Reference Image) ────────────
  const departmentCards = [
    {
      id: 'eng',
      title: 'Engineering and Development',
      badge: 'Total Employee: 245',
      updated: 'Updated 2 days ago',
      icon: BarChart3,
      view: 'editor',
    },
    {
      id: 'mkt',
      title: 'Marketing and Sales',
      badge: 'Total Employee: 245',
      updated: 'Updated 2 days ago',
      icon: Target,
      view: 'ai_assistant',
    },
    {
      id: 'acc',
      title: 'Accounting and Finance',
      badge: 'Total Employee: 245',
      updated: 'Updated 2 days ago',
      icon: Wallet,
      view: 'compiler',
    },
    {
      id: 'hr',
      title: 'Human Resources',
      badge: 'Total Employee: 245',
      updated: 'Updated 2 days ago',
      icon: Building2,
      view: 'tasks',
    },
    {
      id: 'eng2',
      title: 'Engineering and Development',
      badge: 'Total Employee: 245',
      updated: 'Updated 2 days ago',
      icon: BarChart3,
      view: 'editor',
    },
  ]

  // ── Bottom Attendance Table Data (Exact from Reference Image) ───────
  const attendanceData = [
    {
      id: 'att-1',
      name: 'Syed Mahamadul Hasan',
      role: 'Flutter Developer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      checkIn: '09:36',
      checkInType: 'late',
      checkOut: '18:35',
      checkOutType: 'normal',
      workingHrs: '09hr 02min',
      workingHrsColor: 'text-slate-700',
      breakTime: '45min',
      breakTimeColor: 'text-slate-600',
      extraHrs: '(+)30min',
      extraHrsColor: 'text-sky-600 font-medium',
      status: 'Late',
      statusColor: 'text-rose-500 font-semibold',
    },
    {
      id: 'att-2',
      name: 'Kamrul Hasan',
      role: 'Back-End Developer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      checkIn: '09:00',
      checkInType: 'normal',
      checkOut: '18:30',
      checkOutType: 'normal',
      workingHrs: '09hr 30min',
      workingHrsColor: 'text-slate-700',
      breakTime: '1hr 05min',
      breakTimeColor: 'text-rose-500 font-medium',
      extraHrs: '--/--',
      extraHrsColor: 'text-slate-400',
      status: 'In time',
      statusColor: 'text-emerald-600 font-semibold',
    },
    {
      id: 'att-3',
      name: 'Arfan Roky',
      role: 'Front-End Developer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
      checkIn: '09:36',
      checkInType: 'normal',
      checkOut: '18:35',
      checkOutType: 'normal',
      workingHrs: '09hr 02min',
      workingHrsColor: 'text-slate-700',
      breakTime: '30min',
      breakTimeColor: 'text-slate-600',
      extraHrs: '--/--',
      extraHrsColor: 'text-slate-400',
      status: 'In time',
      statusColor: 'text-emerald-600 font-semibold',
    },
    {
      id: 'att-4',
      name: 'Ahsan Rahmatullah',
      role: 'Full-Stack Developer',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces',
      checkIn: '09:10',
      checkInType: 'normal',
      checkOut: '18:35',
      checkOutType: 'late',
      workingHrs: '07hr 02min',
      workingHrsColor: 'text-amber-500 font-medium',
      breakTime: '45min',
      breakTimeColor: 'text-slate-600',
      extraHrs: '--/--',
      extraHrsColor: 'text-slate-400',
      status: 'In time',
      statusColor: 'text-emerald-600 font-semibold',
    },
    {
      id: 'att-5',
      name: 'Wasif Zaman Omne',
      role: 'Full-Stack Developer',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=faces',
      checkIn: '09:36',
      checkInType: 'normal',
      checkOut: '18:35',
      checkOutType: 'normal',
      workingHrs: '09hr 02min',
      workingHrsColor: 'text-slate-700',
      breakTime: '45min',
      breakTimeColor: 'text-slate-600',
      extraHrs: '(+)45min',
      extraHrsColor: 'text-sky-600 font-medium',
      status: 'In time',
      statusColor: 'text-emerald-600 font-semibold',
    },
  ]

  const filteredAttendance = attendanceData.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[#eef5fa] p-5 space-y-5 select-none font-sans">
      {/* ── Top Row: 4 Metric / KPI Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.id}
              onClick={kpi.onClick}
              className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Floating Dark Circle Icon Badge */}
              <div className="w-12 h-12 rounded-full bg-[#093557] flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Icon size={20} strokeWidth={2} />
              </div>

              {/* Right Side Metric Information */}
              <div className="text-right flex flex-col justify-center">
                <span className="text-[12px] font-medium text-slate-400">
                  {kpi.title}
                </span>
                <span className="text-2xl font-bold text-slate-800 leading-tight">
                  {kpi.value}
                </span>
                <span className="text-[11px] font-medium text-emerald-500 pt-0.5">
                  {kpi.trend}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Middle Row: Category / Department Cards Carousel ──────────── */}
      <div className="relative">
        <div
          ref={carouselRef}
          className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth pr-12 pb-1"
        >
          {departmentCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <div
                key={`${card.id}-${idx}`}
                onClick={() => onNavigateView?.(card.view)}
                className="bg-white rounded-2xl p-4 min-w-[220px] max-w-[230px] flex-1 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between hover:shadow-md hover:border-sky-200 transition-all cursor-pointer group shrink-0"
              >
                {/* Outlined Icon */}
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#093557] mb-3 group-hover:bg-[#093557] group-hover:text-white transition-colors">
                  <Icon size={20} strokeWidth={1.75} />
                </div>

                {/* Card Title & Badges */}
                <h4 className="text-[13px] font-bold text-slate-800 mb-1 leading-snug line-clamp-1">
                  {card.title}
                </h4>
                <p className="text-[11px] font-semibold text-emerald-500 mb-3">
                  {card.badge}
                </p>

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-2 border-t border-slate-50">
                  <Clock size={11} />
                  <span>{card.updated}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Carousel Slide Next Arrow Button */}
        <button
          onClick={() => scrollCarousel('right')}
          title="Scroll Next"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#093557] hover:shadow-lg transition-all cursor-pointer z-10"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Bottom Section: Main Attendance / Developer Activity Table ── */}
      <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100">
        {/* Table Card Header */}
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Attendance</h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>28 Dec 2026</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <SlidersHorizontal size={11} />
                Live Engineering Board
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100">
              5 Active Sessions
            </span>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 border-b border-slate-100 tracking-wider uppercase">
                <th className="pb-3 pl-2 font-semibold">Employee</th>
                <th className="pb-3 text-center font-semibold">Check In</th>
                <th className="pb-3 text-center font-semibold">Check Out</th>
                <th className="pb-3 text-center font-semibold">Working Hr's</th>
                <th className="pb-3 text-center font-semibold">Break Time</th>
                <th className="pb-3 text-center font-semibold">Extra Hr's</th>
                <th className="pb-3 text-right pr-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAttendance.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                >
                  {/* Avatar + Name + Role */}
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                        <img
                          src={row.avatar}
                          alt={row.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=0a385c&color=fff`
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-[12px] group-hover:text-[#093557] transition-colors">
                          {row.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.role}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Check In */}
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          row.checkInType === 'late' ? 'bg-rose-500' : 'bg-sky-500'
                        }`}
                      />
                      {row.checkIn}
                    </span>
                  </td>

                  {/* Check Out */}
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          row.checkOutType === 'late' ? 'bg-rose-500' : 'bg-sky-500'
                        }`}
                      />
                      {row.checkOut}
                    </span>
                  </td>

                  {/* Working Hr's */}
                  <td className={`py-3 text-center font-medium ${row.workingHrsColor}`}>
                    {row.workingHrs}
                  </td>

                  {/* Break Time */}
                  <td className={`py-3 text-center ${row.breakTimeColor}`}>
                    {row.breakTime}
                  </td>

                  {/* Extra Hr's */}
                  <td className={`py-3 text-center ${row.extraHrsColor}`}>
                    {row.extraHrs}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 text-right pr-2">
                    <span className={`text-[11px] ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
