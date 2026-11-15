import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useUser } from '../../context/UserContext';
import Whiteboard from './Whiteboard';
import VideoGrid from './VideoGrid';
import Sidebar from './Sidebar';
import ControlBar from './ControlBar';
import { 
  Video, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  DoorOpen, 
  ShieldCheck, 
  Monitor,
  PenTool
} from 'lucide-react';

export default function Classroom() {
  const { socket, connected } = useSocket();
  const { user } = useUser();

  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('PHONG-101');
  const [customRoomId, setCustomRoomId] = useState('');
  
  // Classroom states
  const [viewMode, setViewMode] = useState('whiteboard'); // 'whiteboard' | 'grid'
  const [participants, setParticipants] = useState([]);
  const [whiteboardHistory, setWhiteboardHistory] = useState([]);
  const [raisedHands, setRaisedHands] = useState(new Set());
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Media states
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Quick preset rooms
  const presetRooms = [
    { id: 'PHONG-101', name: 'Lớp Lập trình Web Frontend', teacher: 'Thầy Nam', count: 12 },
    { id: 'PHONG-TOAN', name: 'Lớp Toán Ứng Dụng & Giải Thuật', teacher: 'Cô Hà', count: 8 },
    { id: 'PHONG-TIENG-ANH', name: 'Luyện nói Tiếng Anh Trực Tuyến', teacher: 'Mr. David', count: 15 }
  ];

  // Request user webcam/mic
  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      setIsVideoOn(true);
      setIsAudioOn(true);
    } catch (err) {
      console.warn('Không thể truy cập camera/mic thực tế (có thể chưa cắm hoặc bị chặn):', err.message);
      setIsVideoOn(false);
      setIsAudioOn(false);
    }
  };

  const stopMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);
  };

  const joinRoom = (targetRoomId) => {
    const finalRoom = (targetRoomId || roomId || 'PHONG-101').toUpperCase().trim();
    setRoomId(finalRoom);
    setInRoom(true);
    startMedia();

    if (socket) {
      socket.emit('join-room', {
        roomId: finalRoom,
        user: {
          name: user.name,
          role: user.role
        }
      });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId });
    }
    stopMedia();
    setInRoom(false);
    setParticipants([]);
    setRaisedHands(new Set());
    setIsHandRaised(false);
  };

  // Socket listener when inside a room
  useEffect(() => {
    if (!socket || !inRoom) return;

    const handleRoomState = (data) => {
      setParticipants(data.participants || []);
      setWhiteboardHistory(data.whiteboardHistory || []);
    };

    const handleParticipantsUpdated = (list) => {
      setParticipants(list);
    };

    const handleHandToggled = ({ user: handUser, isRaised }) => {
      setRaisedHands(prev => {
        const next = new Set(prev);
        if (isRaised) next.add(handUser.name);
        else next.delete(handUser.name);
        return next;
      });
    };

    const handleTeacherAction = ({ action }) => {
      if (action === 'mute-all' && user.role === 'student') {
        setIsAudioOn(false);
        if (localStream) {
          localStream.getAudioTracks().forEach(track => (track.enabled = false));
        }
        alert('Giảng viên đã tắt micro của bạn.');
      }
    };

    socket.on('room-state', handleRoomState);
    socket.on('participants-updated', handleParticipantsUpdated);
    socket.on('hand-toggled', handleHandToggled);
    socket.on('teacher-action-broadcast', handleTeacherAction);

    return () => {
      socket.off('room-state', handleRoomState);
      socket.off('participants-updated', handleParticipantsUpdated);
      socket.off('hand-toggled', handleHandToggled);
      socket.off('teacher-action-broadcast', handleTeacherAction);
    };
  }, [socket, inRoom, user, localStream]);

  // Audio Toggle
  const toggleAudio = () => {
    const next = !isAudioOn;
    setIsAudioOn(next);
    if (localStream) {
      localStream.getAudioTracks().forEach(track => (track.enabled = next));
    }
  };

  // Video Toggle
  const toggleVideo = () => {
    const next = !isVideoOn;
    setIsVideoOn(next);
    if (localStream) {
      localStream.getVideoTracks().forEach(track => (track.enabled = next));
    }
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        setViewMode('grid'); // switch to grid to see screen

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.warn('Hủy chia sẻ màn hình:', err.message);
      }
    }
  };

  // Hand raise toggle
  const toggleHand = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    if (socket) {
      socket.emit('toggle-hand', { roomId, isRaised: next });
    }
  };

  // 1. Lobby View (When not in room)
  if (!inRoom) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 p-8 sm:p-10 border border-indigo-500/30 shadow-2xl mb-10">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-xs font-semibold text-indigo-300 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phòng học Trực Tuyến Thế Hệ Mới</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Dạy & Học Trực Tuyến với <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Bảng Trắng Thời Gian Thực</span>
            </h1>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Tương tác hai chiều mượt mà: Video Call chất lượng cao, chia sẻ màn hình bài giảng, điểm danh tự động và bảng vẽ trực quan không độ trễ.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-gradient-to-l from-indigo-500 to-transparent flex items-center justify-center">
            <Video className="w-96 h-96 text-white" />
          </div>
        </div>

        {/* Join Card & Preset Rooms */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Custom Room Join Card */}
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4">
                <DoorOpen className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                {user.role === 'teacher' ? 'Mở / Tham gia phòng học' : 'Vào lớp học của bạn'}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Nhập mã phòng do giáo viên cung cấp hoặc tạo mã phòng riêng cho buổi dạy.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    Mã phòng học
                  </label>
                  <input
                    type="text"
                    value={customRoomId}
                    onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
                    placeholder="VD: PHONG-101"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-mono text-white tracking-wider focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    Tham gia với tên: <strong className="text-white">{user.name}</strong> ({user.role === 'teacher' ? 'Giảng viên' : 'Học viên'})
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => joinRoom(customRoomId || 'PHONG-101')}
              className="mt-6 w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all group"
            >
              <span>{user.role === 'teacher' ? 'Bắt đầu lớp học' : 'Vào phòng ngay'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Preset Active Rooms */}
          <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Lớp học mẫu đang mở</h2>
                <p className="text-xs text-slate-400">Chọn phòng để thử nghiệm ngay lập tức</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                3 phòng trực tiếp
              </span>
            </div>

            <div className="space-y-3">
              {presetRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs font-semibold">
                        {room.id}
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {room.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Giảng viên: <strong className="text-slate-300">{room.teacher}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {room.count} học viên đăng ký
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => joinRoom(room.id)}
                    className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                  >
                    <span>Vào lớp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick feature callouts */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <PenTool className="w-4 h-4 text-amber-400" />
                <span>Bảng vẽ thời gian thực</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Monitor className="w-4 h-4 text-sky-400" />
                <span>Chia sẻ màn hình HD</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Tự động điểm danh</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // 2. Active Classroom Room View
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-950 overflow-hidden">
      {/* Upper Main Area: Stage + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Stage (Whiteboard or Video Grid) */}
        <div className="flex-1 p-3 overflow-hidden flex flex-col">
          {viewMode === 'whiteboard' ? (
            <Whiteboard
              roomId={roomId}
              user={user}
              initialHistory={whiteboardHistory}
            />
          ) : (
            <VideoGrid
              roomId={roomId}
              user={user}
              participants={participants}
              isAudioOn={isAudioOn}
              isVideoOn={isVideoOn}
              isScreenSharing={isScreenSharing}
              localStream={localStream}
              screenStream={screenStream}
              raisedHands={raisedHands}
            />
          )}
        </div>

        {/* Tabbed Sidebar: Chat & Participants */}
        <Sidebar
          roomId={roomId}
          user={user}
          participants={participants}
          raisedHands={raisedHands}
        />

      </div>

      {/* Bottom Control Bar */}
      <ControlBar
        roomId={roomId}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isAudioOn={isAudioOn}
        toggleAudio={toggleAudio}
        isVideoOn={isVideoOn}
        toggleVideo={toggleVideo}
        isScreenSharing={isScreenSharing}
        toggleScreenShare={toggleScreenShare}
        isHandRaised={isHandRaised}
        toggleHand={toggleHand}
        onLeaveRoom={leaveRoom}
      />
    </div>
  );
}
