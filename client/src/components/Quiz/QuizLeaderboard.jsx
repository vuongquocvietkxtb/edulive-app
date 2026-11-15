import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Medal, Award, User, Calendar } from 'lucide-react';

export default function QuizLeaderboard({ quizId, quizTitle, onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quizzes/${quizId}/submissions`)
      .then(res => res.json())
      .then(data => {
        setSubmissions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải danh sách bài nộp:', err);
        setLoading(false);
      });
  }, [quizId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Bảng Điểm & Xếp Hạng</span>
          </h2>
          <p className="text-xs text-slate-400">{quizTitle || 'Bài kiểm tra trắc nghiệm'}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Chưa có lượt nộp bài nào</h3>
          <p className="text-xs text-slate-500 mt-1">Hãy là người đầu tiên hoàn thành bài kiểm tra này!</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/60 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold text-center w-16">Hạng</th>
                  <th className="py-3 px-4 font-semibold">Học viên</th>
                  <th className="py-3 px-4 font-semibold text-center">Điểm số</th>
                  <th className="py-3 px-4 font-semibold text-center">Số câu đúng</th>
                  <th className="py-3 px-4 font-semibold text-right">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {submissions.map((sub, idx) => {
                  let rankBadge = <span className="text-slate-400 font-bold">#{idx + 1}</span>;
                  if (idx === 0) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40">
                        🥇 1
                      </span>
                    );
                  } else if (idx === 1) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 font-bold border border-slate-400/40">
                        🥈 2
                      </span>
                    );
                  } else if (idx === 2) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 font-bold border border-amber-700/40">
                        🥉 3
                      </span>
                    );
                  }

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-center">{rankBadge}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span>{sub.student_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                          sub.score >= 8 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : sub.score >= 5
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {sub.score} / 10
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-medium">
                        {Math.round((sub.score / 10) * sub.total_questions)} / {sub.total_questions}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
