import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useSocket } from '../context/SocketContext';
import { 
  GraduationCap, 
  Video, 
  BookOpen, 
  CheckSquare, 
  ClipboardList, 
  User, 
  Sparkles,
  Wifi,
  WifiOff,
  Edit2,
  LogIn,
  LogOut
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, switchRole, updateUserName, setIsAuthModalOpen, logout } = useUser();
  const { connected } = useSocket();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');

  const handleSaveName = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      updateUserName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const navItems = [
    { id: 'classroom', label: 'Phòng học Live', icon: Video, badge: 'HD Live' },
    { id: 'courses', label: 'Khóa học', icon: BookOpen },
    { id: 'quizzes', label: 'Trắc nghiệm & Bài tập', icon: CheckSquare },
    { id: 'attendance', label: 'Điểm danh & Chuyên cần', icon: ClipboardList },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('classroom')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  EduLive
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-wider">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400">Giảng dạy & Lớp học trực tuyến</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.2 rounded font-semibold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User profile & Auth controls */}
          <div className="flex items-center gap-2.5">
            {/* Realtime Status */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              {connected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-400 font-medium">Realtime sẵn sàng</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-400 font-medium">Đang kết nối...</span>
                </>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                {/* Fast Switch Role */}
                <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={() => switchRole('teacher')}
                    className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${
                      user.role === 'teacher'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Chuyển sang Giảng viên"
                  >
                    GV
                  </button>
                  <button
                    onClick={() => switchRole('student')}
                    className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${
                      user.role === 'student'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Chuyển sang Học viên"
                  >
                    HV
                  </button>
                </div>

                {/* Profile Chip */}
                <div 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="cursor-pointer flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 transition-all group"
                  title="Nhấn để đổi tài khoản hoặc đăng nhập"
                >
                  <span className="text-lg">{user.avatar || '👤'}</span>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate max-w-[120px]">
                      {user.name}
                    </p>
                    <span className={`text-[10px] font-medium block leading-none mt-0.5 ${
                      user.role === 'teacher' ? 'text-indigo-400' : 'text-emerald-400'
                    }`}>
                      {user.role === 'teacher' ? 'Giảng viên' : 'Học viên'}
                    </span>
                  </div>
                </div>

                {/* Logout / Switch Account */}
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors border border-slate-700/60"
                  title="Đăng nhập tài khoản khác / Đăng ký"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập / Đăng ký</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Mobile nav items */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 py-2 bg-slate-900/95">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 text-[11px] ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
