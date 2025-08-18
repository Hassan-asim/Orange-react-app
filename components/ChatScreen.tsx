import React, { useState, useRef, useEffect, useCallback } from 'react';
import { modularDb } from '../services/firebase';
import { User, Chat, Message } from '../types';
import { collection, addDoc, doc, updateDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import MessageBubble from './MessageBubble';
import Icon from './Icon';
import OrangeIcon from './OrangeIcon';
import { LANGUAGES } from '../constants';
import { translateText } from '../services/geminiService';
import EmojiPicker from 'emoji-picker-react';
import { listenForIncomingCall, startCall, answerCall, onCallStatusChange, endCall, cancelCall, logMissedCall, logDeclinedCall, cleanupExistingCall } from '../services/webrtcService';

interface ChatScreenProps {
  currentUser: User;
  chat: Chat;
  onBack: () => void;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const ChatScreen: React.FC<ChatScreenProps> = ({ currentUser, chat, onBack }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'active'>('idle');
  const callCleanupRef = useRef<null | (() => Promise<void>)>(null);
  const callStopRef = useRef<null | (() => Promise<void>)>(null);
  const [isIncoming, setIsIncoming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState<string>('00:00');
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');
  const [isConnecting, setIsConnecting] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<{audio: boolean, video: boolean}>({audio: false, video: false});
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const otherUser = chat.participantDetails.find(p => p.uid !== currentUser.uid);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(scrollToBottom, [messages]);
  
  // Listen for new messages
  useEffect(() => {
    if (!chat) return;
    const messagesCollectionRef = collection(modularDb, 'chats', chat.id, 'messages');
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
    });
    
    return () => unsubscribe();
  }, [chat]);

  // Create ringtone audio element
  useEffect(() => {
    ringtoneRef.current = new Audio('data:audio/wav;base64,UklGRvIBAABXQVZFZm10IBAAAAABAAEALQAAAC0AAAEEAAEAZGF0YU4BAAAnLCgqKCgpKykpKCkpKCgqKygpKCgpKSgpKCopKClWVVNJRE9JUVZSUVRQUVVQTFBTVVVTUVNQUVZSU01OTFBTUURRSE5JTlFOUE5QUU5PUFRYU1dQVFJQUlVRVFBUV1VdWVdXWFleWFVaXFxVV1lTWlpdW1pYWldXWVlYWl1YW1tbV1taVFldV1laW1pSW1pWVlNVU1NXVlNVVlhWU1ZWUlVUVE9SU1FTU1VVTlRQUFNVTlRTT1JRUFFVU1JRUlFSUU9OTk9QTU5OT05PTU5QTU1NTEtLS0xMTUtKTExLSktKSklKS0tJSEhJSEhISEdIR0hHRkZHRkZFRERERERDQkNDQ0NCQkJCQUFAQUBAQD8/Pz8+Pj4+PT09PT09Oz08Oz08PTw7Pjs7OjuwIR');
    ringtoneRef.current.loop = true;
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, []);

  // Play/stop ringtone based on call status
  useEffect(() => {
    if (callStatus === 'ringing' && isIncoming && ringtoneRef.current) {
      ringtoneRef.current.play().catch(() => {});
    } else if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, [callStatus, isIncoming]);

  // Listen for incoming WebRTC calls
  useEffect(() => {
    // Clean up any old call documents when opening a chat
    cleanupExistingCall(chat.id);
    
    const unsub1 = listenForIncomingCall(chat.id, currentUser.uid, ({ callType: incomingCallType }) => {
      setIsIncoming(true);
      setCallStatus('ringing');
      setCallType(incomingCallType);
      
      // Request notification permission if not already granted
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(`Incoming ${incomingCallType} call from ${otherUser?.name || 'Unknown'}`, {
          icon: '/icon-192x192.png',
          tag: 'incoming-call'
        });
      }
    }, () => {
      // Call cancelled callback - only for incoming calls
      if (isIncoming) {
        setCallStatus('idle');
        setIsIncoming(false);
        setIsConnecting(false);
        setConnectionQuality('unknown');
        setCallStartedAt(null);
        setIsMuted(false);
        
        // Stop ringtone
        if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        }
      }
    });
    
    return () => {
      unsub1 && unsub1();
    };
  }, [chat.id, currentUser.uid]);

  // Don't automatically check permissions on mount - only when user clicks call

  if (!otherUser) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <p className="text-gray-700 dark:text-gray-300">Could not load chat participant.</p>
              <button onClick={onBack} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md">Back to Chats</button>
          </div>
      )
  }

  const handleSend = async (text: string, type: 'text' | 'voice') => {
    const trimmedMessage = text.trim();
    if (!trimmedMessage) return;

    setIsSending(true);
    
    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      senderUid: currentUser.uid,
      text: trimmedMessage,
      originalText: trimmedMessage,
      isTranslated: false,
      type
    };
    
    try {
        const messagesCollectionRef = collection(modularDb, 'chats', chat.id, 'messages');
        const chatRef = doc(modularDb, 'chats', chat.id);

        await addDoc(messagesCollectionRef, userMessage);
        
        await updateDoc(chatRef, {
            lastMessage: {
                text: trimmedMessage, // Show original in chat list preview
                timestamp: serverTimestamp()
            }
        });
    } catch (error) {
        // Silent error handling
    } finally {
        setNewMessage('');
        setIsSending(false);
    }
  };
  
  const handleSendText = () => {
    const text = newMessage.trim();
    if (text === '/call') {
      void handleStartCall('audio');
      setNewMessage('');
      return;
    }
    if (text === '/videocall') {
      void handleStartCall('video');
      setNewMessage('');
      return;
    }
    if (text === '/answer') {
      void handleAnswerCall();
      setNewMessage('');
      return;
    }
    if (text === '/hangup') {
      void handleHangup();
      setNewMessage('');
      return;
    }
    handleSend(newMessage, 'text');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendText();
  };

  const handleEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsSending(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        const imageMessage: Omit<Message, 'id' | 'timestamp'> & { timestamp: any } = {
          senderUid: currentUser.uid,
          text: '', // Empty text for image messages
          imageUrl: base64String,
          timestamp: serverTimestamp(),
          isTranslated: false,
          type: 'image',
        };

        try {
          const messagesCollectionRef = collection(modularDb, 'chats', chat.id, 'messages');
          const chatRef = doc(modularDb, 'chats', chat.id);

          await addDoc(messagesCollectionRef, imageMessage);
          
          await updateDoc(chatRef, {
            lastMessage: {
              text: '📷 Image', // Show image indicator in chat list preview
              timestamp: serverTimestamp()
            }
          });
        } catch (error) {
          alert('Failed to send image');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Failed to process image');
    } finally {
      setIsSending(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // --- Voice Recording Handlers ---
  const handleStartRecording = () => {
    if (!recognition || isRecording) return;
    setIsRecording(true);
    recognition.lang = currentUser.language;
    recognition.start();
  };

  const handleStopRecording = () => {
    if (!recognition || !isRecording) return;
    recognition.stop();
    setIsRecording(false);
  };
  
  useEffect(() => {
    if (!recognition) return;
    recognition.onresult = (event: any) => handleSend(event.results[0][0].transcript, 'voice');
    recognition.onerror = (event: any) => { setIsRecording(false); };
    recognition.onend = () => setIsRecording(false);
    return () => { if (recognition) recognition.abort(); }
  }, [currentUser.language, otherUser?.language, chat.id]);

  // --- WebRTC Call Handlers ---
  const checkAndRequestPermissions = async (callType: 'audio' | 'video'): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        return { 
          success: false, 
          error: 'WebRTC requires HTTPS. Please access the site using https:// or localhost.' 
        };
      }
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { 
          success: false, 
          error: 'Your browser does not support media access. Please use a modern browser like Chrome, Firefox, or Safari.' 
        };
      }
      
      // Only request microphone permission when call icon is clicked
      const constraints = { audio: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Clean up immediately
      stream.getTracks().forEach(track => {
        track.stop();
      });
      
      // Update permission status after successful access
      setPermissionStatus(prev => ({
        audio: true,
        video: prev.video // Don't change video permission status
      }));
      
      return { success: true };
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Permission denied. Please click "Allow" when prompted for microphone access.';
            break;
          case 'NotFoundError':
            errorMessage = 'No microphone found. Please check your device connections.';
            break;
          case 'NotReadableError':
            errorMessage = 'Microphone is being used by another application. Please close other apps using your microphone.';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Your device does not support the required microphone settings.';
            break;
          case 'SecurityError':
            errorMessage = 'Security error. Please make sure you are using HTTPS and try again.';
            break;
          default:
            errorMessage = `Error accessing microphone: ${error.message}`;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const attachLocal = (stream: MediaStream) => {
    if (callType === 'video' && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true; // avoid echo
      localVideoRef.current.play().catch(() => {});
    } else if (localAudioRef.current) {
      localAudioRef.current.srcObject = stream;
      localAudioRef.current.muted = true; // avoid echo
      localAudioRef.current.play().catch(() => {});
    }
  };

  const attachRemote = (stream: MediaStream) => {
    if (callType === 'video' && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(() => {});
    } else if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.play().catch(() => {});
    }
  };

  const monitorConnectionQuality = (pc: RTCPeerConnection) => {
    const statsInterval = setInterval(async () => {
      try {
        const stats = await pc.getStats();
        let quality: 'excellent' | 'good' | 'poor' | 'unknown' = 'unknown';
        
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
            const packetsLost = report.packetsLost || 0;
            const packetsReceived = report.packetsReceived || 0;
            const lossRate = packetsReceived > 0 ? packetsLost / (packetsLost + packetsReceived) : 0;
            
            if (lossRate < 0.02) quality = 'excellent';
            else if (lossRate < 0.05) quality = 'good';
            else quality = 'poor';
          }
        });
        
        setConnectionQuality(quality);
      } catch (error) {
        // Silent error handling
      }
    }, 2000);
    
    return () => clearInterval(statsInterval);
  };

  const handleStartCall = async (requestedCallType: 'audio' | 'video') => {
    if (!currentUser || !otherUser) {
      alert('Missing user information. Please refresh the page and try again.');
      return;
    }
    
    // Immediately show popup with connecting status
    setCallType(requestedCallType);
    setIsConnecting(true);
    setCallStatus('ringing');
    
    try {
      const permissionResult = await checkAndRequestPermissions(requestedCallType);
      if (!permissionResult.success) {
        alert(permissionResult.error || 'Permission denied');
        setIsConnecting(false);
        setCallStatus('idle');
        await stopAllMediaTracks();
        return;
      }
      
      const result = await startCall(chat.id, currentUser.uid, otherUser.uid, (remoteStream) => {
        attachRemote(remoteStream);
        setCallStatus('active');
        setCallStartedAt(Date.now());
        setIsConnecting(false);
        setIsIncoming(false);
      }, requestedCallType);
      
      // Attach local stream
      attachLocal(result.localStream);
      callStopRef.current = result.stop;
      callCleanupRef.current = result.cleanup;
      setIsConnecting(false);
      
      // Monitor connection quality
      const stopMonitoring = monitorConnectionQuality(result.peerConnection);
      const originalCleanup = result.cleanup;
      result.cleanup = async () => {
        stopMonitoring();
        await originalCleanup();
      };
    } catch (e) {
      setIsConnecting(false);
      setCallStatus('idle');
      await stopAllMediaTracks();
      
      if (e instanceof Error) {
        if (e.name === 'NotAllowedError') {
          alert(`Permission denied for microphone access. Please allow microphone access and try again.`);
        } else if (e.name === 'NotFoundError') {
          alert(`No microphone found. Please check your device settings.`);
        } else if (e.name === 'NotReadableError') {
          alert(`Microphone is being used by another application. Please close other apps and try again.`);
        } else {
          alert(`Failed to start ${requestedCallType} call: ${e.message}`);
        }
      } else {
        alert(`Failed to start ${requestedCallType} call. Please try again.`);
      }
    }
  };

  const handleAnswerCall = async () => {
    const permissionResult = await checkAndRequestPermissions('audio');
    if (!permissionResult.success) {
      alert(permissionResult.error || 'Permission denied');
      return;
    }
    
    setIsConnecting(true);
    try {
      const result = await answerCall(chat.id, currentUser.uid, (remoteStream) => {
        attachRemote(remoteStream);
        setCallStatus('active');
        setCallStartedAt(Date.now());
        setIsConnecting(false);
        setIsIncoming(false);
      });
      
      attachLocal(result.localStream);
      callStopRef.current = result.stop;
      callCleanupRef.current = result.cleanup;
      
      const stopMonitoring = monitorConnectionQuality(result.peerConnection);
      const originalCleanup = result.cleanup;
      result.cleanup = async () => {
        stopMonitoring();
        await originalCleanup();
      };
    } catch (e) {
      setIsConnecting(false);
      setCallStatus('idle');
      await stopAllMediaTracks();
      
      if (e instanceof Error) {
        if (e.name === 'NotAllowedError') {
          alert(`Permission denied for microphone access. Please allow microphone access and try again.`);
        } else if (e.name === 'NotFoundError') {
          alert(`No microphone found. Please check your device settings.`);
        } else if (e.name === 'NotReadableError') {
          alert(`Microphone is being used by another application. Please close other apps and try again.`);
        } else if (e.name === 'OverconstrainedError') {
          alert(`Microphone doesn't meet the required constraints. Try using a different device.`);
        } else {
          alert(`Failed to answer call: ${e.message}`);
        }
      } else {
        alert('Failed to answer call. Please try again.');
      }
    }
  };

  const handleCancelCall = async () => {
    try {
      await cancelCall(chat.id);
      
      if (callStopRef.current) await callStopRef.current();
      if (callCleanupRef.current) await callCleanupRef.current();
      
      callStopRef.current = null;
      callCleanupRef.current = null;
      setCallStatus('idle');
      setIsIncoming(false);
      setIsConnecting(false);
      setConnectionQuality('unknown');
      setCallStartedAt(null);
      setIsMuted(false);
      
      await stopAllMediaTracks();
      
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const handleHangup = async (isDeclined: boolean = false) => {
    try {
      if (callStopRef.current) await callStopRef.current();
    } finally {
      // Log call history if this is a declined incoming call
      if (isDeclined && isIncoming && otherUser) {
        await logDeclinedCall(chat.id, otherUser.uid, currentUser.uid, callType);
      }
      
      if (callCleanupRef.current) await callCleanupRef.current();
      callStopRef.current = null;
      callCleanupRef.current = null;
      setCallStatus('idle');
      setIsIncoming(false);
      setIsConnecting(false);
      setConnectionQuality('unknown');
      setCallStartedAt(null);
      setIsMuted(false);
      
      // Stop all media tracks
      await stopAllMediaTracks();
      
      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
      
      await endCall(chat.id);
    }
  };

  const toggleMute = () => {
    const audioStream = localAudioRef.current?.srcObject as MediaStream | null;
    const videoStream = localVideoRef.current?.srcObject as MediaStream | null;
    const stream = callType === 'video' ? videoStream : audioStream;
    if (!stream) return;
    const enabled = stream.getAudioTracks().every(t => t.enabled);
    stream.getAudioTracks().forEach(t => (t.enabled = !enabled));
    setIsMuted(enabled);
  };

  const toggleVideo = () => {
    if (callType !== 'video') return;
    const stream = localVideoRef.current?.srcObject as MediaStream | null;
    if (!stream) return;
    const enabled = stream.getVideoTracks().every(t => t.enabled);
    stream.getVideoTracks().forEach(t => (t.enabled = !enabled));
    setIsVideoEnabled(enabled);
  };

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

  const stopAllMediaTracks = async () => {
    if (localAudioRef.current && localAudioRef.current.srcObject) {
      const stream = localAudioRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      localAudioRef.current.srcObject = null;
    }
    
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
      const stream = remoteAudioRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      remoteAudioRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
  };

  // Update call duration every second when active
  useEffect(() => {
    if (callStatus !== 'active' || !callStartedAt) {
      setCallDuration('00:00');
      return;
    }
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartedAt) / 1000);
      const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const ss = String(elapsed % 60).padStart(2, '0');
      setCallDuration(`${mm}:${ss}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [callStatus, callStartedAt]);

  useEffect(() => {
    return () => { 
      void handleHangup(); 
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      <header className="flex items-center justify-between p-3 bg-white dark:bg-charcoal border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
          <Icon name="back" className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center">
            <Avatar user={otherUser} className="w-10 h-10" />
            <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{otherUser.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Speaks {LANGUAGES.find(l => l.code === otherUser.language)?.name}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          {callStatus === 'idle' && (
            <>
              <button
                onClick={() => handleStartCall('audio')}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 ${!permissionStatus.audio ? 'opacity-60' : ''}`}
                aria-label="Start audio call"
                title={permissionStatus.audio ? "Start audio call" : "Start audio call (microphone permission needed)"}
              >
                <Icon name="phone" className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => handleStartCall('video')}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 ${!permissionStatus.video || !permissionStatus.audio ? 'opacity-60' : ''}`}
                aria-label="Start video call"
                title={permissionStatus.video && permissionStatus.audio ? "Start video call" : "Start video call (camera/microphone permission needed)"}
              >
                <Icon name="video" className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>

            </>
          )}
          {callStatus === 'ringing' && isIncoming && (
            <div className="flex items-center gap-2">
              <button onClick={handleAnswerCall} className="px-3 py-1 bg-green-500 text-white rounded-full text-xs">Answer</button>
              <button onClick={() => handleHangup(true)} className="px-3 py-1 bg-red-500 text-white rounded-full text-xs">Decline</button>
            </div>
          )}
          {callStatus === 'ringing' && !isIncoming && (
            <div className="flex items-center gap-2">
              <button onClick={handleCancelCall} className="px-3 py-1 bg-red-500 text-white rounded-full text-xs">Cancel</button>
            </div>
          )}
          {callStatus === 'active' && (
            <button onClick={() => handleHangup()} className="px-3 py-1 bg-red-500 text-white rounded-full text-xs">Hang up</button>
          )}
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
            <MessageBubble 
                key={msg.id} 
                message={msg} 
                isSender={msg.senderUid === currentUser.uid}
                recipientLanguage={otherUser.language}
                currentUserUid={currentUser.uid}
            />
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-3 bg-white dark:bg-charcoal border-t border-gray-200 dark:border-gray-700 relative">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? "Recording..." : callStatus === 'ringing' ? "Incoming call. Type /answer or /hangup" : callStatus === 'active' ? "Call active. Type /hangup" : "Type a message..."}
            className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 dark:text-white"
            disabled={isSending || isRecording}
          />
          <div className="ml-3 flex items-center space-x-2">
             {/* Image Button */}
             <button 
                onClick={handleImageSelect}
                disabled={isSending || isRecording}
                className="p-3 bg-blue-500 dark:bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-transform transform active:scale-95"
                aria-label="Send image">
                <Icon name="image" className="w-6 h-6"/>
             </button>
             
             {/* Emoji Button */}
             <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={isSending || isRecording}
                className="p-3 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-transform transform active:scale-95"
                aria-label="Add emoji">
                <span className="text-xl">😊</span>
             </button>
             
             {newMessage.trim() === '' && !isRecording && recognition ? (
                 <button onMouseDown={handleStartRecording} onMouseUp={handleStopRecording} onTouchStart={handleStartRecording} onTouchEnd={handleStopRecording} disabled={isSending}
                    className="p-3 bg-orange-500 text-white rounded-full shadow-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75 transition-transform transform active:scale-95"
                    aria-label="Record voice message">
                    <Icon name="microphone" className="w-6 h-6"/>
                 </button>
             ) : (
                <button onClick={handleSendText} disabled={isSending || !newMessage.trim()}
                    className="p-3 bg-orange-500 text-white rounded-full shadow-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75 transition-transform transform active:scale-95"
                    aria-label="Send message">
                    <Icon name="send" className="w-6 h-6"/>
                </button>
             )}
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-16 right-3 z-50">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              autoFocusSearch={false}
            />
          </div>
        )}
        
        { (isSending || isRecording) && <p className="text-xs text-center text-gray-500 mt-2">{isRecording ? 'Recording...' : 'Sending...'}</p> }
        {!recognition && <p className="text-xs text-center text-red-500 mt-2">Voice recognition is not supported by your browser.</p>}
        {/* Hidden audio elements for call playback */}
        <audio ref={localAudioRef} className="hidden" />
        <audio ref={remoteAudioRef} className="hidden" />
        {/* Hidden video elements for non-modal video display (if needed) */}
        {callType !== 'video' && (
          <>
            <video ref={localVideoRef} className="hidden" />
            <video ref={remoteVideoRef} className="hidden" />
          </>
        )}

        {/* Call Modal */}
        {(callStatus === 'ringing' || callStatus === 'active' || isConnecting) && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 modal-backdrop modal-overlay"
            onClick={(e) => {
              // Close modal when clicking backdrop (only for non-ringing states)
              if (e.target === e.currentTarget && callStatus !== 'ringing') {
                handleHangup();
              }
            }}
          >
            <div className="bg-white dark:bg-charcoal rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden relative modal-content">
              {/* Close button for non-ringing states */}
              {(callStatus === 'active' || isConnecting) && (
                <button
                  onClick={() => handleHangup()}
                  className="absolute top-3 right-3 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-10"
                  aria-label="Close call modal"
                >
                  <Icon name="close" className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              )}
              
              <div className="flex flex-col items-center p-4 sm:p-6 text-center max-h-full overflow-y-auto">
                <div className="relative">
                  <Avatar user={otherUser} className="w-16 h-16 sm:w-20 sm:h-20" />
                  {callStatus === 'ringing' && (
                    <div className="absolute -inset-1 rounded-full border-2 border-orange-500 animate-pulse"></div>
                  )}
                </div>
                <h3 className="mt-3 text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{otherUser.name}</h3>
                
                {isConnecting && (
                  <p className="text-sm text-blue-500 dark:text-blue-400 animate-pulse">
                    Connecting...
                  </p>
                )}
                
                {!isConnecting && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {callStatus === 'ringing' 
                      ? (isIncoming ? `Incoming ${callType} call...` : `${callType} calling...`) 
                      : `${callType} call · ${callDuration}`}
                  </p>
                )}
                
                {callStatus === 'active' && connectionQuality !== 'unknown' && (
                  <div className={`flex items-center mt-2 text-xs ${getConnectionQualityColor()}`}>
                    <span className="mr-1">{getConnectionQualityIcon()}</span>
                    <span className="capitalize">{connectionQuality} connection</span>
                  </div>
                )}
              </div>

              {callStatus === 'ringing' && isIncoming && !isConnecting && (
                <div className="mt-6 flex justify-center gap-4">
                  <button 
                    onClick={handleAnswerCall} 
                    className="flex items-center justify-center w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors shadow-lg"
                    aria-label="Answer call"
                  >
                    <Icon name="phone" className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => handleHangup(true)} 
                    className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                    aria-label="Decline call"
                  >
                    <Icon name="phone" className="w-6 h-6 rotate-[135deg]" />
                  </button>
                </div>
              )}

                             {callStatus === 'ringing' && !isIncoming && !isConnecting && (
                 <div className="mt-6 flex justify-center">
                   <button 
                     onClick={() => handleCancelCall()} 
                     className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                     aria-label="Cancel call"
                   >
                     <Icon name="phone" className="w-6 h-6 rotate-[135deg]" />
                   </button>
                 </div>
               )}

              {callStatus === 'active' && !isConnecting && (
                <>
                                                          {callType === 'video' && (
                       <div className="mt-4 relative w-full">
                         {/* Remote Video */}
                         <div className="relative w-full max-w-64 mx-auto h-40 sm:h-48 bg-gray-900 rounded-lg overflow-hidden">
                           <video
                             ref={remoteVideoRef}
                             className="w-full h-full object-cover"
                             autoPlay
                             playsInline
                           />
                           {/* Local Video (Picture in Picture) */}
                           <div className="absolute top-2 right-2 w-12 h-9 sm:w-16 sm:h-12 bg-gray-800 rounded overflow-hidden border-2 border-white shadow-lg">
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
                                     <div className="mt-6 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                     <button 
                       onClick={toggleMute} 
                       className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-colors shadow-lg ${
                         isMuted 
                           ? 'bg-red-500 hover:bg-red-600 text-white' 
                           : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
                       }`}
                       aria-label={isMuted ? 'Unmute' : 'Mute'}
                     >
                       <Icon name={isMuted ? 'microphone-off' : 'microphone'} className="w-4 h-4 sm:w-5 sm:h-5" />
                     </button>
                     {callType === 'video' && (
                       <button 
                         onClick={toggleVideo} 
                         className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-colors shadow-lg ${
                           !isVideoEnabled 
                             ? 'bg-red-500 hover:bg-red-600 text-white' 
                             : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
                         }`}
                         aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                       >
                         <Icon name={isVideoEnabled ? 'video' : 'video-off'} className="w-4 h-4 sm:w-5 sm:h-5" />
                       </button>
                     )}
                     <button 
                       onClick={() => handleHangup()} 
                       className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                       aria-label="Hang up"
                     >
                       <Icon name="phone" className="w-5 h-5 sm:w-6 sm:h-6 rotate-[135deg]" />
                     </button>
                   </div>
                </>
              )}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default ChatScreen;