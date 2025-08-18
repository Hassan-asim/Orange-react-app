import { modularDb } from './firebase';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, getDoc, addDoc } from 'firebase/firestore';

// ICE servers for WebRTC
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export interface StartCallResult {
  localStream: MediaStream;
  peerConnection: RTCPeerConnection;
  stop: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export interface AnswerCallResult {
  localStream: MediaStream;
  peerConnection: RTCPeerConnection;
  stop: () => Promise<void>;
  cleanup: () => Promise<void>;
}

// Test chat access before starting call
export const testChatAccess = async (chatId: string, userId: string) => {
  try {
    const chatRef = doc(modularDb, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      return { hasAccess: false, error: 'Chat not found' };
    }

    const chatData = chatSnap.data();

    if (!chatData.participants) {
      return { hasAccess: false, error: 'Participants field missing' };
    }

    if (!Array.isArray(chatData.participants)) {
      return { hasAccess: false, error: 'Participants field is not an array' };
    }

    // Check if the user ID is in the participants array
    const isParticipant = chatData.participants.includes(userId);

    // Also check if there might be a type mismatch
    const stringParticipants = chatData.participants.map(p => String(p));
    const stringUserId = String(userId);
    const isParticipantString = stringParticipants.includes(stringUserId);

    return {
      hasAccess: isParticipant || isParticipantString,
      error: (isParticipant || isParticipantString) ? null : 'User is not a participant of this chat',
      chatData
    };
  } catch (error) {
    return { hasAccess: false, error: error.message };
  }
};

// Start a call
export const startCall = async (
  chatId: string,
  callerUid: string,
  calleeUid: string,
  onRemoteTrack: (remoteStream: MediaStream) => void,
  callType: 'audio' | 'video' = 'audio'
): Promise<StartCallResult> => {
  const db = modularDb;
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  try {
    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      // Connection state monitoring
    };
    
    pc.oniceconnectionstatechange = () => {
      // ICE connection state monitoring
    };

    // Test chat access first
    const accessTest = await testChatAccess(chatId, callerUid);
    if (!accessTest.hasAccess) {
      throw new Error(`Chat access denied: ${accessTest.error}`);
    }

    // Media - only request audio initially, video will be requested later if needed
    const mediaConstraints = { audio: true };
    
    const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    // Set up track handler immediately
    pc.ontrack = (event) => {
      onRemoteTrack(event.streams[0]);
    };

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Store offer in Firestore
    const callRef = doc(db, 'chats', chatId, 'call', 'current');
    const callData = {
      offer: offer.sdp,
      callerUid,
      calleeUid,
      callType,
      status: 'ringing',
      timestamp: serverTimestamp()
    };
    
    await setDoc(callRef, callData);

    // Listen for answer and ICE candidates
    const unsubscribe = onSnapshot(callRef, async (doc) => {
      if (!doc.exists()) return;
      
      const data = doc.data();
      if (data.answer && data.status === 'answered') {
        try {
          if (pc.remoteDescription === null && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: data.answer
            }));
          }
        } catch (error) {
          // Silent error handling
        }
      }
      
      if (data.iceCandidate && data.iceCandidate.candidate) {
        try {
          if (pc.remoteDescription) {
            const iceCandidate = new RTCIceCandidate({
              candidate: data.iceCandidate.candidate,
              sdpMLineIndex: data.iceCandidate.sdpMLineIndex,
              sdpMid: data.iceCandidate.sdpMid
            });
            await pc.addIceCandidate(iceCandidate);
          }
        } catch (error) {
          // Silent error handling
        }
      }
      
      // Handle call cancellation
      if (data.status === 'cancelled') {
        await cleanup();
      }
    });

    // ICE candidate handling
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        // Convert RTCIceCandidate to plain object for Firestore
        const iceCandidateData = {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid
        };
        
        await setDoc(callRef, {
          iceCandidate: iceCandidateData,
          timestamp: serverTimestamp()
        }, { merge: true });
      }
    };

    // Cleanup function
    const cleanup = async () => {
      unsubscribe();
      await deleteDoc(callRef);
      pc.close();
    };

    // Stop function
    const stop = async () => {
      await cleanup();
    };

    return {
      localStream,
      peerConnection: pc,
      stop,
      cleanup
    };

  } catch (error) {
    pc.close();
    throw error;
  }
};

