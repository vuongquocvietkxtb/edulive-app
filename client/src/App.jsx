import React, { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Classroom from './components/Classroom';
import CoursesIndex from './components/Courses';
import QuizIndex from './components/Quiz';
import AttendanceIndex from './components/Attendance';
import AuthModal from './components/Auth/AuthModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState('classroom'); // 'classroom' | 'courses' | 'quizzes' | 'attendance'
  const { isAuthModalOpen, setIsAuthModalOpen } = useUser();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'classroom' && <Classroom />}
        {activeTab === 'courses' && (
          <CoursesIndex onEnterClassroom={() => setActiveTab('classroom')} />
        )}
        {activeTab === 'quizzes' && <QuizIndex />}
        {activeTab === 'attendance' && <AttendanceIndex />}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer (only show if not inside active live classroom to keep live view clean) */}
      {activeTab !== 'classroom' && (
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <p>© 2026 EduLive LMS & Virtual Classroom. Thiết kế và phát triển nền tảng giảng dạy trực tuyến tương tác cao.</p>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </UserProvider>
  );
}
