import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import QuizTake from './QuizTake';
import QuizCreate from './QuizCreate';
import QuizLeaderboard from './QuizLeaderboard';
import { 
  CheckSquare, 
  Clock, 
  HelpCircle, 
  Plus, 
  Play, 
  Trophy, 
  BookOpen,
  Sparkles,
  FileCheck2
} from 'lucide-react';

export default function QuizIndex() {
  const { user } = useUser();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation mode: 'list' | 'take' | 'create' | 'leaderboard'
  const [mode, setMode] = useState('list');
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [activeQuizTitle, setActiveQuizTitle] = useState('');

  const fetchQuizzes = () => {
    setLoading(true);
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(data => {
        setQuizzes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải danh sách trắc nghiệm:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleStartQuiz = (id) => {
    setActiveQuizId(id);
    setMode('take');
  };

  const handleViewLeaderboard = (quiz) => {
    setActiveQuizId(quiz.id);
    setActiveQuizTitle(quiz.title);
    setMode('leaderboard');
  };

  if (mode === 'take') {
    return (
      <QuizTake
        quizId={activeQuizId}
        user={user}
        onBack={() => {
          setMode('list');
          fetchQuizzes();
        }}
      />
    );
  }

  if (mode === 'create') {
    return (
      <QuizCreate
        onBack={() => setMode('list')}
        onCreated={() => {
          setMode('list');
          fetchQuizzes();
        }}
      />
    );
  }

  if (mode === 'leaderboard') {
    return (
      <QuizLeaderboard
        quizId={activeQuizId}
        quizTitle={activeQuizTitle}
        onBack={() => setMode('list')}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-2xl mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-3">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Trắc Nghiệm & Chấm Điểm Tự Động</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Kiểm Tra Kiến Thức & Bài Tập Trực Tuyến
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
            Hệ thống tự động chấm điểm ngay sau khi nộp bài, cung cấp biểu đồ kết quả tức thì và phân tích lời giải chi tiết cho từng câu hỏi.
          </p>
        </div>

        {user.role === 'teacher' && (
          <button
            onClick={() => setMode('create')}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Soạn đề thi mới</span>
          </button>
        )}
      </div>

      {/* Quizzes List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
          <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Chưa có bài thi trắc nghiệm nào</h3>
          <p className="text-xs text-slate-500 mt-1">Giảng viên có thể bấm "Soạn đề thi mới" để tạo bài kiểm tra.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    {quiz.course_title || 'Kiến thức chung'}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{quiz.duration_minutes} phút</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mb-2 line-clamp-2">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {quiz.description || 'Bài kiểm tra trắc nghiệm đánh giá kiến thức trọng tâm.'}
                </p>
              </div>

              <div>
                {/* Meta stats */}
                <div className="flex items-center justify-between py-3 border-t border-slate-800 text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <strong className="text-slate-200">{quiz.question_count || 0}</strong> câu hỏi
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <strong className="text-slate-200">{quiz.submission_count || 0}</strong> lượt nộp
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Làm bài thi</span>
                  </button>
                  <button
                    onClick={() => handleViewLeaderboard(quiz)}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-colors"
                    title="Bảng xếp hạng"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
