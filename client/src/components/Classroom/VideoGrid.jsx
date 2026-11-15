import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Hand, 
  Monitor, 
  Crown,
  User
} from 'lucide-react';

export default function VideoGrid({ 
  roomId, 
  user, 
  participants = [], 
  isAudioOn, 
  isVideoOn, 
  isScreenSharing, 
  localStream,
  screenStream,
  raisedHands = new Set() 
}) {
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);

  // Bind local webcam stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind screen share stream
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Split participants: teacher vs students
  const teacher = participants.find(p => p.role === 'teacher');
  const students = participants.filter(p => p.role === 'student');

  return (
    <div className="w-full h-full flex flex-col gap-3 p-2 bg-slate-950 rounded-2xl overflow-y-auto">
      
      {/* If screen sharing is active, show screen large on top */}
      {isScreenSharing && screenStream && (
        <div className="relative w-full h-[65%] min-h-[300px] bg-black rounded-xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl flex items-center justify-center">
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-indigo-500/40 text-xs font-medium text-indigo-300">
            <Monitor className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>Màn hình đang chia sẻ • {user.name}</span>
          </div>
        </div>
      )}

      {/* Grid of participant video tiles */}
      <div className={`grid gap-3 w-full ${isScreenSharing ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'} flex-1`}>
        
        {/* Local User Tile */}
        <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700/60 shadow-lg flex items-center justify-center group">
          {isVideoOn && localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/20">
                {user.avatar || '👤'}
              </div>
              <span className="text-xs text-slate-400 font-medium">Camera đang tắt</span>
            </div>
          )}

          {/* User badge */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/50">
            <div className="flex items-center gap-1.5 truncate">
              {user.role === 'teacher' && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
              <span className="font-semibold text-slate-200 truncate">{user.name} (Bạn)</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {raisedHands.has(user.name) && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-semibold border border-amber-500/30">
                  <Hand className="w-3 h-3" />
                  <span>Giơ tay</span>
                </div>
              )}
              {isAudioOn ? (
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
          </div>
        </div>

        {/* Remote Participants Tiles */}
        {participants.filter(p => p.socketId !== user.socketId).map((participant) => {
          const isRaised = raisedHands.has(participant.name);
          return (
            <div
              key={participant.socketId || participant.name}
              className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-lg flex items-center justify-center"
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg ${
                  participant.role === 'teacher' 
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-500/20' 
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
                }`}>
                  {participant.role === 'teacher' ? '👨‍🏫' : '🎓'}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {participant.role === 'teacher' ? 'Giảng viên' : 'Học viên'}
                </span>
              </div>

              {/* Participant info badge */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/50">
                <div className="flex items-center gap-1.5 truncate">
                  {participant.role === 'teacher' && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                  <span className="font-semibold text-slate-200 truncate">{participant.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isRaised && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-semibold border border-amber-500/30 animate-bounce">
                      <Hand className="w-3 h-3" />
                      <span>Giơ tay</span>
                    </div>
                  )}
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty placeholder if only 1 participant */}
        {participants.length <= 1 && (
          <div className="aspect-video bg-slate-900/40 rounded-xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center">
            <User className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-400">Đang đợi học viên khác tham gia phòng...</p>
            <p className="text-[11px] text-slate-500 mt-1">Mã phòng: <span className="text-indigo-400 font-semibold">{roomId}</span></p>
          </div>
        )}

      </div>

    </div>
  );
}