// Answer an incoming call
export const answerCall = async (
  chatId: string,
  calleeUid: string,
  onRemoteTrack: (remoteTrack: MediaStream) => void
): Promise<AnswerCallResult> => {
  const db = modularDb;
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  try {
    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      // Connection state monitoring
    };
    
    pc.oniceconnectionstatechange = () => {
      // ICE connection state monitoring
    };

    // Get media stream - only request audio initially, video will be requested later if needed
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    // Set up track handler immediately
    pc.ontrack = (event) => {
      onRemoteTrack(event.streams[0]);
    };

    // Listen for offer and ICE candidates
    const callRef = doc(db, 'chats', chatId, 'call', 'current');
    const unsubscribe = onSnapshot(callRef, async (doc) => {
      if (!doc.exists()) return;
      
      const data = doc.data();
      if (data.offer && data.status === 'ringing') {
        try {
          if (pc.remoteDescription === null && pc.signalingState === 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription({
              type: 'offer',
              sdp: data.offer
            }));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await setDoc(callRef, {
              answer: answer.sdp,
              status: 'answered',
              timestamp: serverTimestamp()
            }, { merge: true });
          }
        } catch (error) {
          // Silent error handling
        }
      }
      
      if (data.iceCandidate && data.iceCandidate.candidate) {
        try {
          if (pc.remoteDescription) {
            const iceCandidate = new RTCIceCandidate({
              candidate: data.iceCandidate.candidate,
              sdpMLineIndex: data.iceCandidate.sdpMLineIndex,
              sdpMid: data.iceCandidate.sdpMid
            });
            await pc.addIceCandidate(iceCandidate);
          }
        } catch (error) {
          // Silent error handling
        }
      }
      
      // Handle call cancellation
      if (data.status === 'cancelled') {
        await cleanup();
      }
    });

    // ICE candidate handling
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        // Convert RTCIceCandidate to plain object for Firestore
        const iceCandidateData = {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid
        };
        
        await setDoc(callRef, {
          iceCandidate: iceCandidateData,
          timestamp: serverTimestamp()
        }, { merge: true });
      }
    };

    // Cleanup function
    const cleanup = async () => {
      unsubscribe();
      await deleteDoc(callRef);
      pc.close();
    };

    // Stop function
    const stop = async () => {
      await cleanup();
    };

    return {
      localStream,
      peerConnection: pc,
      stop,
      cleanup
    };

  } catch (error) {
    pc.close();
    throw error;
  }
};

// End a call
export const endCall = async (chatId: string): Promise<void> => {
  try {
    const callRef = doc(modularDb, 'chats', chatId, 'call', 'current');
    
    // Update the call status to 'ended' before deleting
    await setDoc(callRef, {
      status: 'ended',
      endedAt: serverTimestamp()
    }, { merge: true });
    
    // Small delay to ensure the status update is processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now delete the call document
    await deleteDoc(callRef);

  } catch (error) {
    // Silent error handling
  }
};

