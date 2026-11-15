import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff, 
  PenTool, 
  LayoutGrid, 
  Hand, 
  PhoneOff,
  Copy,
  Check
} from 'lucide-react';

export default function ControlBar({
  roomId,
  viewMode, // 'whiteboard' | 'grid'
  setViewMode,
  isAudioOn,
  toggleAudio,
  isVideoOn,
  toggleVideo,
  isScreenSharing,
  toggleScreenShare,
  isHandRaised,
  toggleHand,
  onLeaveRoom
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '?room=' + roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-18 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between gap-4 select-none">
      
      {/* Room badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">Phòng: {roomId}</span>
          <button
            onClick={handleCopyLink}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            title="Sao chép liên kết phòng"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Classroom Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-2xl transition-all shadow-md ${
            isAudioOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
          }`}
          title={isAudioOn ? 'Tắt Micro' : 'Bật Micro'}
        >
          {isAudioOn ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-2xl transition-all shadow-md ${
            isVideoOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
          }`}
          title={isVideoOn ? 'Tắt Camera' : 'Bật Camera'}
        >
          {isVideoOn ? <Video className="w-5 h-5 text-sky-400" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-2xl transition-all shadow-md ${
            isScreenSharing
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ bài giảng / màn hình'}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5" />}
        </button>

        {/* View Mode Toggle: Whiteboard vs Video Grid */}
        <button
          onClick={() => setViewMode(viewMode === 'whiteboard' ? 'grid' : 'whiteboard')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-xs transition-all shadow-md ${
            viewMode === 'whiteboard'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title="Chuyển chế độ xem"
        >
          {viewMode === 'whiteboard' ? (
            <>
              <PenTool className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Bảng trắng (Đang mở)</span>
            </>
          ) : (
            <>
              <LayoutGrid className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Xem Video Lớp</span>
            </>
          )}
        </button>

        {/* Raise Hand */}
        <button
          onClick={toggleHand}
          className={`p-3 rounded-2xl transition-all shadow-md ${
            isHandRaised
              ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/40 animate-bounce'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title={isHandRaised ? 'Hạ tay' : 'Giơ tay phát biểu'}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* End / Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-600/30"
          title="Rời khỏi lớp học"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Rời phòng</span>
        </button>
      </div>

      {/* Right spacer / help */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
        <span className="text-[11px] bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
          Chế độ: <strong className="text-indigo-300">{viewMode === 'whiteboard' ? 'Bảng vẽ' : 'Video'}</strong>
        </span>
      </div>

    </div>
  );
}
