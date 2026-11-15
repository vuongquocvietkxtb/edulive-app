import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  HelpCircle,
  FileQuestion
} from 'lucide-react';

export default function QuizCreate({ onBack, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [questions, setQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: ''
    }
  ]);
  const [saving, setSaving] = useState(false);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: ''
      }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx, text) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[idx].question = text;
      return copy;
    });
  };

  const handleOptionChange = (qIdx, optIdx, text) => {
    setQuestions(prev => {
      const copy = [...prev];
      const newOpts = [...copy[qIdx].options];
      newOpts[optIdx] = text;
      copy[qIdx].options = newOpts;
      return copy;
    });
  };

  const handleCorrectIndexChange = (qIdx, optIdx) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].correct_index = optIdx;
      return copy;
    });
  };

  const handleExplanationChange = (qIdx, text) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].explanation = text;
      return copy;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Vui lòng nhập tiêu đề bài thi');

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        return alert(`Câu hỏi số ${i + 1} chưa có nội dung`);
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].trim()) {
          return alert(`Câu hỏi ${i + 1} chưa điền phương án ${String.fromCharCode(65 + j)}`);
        }
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          duration_minutes: duration,
          questions
        })
      });

      if (res.ok) {
        alert('Tạo đề thi trắc nghiệm thành công!');
        onCreated();
      } else {
        const err = await res.json();
        alert('Lỗi: ' + err.error);
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Soạn Đề Thi Trắc Nghiệm Mới</h2>
            <p className="text-xs text-slate-400">Được thiết kế cho Giảng viên tạo câu hỏi & đáp án tự động</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Đang lưu...' : 'Lưu & Phát hành'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic info card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Thông tin chung</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tiêu đề đề thi</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Kiểm tra kiến thức Lập trình React Hooks"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Thời gian làm (phút)</label>
              <input
                type="number"
                min="1"
                max="180"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Mô tả bài kiểm tra</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Đánh giá hiểu biết về useState, useEffect và Component Lifecycle..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
              Danh sách câu hỏi ({questions.length})
            </h3>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi</span>
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                  Câu hỏi #{qIdx + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nội dung câu hỏi</label>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                  placeholder={`Nhập câu hỏi ${qIdx + 1}...`}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Options */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Các phương án lựa chọn (Chọn nút tròn bên phải cho đáp án ĐÚNG)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correct_index === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                          isCorrect ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                          isCorrect ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                          placeholder={`Lựa chọn ${String.fromCharCode(65 + optIdx)}...`}
                          className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleCorrectIndexChange(qIdx, optIdx)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isCorrect ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600 hover:border-indigo-400'
                          }`}
                          title="Chọn làm đáp án đúng"
                        >
                          {isCorrect && <CheckCircle className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Giải thích đáp án (Hiển thị cho học sinh sau khi chấm điểm)
                </label>
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                  placeholder="Giải thích ngắn gọn tại sao phương án này chính xác..."
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

            </div>
          ))}
        </div>

        {/* Add Question bottom trigger */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Thêm câu hỏi tiếp theo</span>
          </button>
        </div>

      </form>
    </div>
  );
}