// Listen for incoming calls
export const listenForIncomingCall = (
  chatId: string,
  userId: string,
  onIncomingCall: (data: { callType: 'audio' | 'video' }) => void,
  onCallCancelled?: () => void
) => {
  const callRef = doc(modularDb, 'chats', chatId, 'call', 'current');
  let lastNotifiedStatus: string | null = null;
  
  return onSnapshot(callRef, (doc) => {
    if (!doc.exists()) {
      // Reset last status when document doesn't exist
      lastNotifiedStatus = null;
      return;
    }
    
    const data = doc.data();
    const currentStatus = `${data.status}-${data.calleeUid}`;
    
    // Only trigger callbacks if the status has actually changed
    if (lastNotifiedStatus === currentStatus) {
      return;
    }
    
    lastNotifiedStatus = currentStatus;
    
    if (data.calleeUid === userId && data.status === 'ringing') {
      onIncomingCall({ callType: data.callType });
    }
    
    // Handle call cancellation
    if (data.status === 'cancelled' && onCallCancelled) {
      onCallCancelled();
    }
  });
};

// Listen for call status changes
export const onCallStatusChange = (
  chatId: string,
  onStatusChange: (data: any) => void,
  onCallEnded?: () => void
) => {
  const callRef = doc(modularDb, 'chats', chatId, 'call', 'current');
  let lastStatus: string | null = null;
  let lastCallId: string | null = null;
  
  return onSnapshot(callRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const currentCallId = `${data.callerUid}-${data.calleeUid}-${data.timestamp?.seconds || Date.now()}`;
      const currentStatus = data.status;
      
      // Only trigger if this is actually a new call or status change
      if (lastCallId === currentCallId && lastStatus === currentStatus) {
        return;
      }
      
      lastCallId = currentCallId;
      lastStatus = currentStatus;
      
      onStatusChange(data);
      
      // If call status is 'ended', trigger cleanup callback
      if (data.status === 'ended' && onCallEnded) {
        onCallEnded();
      }
    } else {
      // Only call onStatusChange(null) if we previously had a status
      if (lastStatus !== null) {
        lastStatus = null;
        lastCallId = null;
        onStatusChange(null);
      }
    }
  });
};

// Log missed call
export const logMissedCall = async (
  chatId: string,
  callerUid: string,
  calleeUid: string,
  callType: 'audio' | 'video'
): Promise<void> => {
  try {
    const callHistoryRef = collection(modularDb, 'callHistory');
    await addDoc(callHistoryRef, {
      chatId,
      callerUid,
      calleeUid,
      callType,
      status: 'missed',
      timestamp: serverTimestamp()
    });

  } catch (error) {
    // Silent error handling
  }
};

// Log declined call
export const logDeclinedCall = async (
  chatId: string,
  callerUid: string,
  calleeUid: string,
  callType: 'audio' | 'video'
): Promise<void> => {
  try {
    const callHistoryRef = collection(modularDb, 'callHistory');
    await addDoc(callHistoryRef, {
      chatId,
      callerUid,
      calleeUid,
      callType,
      status: 'declined',
      timestamp: serverTimestamp()
    });

  } catch (error) {
    // Silent error handling
  }
};



// Cancel a call (for caller to cancel before it's answered)
export const cancelCall = async (chatId: string): Promise<void> => {
  try {
    const callRef = doc(modularDb, 'chats', chatId, 'call', 'current');
    
    // Update the call status to 'cancelled' before deleting
    await setDoc(callRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp()
    }, { merge: true });
    
    // Small delay to ensure the status update is processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now delete the call document
    await deleteDoc(callRef);

  } catch (error) {
    // Silent error handling
  }
};

// Clean up any existing call documents for a chat (useful when opening a chat)
export const cleanupExistingCall = async (chatId: string): Promise<void> => {
  try {
    const callRef = doc(modularDb, 'chats', chatId, 'call', 'current');
    const callDoc = await getDoc(callRef);
    
    if (callDoc.exists()) {
      const data = callDoc.data();
      // Only clean up if the call is old (more than 5 minutes)
      const now = Date.now();
      const callTime = data.timestamp?.toMillis() || 0;
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      if (callTime < fiveMinutesAgo) {
        await deleteDoc(callRef);
      }
    }
  } catch (error) {
    // Silently ignore cleanup errors
  }
};


