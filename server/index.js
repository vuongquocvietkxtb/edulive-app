import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db, { hashPassword } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../client/dist');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// In-memory active rooms data (whiteboard strokes, participants)
const activeRooms = new Map();

// Helper to get or create room state
function getRoomState(roomId) {
  if (!activeRooms.has(roomId)) {
    activeRooms.set(roomId, {
      id: roomId,
      title: 'Lớp học Trực tuyến',
      teacher: null,
      participants: new Map(), // socketId -> { name, role, joinedAt, recordId }
      whiteboardHistory: [],
      sessionId: null
    });
  }
  return activeRooms.get(roomId);
}

// ======================== REST API ========================

// 0. Authentication
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email này đã được đăng ký tài khoản trong hệ thống' });
    }

    const userId = 'usr-' + crypto.randomUUID().slice(0, 8);
    // Lớp học chỉ có 1 giáo viên duy nhất là Giáo viên Nguyễn Thị Loan
    const userRole = 'student';
    const avatar = '🎓';
    const passHash = hashPassword(password);

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, avatar)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name.trim(), cleanEmail, passHash, userRole, avatar);

    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        role: userRole,
        avatar
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Tài khoản email này không tồn tại trong hệ thống' });
    }

    const passHash = hashPassword(password);
    if (user.password_hash !== passHash) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác' });
    }

    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    res.json({
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || (user.role === 'teacher' ? '👨‍🏫' : '🎓')
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Courses
app.get('/api/courses', (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.id) as quiz_count,
        (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as lesson_count
      FROM courses c
      ORDER BY c.created_at DESC
    `).all();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses', (req, res) => {
  try {
    const { title, description, teacher_name, schedule } = req.body;
    const id = 'course-' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO courses (id, title, description, teacher_name, schedule)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, title, description || '', teacher_name || 'Giảng viên', schedule || '');
    res.status(201).json({ id, title, description, teacher_name, schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Quizzes
app.get('/api/quizzes', (req, res) => {
  try {
    const quizzes = db.prepare(`
      SELECT q.*, c.title as course_title,
        (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count,
        (SELECT COUNT(*) FROM quiz_submissions qs WHERE qs.quiz_id = q.id) as submission_count
      FROM quizzes q
      LEFT JOIN courses c ON q.course_id = c.id
      ORDER BY q.created_at DESC
    `).all();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quizzes/:id', (req, res) => {
  try {
    const quiz = db.prepare(`
      SELECT q.*, c.title as course_title
      FROM quizzes q
      LEFT JOIN courses c ON q.course_id = c.id
      WHERE q.id = ?
    `).get(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz không tồn tại' });
    }

    const questions = db.prepare(`
      SELECT id, question, options_json, explanation
      FROM quiz_questions
      WHERE quiz_id = ?
    `).all(req.params.id).map(q => ({
      ...q,
      options: JSON.parse(q.options_json)
    }));

    res.json({ ...quiz, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Quiz
app.post('/api/quizzes', (req, res) => {
  try {
    const { title, description, course_id, duration_minutes, questions } = req.body;
    const quizId = 'quiz-' + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO quizzes (id, course_id, title, description, duration_minutes)
      VALUES (?, ?, ?, ?, ?)
    `).run(quizId, course_id || null, title, description || '', Number(duration_minutes) || 15);

    if (Array.isArray(questions)) {
      const insertQ = db.prepare(`
        INSERT INTO quiz_questions (id, quiz_id, question, options_json, correct_index, explanation)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const q of questions) {
        const qId = 'q-' + crypto.randomUUID().slice(0, 8);
        insertQ.run(
          qId,
          quizId,
          q.question,
          JSON.stringify(q.options),
          Number(q.correct_index),
          q.explanation || ''
        );
      }
    }

    res.status(201).json({ id: quizId, message: 'Tạo đề thi thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Quiz and auto-grade
app.post('/api/quizzes/:id/submit', (req, res) => {
  try {
    const { student_name, user_answers } = req.body; // user_answers: { [qId]: optionIndex }
    const quizId = req.params.id;

    const questions = db.prepare(`
      SELECT id, question, options_json, correct_index, explanation
      FROM quiz_questions
      WHERE quiz_id = ?
    `).all(quizId);

    if (questions.length === 0) {
      return res.status(400).json({ error: 'Đề thi chưa có câu hỏi' });
    }

    let correctCount = 0;
    const gradedResults = questions.map(q => {
      const selectedIndex = user_answers ? user_answers[q.id] : undefined;
      const isCorrect = selectedIndex !== undefined && Number(selectedIndex) === q.correct_index;
      if (isCorrect) correctCount++;

      return {
        id: q.id,
        question: q.question,
        options: JSON.parse(q.options_json),
        user_selected: selectedIndex,
        correct_index: q.correct_index,
        is_correct: isCorrect,
        explanation: q.explanation
      };
    });

    const score = Math.round((correctCount / questions.length) * 100) / 10; // Thang điểm 10
    const submissionId = 'sub-' + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO quiz_submissions (id, quiz_id, student_name, score, total_questions, answers_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      submissionId,
      quizId,
      student_name || 'Học viên ẩn danh',
      score,
      questions.length,
      JSON.stringify(gradedResults)
    );

    res.json({
      submission_id: submissionId,
      score,
      correct_count: correctCount,
      total_questions: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100),
      graded_results: gradedResults
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quiz submissions & leaderboard
app.get('/api/quizzes/:id/submissions', (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT * FROM quiz_submissions
      WHERE quiz_id = ?
      ORDER BY score DESC, submitted_at ASC
    `).all(req.params.id);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Attendance
app.get('/api/attendance', (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT s.*, 
        COUNT(r.id) as total_attendees,
        SUM(CASE WHEN r.duration_seconds > 60 THEN 1 ELSE 0 END) as qualified_attendees
      FROM attendance_sessions s
      LEFT JOIN attendance_records r ON s.id = r.session_id
      GROUP BY s.id
      ORDER BY s.started_at DESC
    `).all();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance/:sessionId', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM attendance_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Phiên điểm danh không tồn tại' });

    const records = db.prepare(`
      SELECT * FROM attendance_records
      WHERE session_id = ?
      ORDER BY joined_at ASC
    `).all(req.params.sessionId);

    res.json({ session, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================== SOCKET.IO REALTIME ========================

io.on('connection', (socket) => {
  let currentUser = null;
  let currentRoomId = null;

  // 1. Join Room
  socket.on('join-room', ({ roomId, user }) => {
    currentRoomId = roomId;
    currentUser = {
      socketId: socket.id,
      name: user.name || 'Người dùng',
      role: user.role || 'student', // 'teacher' | 'student'
      joinedAt: new Date().toISOString()
    };

    socket.join(roomId);
    const room = getRoomState(roomId);

    // Initialize session in DB if teacher starts the room and no session exists
    if (currentUser.role === 'teacher' && !room.sessionId) {
      room.sessionId = 'ses-' + crypto.randomUUID().slice(0, 8);
      room.teacher = currentUser.name;
      try {
        db.prepare(`
          INSERT INTO attendance_sessions (id, room_id, room_title, teacher_name, started_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(room.sessionId, roomId, room.title, currentUser.name, new Date().toISOString());
      } catch (err) {
        console.error('Lỗi tạo attendance session:', err.message);
      }
    }

    // Record attendance entry
    let recordId = 'rec-' + crypto.randomUUID().slice(0, 8);
    currentUser.recordId = recordId;
    room.participants.set(socket.id, currentUser);

    if (room.sessionId) {
      try {
        db.prepare(`
          INSERT INTO attendance_records (id, session_id, user_name, user_role, joined_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(recordId, room.sessionId, currentUser.name, currentUser.role, currentUser.joinedAt);
      } catch (err) {
        console.error('Lỗi ghi nhận attendance record:', err.message);
      }
    }

    // Send current state to newly joined user
    socket.emit('room-state', {
      roomId,
      participants: Array.from(room.participants.values()),
      whiteboardHistory: room.whiteboardHistory,
      sessionId: room.sessionId
    });

    // Notify other room members
    socket.to(roomId).emit('user-joined', currentUser);

    // Broadcast updated participant list
    io.to(roomId).emit('participants-updated', Array.from(room.participants.values()));
  });

  // 2. Whiteboard Drawing
  socket.on('whiteboard-draw', ({ roomId, action }) => {
    const room = getRoomState(roomId);
    room.whiteboardHistory.push(action);
    // Broadcast stroke to all others in the room
    socket.to(roomId).emit('whiteboard-draw-update', action);
  });

  socket.on('whiteboard-undo', ({ roomId }) => {
    const room = getRoomState(roomId);
    if (room.whiteboardHistory.length === 0) return;
    const last = room.whiteboardHistory[room.whiteboardHistory.length - 1];
    if (last.strokeId) {
      room.whiteboardHistory = room.whiteboardHistory.filter((a) => a.strokeId !== last.strokeId);
    } else {
      room.whiteboardHistory.pop();
    }
    io.to(roomId).emit('whiteboard-history-sync', room.whiteboardHistory);
  });

  // Live Speech-to-Board: chữ nháp (interim) của giáo viên
  socket.on('whiteboard-voice-preview', ({ roomId, preview }) => {
    socket.to(roomId).emit('whiteboard-voice-preview', preview);
  });

  socket.on('whiteboard-clear', ({ roomId }) => {
    const room = getRoomState(roomId);
    room.whiteboardHistory = [];
    io.to(roomId).emit('whiteboard-cleared');
  });

  // 3. WebRTC Signaling (Video & Audio & Screen Share)
  socket.on('signal-offer', ({ targetId, offer, senderInfo }) => {
    io.to(targetId).emit('signal-offer', {
      offer,
      senderId: socket.id,
      senderInfo: senderInfo || currentUser
    });
  });

  socket.on('signal-answer', ({ targetId, answer }) => {
    io.to(targetId).emit('signal-answer', {
      answer,
      senderId: socket.id
    });
  });

  socket.on('signal-ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('signal-ice-candidate', {
      candidate,
      senderId: socket.id
    });
  });

  // 4. In-room Chat
  socket.on('chat-message', ({ roomId, text }) => {
    if (!currentUser) return;
    const message = {
      id: 'msg-' + crypto.randomUUID().slice(0, 8),
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderId: socket.id,
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    io.to(roomId).emit('chat-message', message);
  });

  // 5. Hand Raising & Teacher controls
  socket.on('toggle-hand', ({ roomId, isRaised }) => {
    if (!currentUser) return;
    io.to(roomId).emit('hand-toggled', {
      user: currentUser,
      isRaised
    });
  });

  socket.on('teacher-action', ({ roomId, action, payload }) => {
    if (currentUser?.role !== 'teacher') return;
    io.to(roomId).emit('teacher-action-broadcast', { action, payload });
  });

  // 6. Handle Disconnect & Leave
  const handleLeave = () => {
    if (!currentRoomId || !currentUser) return;
    const room = activeRooms.get(currentRoomId);
    if (room) {
      room.participants.delete(socket.id);
      const leaveTime = new Date().toISOString();
      const durationSeconds = Math.max(0, Math.floor((new Date(leaveTime) - new Date(currentUser.joinedAt)) / 1000));

      // Update attendance record with left_at and duration
      if (currentUser.recordId) {
        try {
          db.prepare(`
            UPDATE attendance_records
            SET left_at = ?, duration_seconds = ?
            WHERE id = ?
          `).run(leaveTime, durationSeconds, currentUser.recordId);
        } catch (err) {
          console.error('Lỗi cập nhật attendance record khi rời phòng:', err.message);
        }
      }

      socket.to(currentRoomId).emit('user-left', {
        socketId: socket.id,
        name: currentUser.name,
        role: currentUser.role
      });

      io.to(currentRoomId).emit('participants-updated', Array.from(room.participants.values()));
    }
  };

  socket.on('leave-room', handleLeave);
  socket.on('disconnect', handleLeave);
});

// Serve static frontend assets in production (Single Unified App)
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`EduLive backend server running on http://localhost:${PORT}`);
});
