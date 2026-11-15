import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  Users, 
  Clock, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react';

export default function AttendanceIndex() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch('/api/attendance')
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải danh sách điểm danh:', err);
        setLoading(false);
      });
  }, []);

  const handleSelectSession = (id) => {
    setSelectedSessionId(id);
    setDetailLoading(true);
    fetch(`/api/attendance/${id}`)
      .then(res => res.json())
      .then(data => {
        setSessionDetail(data);
        setDetailLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải chi tiết phiên điểm danh:', err);
        setDetailLoading(false);
      });
  };

  const handleExportCSV = (session, records) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "STT,Ho va ten,Vai tro,Gio vao,Gio roi,Thoi gian hoc (giay),Trang thai\n"
      + records.map((r, idx) => {
          const duration = r.duration_seconds || 0;
          const status = duration >= 60 ? "Chuyen can" : "Roi som";
          return `${idx + 1},"${r.user_name}","${r.user_role}","${r.joined_at}","${r.left_at || 'Dang trong phong'}","${duration}","${status}"`;
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BaoCao_ChuyenCan_${session.room_id}_${session.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Session Detail View
  if (selectedSessionId && sessionDetail) {
    const { session, records } = sessionDetail;
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedSessionId(null); setSessionDetail(null); }}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{session.room_title || session.room_id}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
                  {session.room_id}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Giảng viên: <strong className="text-slate-300">{session.teacher_name}</strong> • Bắt đầu lúc {new Date(session.started_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleExportCSV(session, records)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all flex-shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất file Excel / CSV</span>
          </button>
        </div>

        {/* Detailed Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/60 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                  <th className="py-3 px-4 font-semibold">Học viên</th>
                  <th className="py-3 px-4 font-semibold">Vai trò</th>
                  <th className="py-3 px-4 font-semibold">Thời điểm vào</th>
                  <th className="py-3 px-4 font-semibold">Thời điểm rời</th>
                  <th className="py-3 px-4 font-semibold text-center">Tổng thời lượng</th>
                  <th className="py-3 px-4 font-semibold text-center">Đánh giá chuyên cần</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      Chưa có dữ liệu thành viên tham gia
                    </td>
                  </tr>
                ) : (
                  records.map((rec, idx) => {
                    const durationMins = Math.floor((rec.duration_seconds || 0) / 60);
                    const durationSecs = (rec.duration_seconds || 0) % 60;
                    const isQualified = (rec.duration_seconds || 0) > 60 || !rec.left_at;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100">{rec.user_name}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            rec.user_role === 'teacher' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {rec.user_role === 'teacher' ? 'Giảng viên' : 'Học viên'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                          {new Date(rec.joined_at).toLocaleTimeString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                          {rec.left_at ? new Date(rec.left_at).toLocaleTimeString('vi-VN') : (
                            <span className="text-emerald-400 font-medium">Đang trong phòng</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-200">
                          {rec.left_at ? `${durationMins}p ${durationSecs}s` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isQualified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Chuyên cần</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30">
                              <AlertCircle className="w-3 h-3" />
                              <span>Vắng sớm</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // 2. Sessions List View
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-3">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Báo Cáo Điểm Danh Tự Động</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Nhật Ký Buổi Học & Thống Kê Chuyên Cần
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
          Tự động ghi nhận thời gian bắt đầu, số lượng học sinh tham gia và thời lượng học tập của từng cá nhân trong mỗi buổi học online.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Chưa có phiên điểm danh nào</h3>
          <p className="text-xs text-slate-500 mt-1">Khi Giảng viên bắt đầu một phòng học trực tuyến, dữ liệu điểm danh sẽ tự động xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((ses) => (
            <div
              key={ses.id}
              onClick={() => handleSelectSession(ses.id)}
              className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/50 shadow-xl cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-semibold border border-indigo-500/30">
                  {ses.room_id}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(ses.started_at).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mb-2">
                {ses.room_title || 'Lớp học trực tuyến'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Giảng viên: <strong className="text-slate-300">{ses.teacher_name}</strong>
              </p>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <strong className="text-slate-200">{ses.total_attendees || 0}</strong> người tham gia
                </span>
                <span className="text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                  Xem chi tiết →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
