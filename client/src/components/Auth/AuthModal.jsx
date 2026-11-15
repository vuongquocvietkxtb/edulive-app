import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useUser();
  const [isRegisterTab, setIsRegisterTab] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student'); // 'student' | 'teacher'

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegisterTab) {
        if (!name.trim()) throw new Error('Vui lòng nhập họ và tên của bạn');
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role
        });
      } else {
        await login(email.trim(), password);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole) => {
    setErrorMsg('');
    setLoading(true);
    try {
      if (demoRole === 'teacher') {
        await login('giaovien@edulive.vn', '123456');
      } else {
        await login('hocsinh@edulive.vn', '123456');
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow background accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isRegisterTab ? 'Tạo Tài Khoản EduLive' : 'Đăng Nhập Lớp Học Trực Tuyến'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRegisterTab 
              ? 'Đăng ký tài khoản để học sinh và giáo viên tham gia lớp học từ xa'
              : 'Đăng nhập để vào phòng học, làm bài thi và tra cứu điểm danh'}
          </p>
        </div>

        {/* Quick Demo Login Buttons */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Đăng nhập thử nghiệm 1-Click:</span>
            <span className="text-indigo-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Nhanh
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('teacher')}
              className="py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <span>👩‍🏫 Cô Nguyễn Thị Loan</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('student')}
              className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <span>🎓 Học viên mẫu</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-800 rounded-xl mb-5 border border-slate-700">
          <button
            type="button"
            onClick={() => { setIsRegisterTab(false); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegisterTab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterTab(true); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegisterTab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name (for register) */}
          {isRegisterTab && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Họ và tên học sinh / giáo viên</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: hocsinh@edulive.vn"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role note for register */}
          {isRegisterTab && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Lớp học do <strong className="text-white">Giáo viên Nguyễn Thị Loan</strong> phụ trách. Bạn đang tạo tài khoản <strong className="text-emerald-400">Học viên</strong>.
              </span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>{loading ? 'Đang xử lý...' : (isRegisterTab ? 'Tạo tài khoản & Đăng nhập' : 'Đăng nhập vào lớp')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <p className="mt-5 text-center text-[11px] text-slate-500">
          Tài khoản dùng được trên mọi thiết bị máy tính, máy tính bảng và điện thoại di động.
        </p>

      </div>
    </div>
  );
}
