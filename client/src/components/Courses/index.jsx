import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { 
  BookOpen, 
  Video, 
  CheckSquare, 
  Clock, 
  Plus, 
  User, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';

export default function CoursesIndex({ onEnterClassroom }) {
  const { user } = useUser();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCourses = () => {
    setLoading(true);
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải khóa học:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          teacher_name: user.name,
          schedule: schedule.trim()
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setSchedule('');
        fetchCourses();
      } else {
        alert('Lỗi tạo khóa học');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-2xl mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chương Trình Học & Giáo Trình</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Danh Mục Khóa Học Trực Tuyến
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
            Theo dõi lộ trình giảng dạy, lịch học trực tiếp và tài liệu tham khảo cho từng môn học.
          </p>
        </div>

        {user.role === 'teacher' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm khóa học mới</span>
          </button>
        )}
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Chưa có khóa học nào</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>{course.teacher_name}</span>
                  </span>
                  {course.schedule && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{course.schedule}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mb-2">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {course.description || 'Khóa học cung cấp kiến thức nền tảng và bài tập thực hành sinh động.'}
                </p>
              </div>

              <div>
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <strong>{course.quiz_count || 0}</strong> bài trắc nghiệm
                    </span>
                  </div>

                  <button
                    onClick={() => onEnterClassroom('PHONG-101')}
                    className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Vào lớp học Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Thêm Khóa Học Mới</h3>
            
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tên khóa học</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Lập trình Python & Phân tích Dữ liệu"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Lịch học</label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="VD: Tối Thứ 3, 5, 7 (19:30 - 21:00)"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Mô tả tóm tắt</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả nội dung trọng tâm của khóa học..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {creating ? 'Đang tạo...' : 'Tạo khóa học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
