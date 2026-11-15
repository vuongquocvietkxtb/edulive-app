import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { 
  MessageSquare, 
  Users, 
  Send, 
  Crown, 
  Hand, 
  VolumeX, 
  FileSpreadsheet, 
  Clock,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ roomId, user, participants = [], raisedHands = new Set() }) {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'participants'
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      senderName: 'Hệ thống EduLive',
      senderRole: 'system',
      text: 'Chào mừng bạn đến với phòng học! Hãy bật mic khi được mời phát biểu.',
      time: 'Bây giờ'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat-message', handleMessage);

    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socket) return;

    socket.emit('chat-message', {
      roomId,
      text: inputMsg.trim()
    });

    setInputMsg('');
  };

  const handleMuteAll = () => {
    if (socket && user.role === 'teacher') {
      socket.emit('teacher-action', {
        roomId,
        action: 'mute-all'
      });
      alert('Đã gửi yêu cầu tắt mic tới toàn bộ học viên!');
    }
  };

  const handleExportAttendance = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "STT,Họ và tên,Vai trò,Thời gian tham gia\n"
      + participants.map((p, idx) => 
          `${idx + 1},"${p.name}","${p.role === 'teacher' ? 'Giảng viên' : 'Học viên'}","${new Date(p.joinedAt).toLocaleTimeString('vi-VN')}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DiemDanh_Phong_${roomId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-80 sm:w-96 h-full flex flex-col bg-slate-900 border-l border-slate-800 flex-shrink-0">
      
      {/* Tab Header */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'chat'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Trò chuyện</span>
          <span className="px-1.5 py-0.2 bg-slate-800 text-[10px] rounded-full text-slate-300">
            {messages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'participants'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Thành viên ({participants.length})</span>
        </button>
      </div>

      {/* Tab Content: Chat */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMe = msg.senderName === user.name;
              const isSys = msg.senderRole === 'system';

              if (isSys) {
                return (
                  <div key={msg.id} className="text-center my-2">
                    <span className="text-[11px] px-2.5 py-1 bg-slate-800/80 text-indigo-300 border border-slate-700/60 rounded-full inline-block">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[11px] font-semibold ${
                      msg.senderRole === 'teacher' ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {msg.senderName}
                    </span>
                    {msg.senderRole === 'teacher' && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">
                        GV
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">{msg.time}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] break-words shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Nhập tin nhắn với lớp học..."
              className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab Content: Participants & Attendance */}
      {activeTab === 'participants' && (
        <div className="flex-1 flex flex-col min-h-0 p-3">
          
          {/* Teacher control bar */}
          {user.role === 'teacher' && (
            <div className="mb-3 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Bảng điều khiển Giảng viên
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMuteAll}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Tắt mic cả lớp</span>
                </button>
                <button
                  onClick={handleExportAttendance}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Xuất điểm danh</span>
                </button>
              </div>
            </div>
          )}

          {/* Participants List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Đang có mặt ({participants.length})</span>
              <span className="text-emerald-400">Trực tuyến</span>
            </div>

            {participants.map((p) => {
              const isRaised = raisedHands.has(p.name);
              const joinTime = p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div
                  key={p.socketId || p.name}
                  className="flex items-center justify-between p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm flex-shrink-0">
                      {p.role === 'teacher' ? '👨‍🏫' : '🎓'}
                    </div>
                    <div className="truncate text-left">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {p.name}
                        </span>
                        {p.role === 'teacher' && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Vào lúc {joinTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isRaised && (
                      <span className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse" title="Đang giơ tay">
                        <Hand className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
