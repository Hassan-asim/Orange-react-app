import React from 'react';
import { User } from '../types';
import Icon from './Icon';

interface CallPopupProps {
  otherUser: User;
  callStatus: 'idle' | 'ringing' | 'active';
  callType: 'audio' | 'video';
  isIncoming: boolean;
  isConnecting: boolean;
  callDuration: string;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  isMuted: boolean;
  isVideoEnabled: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onAnswerCall: () => void;
  onRejectCall: () => void;
  onCancelCall: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onClose: () => void;
}

const Avatar = ({ user, className }: { user: User, className?: string }) => (
  <>
    {user.avatar ? (
      <img src={user.avatar} alt={user.name || 'User'} className={`${className} rounded-full object-cover`} />
    ) : (
      <div className={`${className} rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700`}>
        <Icon name="user-profile" className="w-3/5 h-3/5 text-gray-500 dark:text-gray-400" />
      </div>
    )}
  </>
);

const CallPopup: React.FC<CallPopupProps> = ({
  otherUser,
  callStatus,
  callType,
  isIncoming,
  isConnecting,
  callDuration,
  connectionQuality,
  isMuted,
  isVideoEnabled,
  localVideoRef,
  remoteVideoRef,
  onAnswerCall,
  onRejectCall,
  onCancelCall,
  onHangup,
  onToggleMute,
  onToggleVideo,
  onClose
}) => {
  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return '●●●';
      case 'good': return '●●○';
      case 'poor': return '●○○';
      default: return '○○○';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close modal when clicking backdrop (only for active calls)
        if (e.target === e.currentTarget && callStatus === 'active') {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden relative">
        {/* Close button for active calls */}
        {callStatus === 'active' && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-10"
            aria-label="Minimize call"
          >
            <Icon name="close" className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
        
        <div className="flex flex-col items-center p-6 text-center">
          {/* User Avatar */}
          <div className="relative mb-4">
            <Avatar user={otherUser} className="w-20 h-20" />
            {callStatus === 'ringing' && (
              <div className="absolute -inset-1 rounded-full border-2 border-orange-500 animate-pulse"></div>
            )}
          </div>

          {/* User Name */}
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {otherUser.name}
          </h3>

          {/* Call Status */}
          {isConnecting && (
            <p className="text-sm text-blue-500 dark:text-blue-400 animate-pulse mb-4">
              Connecting...
            </p>
          )}
          
          {!isConnecting && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {callStatus === 'ringing' 
                ? (isIncoming ? `Incoming ${callType} call...` : `${callType} calling...`) 
                : `${callType} call · ${callDuration}`}
            </p>
          )}

          {/* Connection Quality Indicator */}
          {callStatus === 'active' && connectionQuality !== 'unknown' && (
            <div className={`flex items-center mb-4 text-xs ${getConnectionQualityColor()}`}>
              <span className="mr-1">{getConnectionQualityIcon()}</span>
              <span className="capitalize">{connectionQuality} connection</span>
            </div>
          )}

          {/* Video Display for Video Calls */}
          {callStatus === 'active' && callType === 'video' && (
            <div className="w-full mb-6">
              {/* Remote Video */}
              <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden mb-3">
                <video
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                {/* Local Video (Picture in Picture) */}
                <div className="absolute top-2 right-2 w-16 h-12 bg-gray-800 rounded overflow-hidden border-2 border-white shadow-lg">
                  <video
                    ref={localVideoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {callStatus === 'ringing' && isIncoming && !isConnecting && (
            <div className="flex justify-center gap-6">
              <button 
                onClick={onAnswerCall} 
                className="flex items-center justify-center w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors shadow-lg"
                aria-label="Answer call"
              >
                <Icon name="phone" className="w-6 h-6" />
              </button>
              <button 
                onClick={onRejectCall} 
                className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                aria-label="Decline call"
              >
                <Icon name="phone" className="w-6 h-6 rotate-[135deg]" />
              </button>
            </div>
          )}

          {callStatus === 'ringing' && !isIncoming && !isConnecting && (
            <div className="flex justify-center">
              <button 
                onClick={onCancelCall} 
                className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                aria-label="Cancel call"
              >
                <Icon name="phone" className="w-6 h-6 rotate-[135deg]" />
              </button>
            </div>
          )}

          {callStatus === 'active' && !isConnecting && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {/* Mute Button */}
              <button 
                onClick={onToggleMute} 
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors shadow-lg ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
                }`}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                <Icon name={isMuted ? 'microphone-off' : 'microphone'} className="w-5 h-5" />
              </button>

              {/* Video Toggle Button (only for video calls) */}
              {callType === 'video' && (
                <button 
                  onClick={onToggleVideo} 
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors shadow-lg ${
                    !isVideoEnabled 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
                  }`}
                  aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  <Icon name={isVideoEnabled ? 'video' : 'video-off'} className="w-5 h-5" />
                </button>
              )}

              {/* Hang Up Button */}
              <button 
                onClick={onHangup} 
                className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                aria-label="Hang up"
              >
                <Icon name="phone" className="w-6 h-6 rotate-[135deg]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallPopup;
