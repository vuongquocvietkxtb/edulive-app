import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export default function QuizTake({ quizId, user, onBack }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qId]: optionIndex }
  const [timeLeft, setTimeLeft] = useState(600); // seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch quiz detail
  useEffect(() => {
    fetch(`/api/quizzes/${quizId}`)
      .then(res => res.json())
      .then(data => {
        setQuiz(data);
        setTimeLeft((data.duration_minutes || 10) * 60);
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải đề thi:', err);
        setLoading(false);
      });
  }, [quizId]);

  // Countdown timer
  useEffect(() => {
    if (loading || isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isSubmitted, timeLeft]);

  const handleSelectOption = (qId, optionIdx) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleSubmitQuiz = async () => {
    if (submitting || isSubmitted) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: user.name,
          user_answers: answers
        })
      });
      const data = await res.json();
      setResult(data);
      setIsSubmitted(true);

      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      alert('Lỗi nộp bài: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Không tìm thấy bài thi này.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg text-white">Quay lại</button>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentIdx];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredCount = Object.keys(answers).length;

  // 1. Result View
  if (isSubmitted && result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Score Card Header */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/80 border border-indigo-500/30 shadow-2xl text-center mb-8 relative overflow-hidden">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 mb-3 border border-amber-500/30">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Kết Quả Bài Kiểm Tra</h2>
          <p className="text-sm text-slate-300 mt-1">{quiz.title}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 min-w-[130px]">
              <span className="text-xs text-slate-400 block mb-1">Điểm số</span>
              <span className="text-3xl font-extrabold text-indigo-400">{result.score}</span>
              <span className="text-xs text-slate-400"> / 10</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 min-w-[130px]">
              <span className="text-xs text-slate-400 block mb-1">Số câu đúng</span>
              <span className="text-3xl font-extrabold text-emerald-400">{result.correct_count}</span>
              <span className="text-xs text-slate-400"> / {result.total_questions}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 min-w-[130px]">
              <span className="text-xs text-slate-400 block mb-1">Tỷ lệ chính xác</span>
              <span className="text-3xl font-extrabold text-sky-400">{result.percentage}%</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              Danh sách đề thi
            </button>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setAnswers({});
                setCurrentIdx(0);
                setTimeLeft((quiz.duration_minutes || 10) * 60);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại bài thi</span>
            </button>
          </div>
        </div>

        {/* Detailed Questions Review */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Chi tiết đáp án & Lời giải</h3>
          {result.graded_results.map((gr, idx) => (
            <div
              key={gr.id}
              className={`p-5 rounded-2xl border transition-all ${
                gr.is_correct 
                  ? 'bg-slate-900/60 border-emerald-500/30' 
                  : 'bg-slate-900/60 border-rose-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    gr.is_correct ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    Câu {idx + 1}
                  </span>
                  {gr.is_correct ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Chính xác
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                      <XCircle className="w-4 h-4" /> Chưa đúng
                    </span>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-semibold text-slate-100 mb-4">{gr.question}</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {gr.options.map((opt, optIdx) => {
                  const isUserPick = gr.user_selected === optIdx;
                  const isCorrect = gr.correct_index === optIdx;

                  let optClass = 'bg-slate-800/40 text-slate-400 border-slate-800';
                  if (isCorrect) {
                    optClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold';
                  } else if (isUserPick && !isCorrect) {
                    optClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40 line-through';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optClass}`}
                    >
                      <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                      {isUserPick && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {gr.explanation && (
                <div className="mt-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-indigo-300">Giải thích: </strong>
                    <span>{gr.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    );
  }

  // 2. Quiz Taking View
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Top Bar: Title & Countdown Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-white">{quiz.title}</h2>
            <p className="text-xs text-slate-400">
              Đã trả lời: <strong className="text-indigo-400">{answeredCount}/{questions.length}</strong> câu
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-mono font-bold ${
          timeLeft <= 120 
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' 
            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
        }`}>
          <Clock className="w-4 h-4" />
          <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Main Question Card */}
      {currentQ && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              Câu {currentIdx + 1} / {questions.length}
            </span>
            <span className="text-xs text-slate-400">Chọn 1 đáp án chính xác nhất</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed mb-6">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = answers[currentQ.id] === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectOption(currentQ.id, idx)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm font-medium">{opt}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-slate-600'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Controls & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Question Map Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                  isCurrent
                    ? 'ring-2 ring-indigo-400 bg-indigo-600 text-white'
                    : isAnswered
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Prev / Next / Submit Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Câu trước</span>
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Câu sau</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Đang chấm điểm...' : 'Nộp bài thi'}</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
