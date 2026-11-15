# EduLive - Phần Mềm Giảng Dạy Trực Tuyến & Lớp Học Ảo

Hệ thống giảng dạy trực tuyến hiện đại kết hợp **Virtual Classroom** (Lớp học ảo thời gian thực) và **LMS** (Hệ thống quản lý học tập & trắc nghiệm tự động).

---

## 🌟 Tính Năng Nổi Bật

### 1. Phòng Học Trực Tuyến Thời Gian Thực (Live Classroom)
- **Bảng trắng tương tác (Collaborative Whiteboard)**:
  - **Gõ chữ trực tiếp từ bàn phím**: Chọn công cụ "Chữ viết", nhấp chuột lên bảng để mở khung nhập liệu; khi gõ từ bàn phím chữ sẽ hiển thị sắc nét trực tiếp trên bảng và truyền tức thì tới tất cả học viên.
  - Hỗ trợ đổi cỡ chữ (Nhỏ, Vừa, Lớn, Tiêu đề) và bảng màu trực quan.
  - Bút vẽ vector tự do, đường thẳng, hình chữ nhật, hình tròn, tẩy xóa.
  - Đồng bộ tức thì qua WebSocket/Socket.IO: học viên nhìn thấy mọi thao tác vẽ/viết/gõ chữ của giảng viên theo thời gian thực.
  - Chức năng lưu ảnh bài giảng (.png) để lưu trữ sau buổi học.
- **Truyền dẫn Video & Audio HD**:
  - Tích hợp chuẩn WebRTC cho chất lượng hình ảnh sắc nét, độ trễ cực thấp.
  - Chức năng **Chia sẻ màn hình (Screen Share)** trình chiếu slide bài giảng, video hoặc cửa sổ ứng dụng.
- **Tương tác hai chiều trong lớp**:
  - Khung chat trao đổi trực tiếp trong phòng học có gắn nhãn vai trò và mốc thời gian.
  - Tính năng **Giơ tay phát biểu (Raise Hand)** thông báo sinh động.
  - Bảng điều khiển Giảng viên: Quyền tắt micro cả lớp (**Mute All**).

### 2. Trắc Nghiệm Online & Chấm Điểm Tự Động (Auto-grading Quiz)
- **Soạn đề thi linh hoạt**: Giảng viên có thể tạo đề thi với số lượng câu hỏi không giới hạn, nhập 4 phương án, chọn đáp án đúng và thêm giải thích chi tiết.
- **Làm bài thi trực tiếp**: Đồng hồ đếm ngược thông minh, bộ điều hướng câu hỏi trực quan.
- **Chấm điểm tức thì & Pháo hoa chúc mừng**: Hệ thống tính toán điểm số (thang điểm 10), phần trăm chính xác ngay khi nộp bài.
- **Phân tích kết quả chi tiết**: Hiển thị rõ câu đúng/sai, đối chiếu đáp án học viên chọn với đáp án chuẩn kèm lời giải thích cặn kẽ.
- **Bảng xếp hạng (Leaderboard)**: Vinh danh các học viên có điểm số cao nhất và nộp bài nhanh nhất.

### 4. Hệ Thống Tài Khoản & Đăng Nhập (Authentication)
- **Đăng ký / Đăng nhập riêng biệt**: Học sinh và Giáo viên có tài khoản cá nhân lưu trữ an toàn trong SQLite database.
- **Tài khoản mẫu có sẵn**:
  - Giảng viên: `giaovien@edulive.vn` (Mật khẩu: `123456`)
  - Học viên: `hocsinh@edulive.vn` (Mật khẩu: `123456`)
- **Tương thích mọi thiết bị**: Học sinh có thể dùng máy tính bàn, laptop, iPad, điện thoại Android/iPhone đăng nhập và học tập trực tuyến.

---

## 🌐 Cách Cho Học Sinh Nơi Khác Vào Học Qua Internet
1. Khởi động hệ thống bằng `start-edulive.bat`.
2. Nhấp đúp chuột vào file `share-internet.bat`.
3. Hệ thống sẽ tạo ra 1 đường link Internet an toàn (HTTPS), ví dụ: `https://edulive-lop-hoc.loca.lt`.
4. Gửi link này cho học sinh ở bất cứ đâu: học sinh chỉ cần bấm vào link trên điện thoại hoặc máy tính để đăng nhập và vào lớp học ngay lập tức!

---

## 🚀 Hướng Dẫn Khởi Chạy

### Cách 1: Khởi động nhanh với 1 Click (Khuyên dùng trên Windows)
Nhấp đúp chuột vào file:
```
start-edulive.bat
```
Hệ thống sẽ tự động khởi động cả Backend (Port 5000), Frontend (Port 3000) và mở trình duyệt cho bạn.

---

### Cách 2: Khởi động thủ công bằng dòng lệnh

#### 1. Khởi động Máy chủ Backend (Node.js & Socket.IO):
```powershell
cd server
node index.js
```
Backend lắng nghe tại: `http://localhost:5000`

#### 2. Khởi động Giao diện Frontend (Vite & React):
Mở một cửa sổ dòng lệnh khác:
```powershell
cd client
npm.cmd run dev
```
Truy cập giao diện tại: `http://localhost:3000`

---

## 👥 Thử Nghiệm Tương Tác Giảng Viên & Học Viên
1. Mở tab 1 trên trình duyệt tại `http://localhost:3000` với vai trò **Giảng viên** và bấm **Vào lớp** (ví dụ mã phòng `PHONG-101`).
2. Mở tab 2 (hoặc cửa sổ ẩn danh) tại `http://localhost:3000`, ở góc trên bên phải bấm chuyển sang **Học viên**, sau đó vào cùng mã phòng `PHONG-101`.
3. Bạn sẽ thấy bảng trắng, tin nhắn chat, trạng thái giơ tay và danh sách điểm danh được đồng bộ tức thời giữa hai bên!
