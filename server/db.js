import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'edulive.sqlite');

const db = new DatabaseSync(dbPath);

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'edulive_salt_2026').digest('hex');
}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    avatar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    teacher_name TEXT,
    schedule TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    doc_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 15,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    question TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT,
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
  );

  CREATE TABLE IF NOT EXISTS quiz_submissions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    score REAL NOT NULL,
    total_questions INTEGER NOT NULL,
    answers_json TEXT,
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
  );

  CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    room_title TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    joined_at TEXT NOT NULL,
    left_at TEXT,
    duration_seconds INTEGER DEFAULT 0,
    FOREIGN KEY(session_id) REFERENCES attendance_sessions(id)
  );
`);

// Insert default demo accounts if table is empty
const countUsers = db.prepare('SELECT count(*) as count FROM users').get();
if (countUsers.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr-teacher-1',
    'Thầy Nguyễn Văn Nam',
    'giaovien@edulive.vn',
    hashPassword('123456'),
    'teacher',
    '👨‍🏫'
  );

  insertUser.run(
    'usr-student-1',
    'Lê Hải Đăng',
    'hocsinh@edulive.vn',
    hashPassword('123456'),
    'student',
    '🎓'
  );

  insertUser.run(
    'usr-student-2',
    'Nguyễn Mai Anh',
    'maianh@edulive.vn',
    hashPassword('123456'),
    'student',
    '👩‍🎓'
  );
}

// Insert initial demo courses if empty
const countCourses = db.prepare('SELECT count(*) as count FROM courses').get();
if (countCourses.count === 0) {
  const insertCourse = db.prepare(`
    INSERT INTO courses (id, title, description, teacher_name, schedule)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCourse.run(
    'course-1',
    'Lập trình Web Frontend Hiện đại (React & Tailwind)',
    'Khóa học từ cơ bản đến nâng cao về xây dựng ứng dụng web với React, Hooks, Tailwind CSS và WebSockets.',
    'Thầy Nguyễn Văn Nam',
    'Tối Thứ 2, 4, 6 (19:30 - 21:00)'
  );

  insertCourse.run(
    'course-2',
    'Toán Ứng Dụng & Giải Thuật Lập Trình',
    'Tư duy logic, giải thuật cơ bản và cách áp dụng toán học vào lập trình thực chiến.',
    'Cô Trần Thu Hà',
    'Tối Thứ 3, 5, 7 (20:00 - 21:30)'
  );

  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (id, course_id, title, description, duration_minutes)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertQuiz.run(
    'quiz-1',
    'course-1',
    'Kiểm tra Kiến thức React & JavaScript ES6',
    'Đánh giá nhanh hiểu biết về JSX, useState, useEffect và Arrow Function.',
    10
  );

  const insertQuestion = db.prepare(`
    INSERT INTO quiz_questions (id, quiz_id, question, options_json, correct_index, explanation)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertQuestion.run(
    'q-1',
    'quiz-1',
    'Trong React, Hook nào được sử dụng để quản lý trạng thái (state) cục bộ của component?',
    JSON.stringify(['useEffect', 'useState', 'useContext', 'useReducer']),
    1,
    'useState là hook cơ bản nhất dùng để khai báo và cập nhật state trong function component.'
  );

  insertQuestion.run(
    'q-2',
    'quiz-1',
    'Đoạn mã sau in ra gì: console.log(typeof NaN)?',
    JSON.stringify(['"undefined"', '"nan"', '"number"', '"object"']),
    2,
    'Trong JavaScript, NaN (Not-a-Number) có kiểu dữ liệu là number.'
  );

  insertQuestion.run(
    'q-3',
    'quiz-1',
    'Khi nào useEffect với dependency array rỗng [] được thực thi?',
    JSON.stringify([
      'Chỉ chạy một lần duy nhất sau lần render đầu tiên (mount)',
      'Chạy mỗi khi bất kỳ state nào thay đổi',
      'Chạy trước khi component được mount',
      'Không bao giờ chạy'
    ]),
    0,
    'Dependency array rỗng [] báo hiệu cho React rằng effect chỉ phụ thuộc vào thời điểm mount.'
  );

  insertQuestion.run(
    'q-4',
    'quiz-1',
    'Giao thức nào cho phép truyền tải Video/Audio P2P với độ trễ siêu thấp trên trình duyệt?',
    JSON.stringify(['FTP', 'WebRTC', 'SMTP', 'GraphQL']),
    1,
    'WebRTC (Web Real-Time Communication) là chuẩn hỗ trợ audio/video và chia sẻ dữ liệu peer-to-peer thời gian thực.'
  );
}

export default db;
