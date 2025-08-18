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
      console.error('Chat document does not exist:', chatId);
      return { hasAccess: false, error: 'Chat not found' };
    }

    const chatData = chatSnap.data();
    console.log('Chat document exists with data:', chatData);
    console.log('Chat participants field:', chatData.participants);
    console.log('Chat participants type:', typeof chatData.participants);
    console.log('Is participants an array:', Array.isArray(chatData.participants));
    console.log('Current user ID:', userId);
    console.log('User ID type:', typeof userId);

    if (!chatData.participants) {
      console.error('Chat participants field is missing');
      return { hasAccess: false, error: 'Participants field missing' };
    }

    if (!Array.isArray(chatData.participants)) {
      console.error('Chat participants field is not an array:', chatData.participants);
      return { hasAccess: false, error: 'Participants field is not an array' };
    }

    // Check if the user ID is in the participants array
    const isParticipant = chatData.participants.includes(userId);
    console.log('Is user participant:', isParticipant);
    console.log('Participants array contents:', chatData.participants);
    console.log('User ID in participants:', userId);

    // Also check if there might be a type mismatch
    const stringParticipants = chatData.participants.map(p => String(p));
    const stringUserId = String(userId);
    const isParticipantString = stringParticipants.includes(stringUserId);
    console.log('String comparison - Is user participant:', isParticipantString);
    console.log('String participants:', stringParticipants);
    console.log('String user ID:', stringUserId);

    return {
      hasAccess: isParticipant || isParticipantString,
      error: (isParticipant || isParticipantString) ? null : 'User is not a participant of this chat',
      chatData
    };
  } catch (error) {
    console.error('Error testing chat access:', error);
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
    // Debug logging
    console.log('Starting call with:', { chatId, callerUid, calleeUid, callType });
    console.log('Current user UID:', callerUid);
    
    // Add connection state change logging
    pc.onconnectionstatechange = () => {
      console.log('Caller connection state changed:', pc.connectionState);
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log('Caller ICE connection state:', pc.iceConnectionState);
    };

    // Test chat access first
    const accessTest = await testChatAccess(chatId, callerUid);
    if (!accessTest.hasAccess) {
      throw new Error(`Chat access denied: ${accessTest.error}`);
    }

    // Media
    const mediaConstraints = callType === 'video'
      ? { audio: true, video: true }
      : { audio: true };
    const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Store offer in Firestore
    const callRef = doc(db, 'chats', chatId, 'call', 'current');
    await setDoc(callRef, {
      offer: offer.sdp,
      callerUid,
      calleeUid,
      callType,
      status: 'ringing',
      timestamp: serverTimestamp()
    });

    // Listen for answer and ICE candidates
    const unsubscribe = onSnapshot(callRef, async (doc) => {
      if (!doc.exists()) return;
      
      const data = doc.data();
      if (data.answer && data.status === 'answered') {
        try {
          // Only set remote description if we haven't already and we're in the right state
          if (pc.remoteDescription === null && pc.signalingState === 'have-local-offer') {
            console.log('Setting remote description (answer) for caller');
            await pc.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: data.answer
            }));
            
            // Get remote stream
            pc.ontrack = (event) => {
              console.log('Caller received remote track');
              onRemoteTrack(event.streams[0]);
            };
          } else {
            console.log('Skipping remote description set - already set or wrong state:', {
              hasRemoteDesc: pc.remoteDescription !== null,
              signalingState: pc.signalingState
            });
          }
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      }
      
      // Handle incoming ICE candidates
      if (data.iceCandidate && data.iceCandidate.candidate) {
        try {
          // Only add ICE candidates if we have a remote description
          if (pc.remoteDescription) {
            const iceCandidate = new RTCIceCandidate({
              candidate: data.iceCandidate.candidate,
              sdpMLineIndex: data.iceCandidate.sdpMLineIndex,
              sdpMid: data.iceCandidate.sdpMid
            });
            await pc.addIceCandidate(iceCandidate);
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
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
    console.error('Failed to start call:', error);
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
    console.log('Answering call for chat:', chatId);
    
    // Add connection state change logging
    pc.onconnectionstatechange = () => {
      console.log('Callee connection state changed:', pc.connectionState);
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log('Callee ICE connection state:', pc.iceConnectionState);
    };

    // Get media stream
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    // Listen for offer and ICE candidates
    const callRef = doc(db, 'chats', chatId, 'call', 'current');
    const unsubscribe = onSnapshot(callRef, async (doc) => {
      if (!doc.exists()) return;
      
      const data = doc.data();
      if (data.offer && data.status === 'ringing') {
        try {
          // Only set remote description if we haven't already and we're in the right state
          if (pc.remoteDescription === null && pc.signalingState === 'stable') {
            console.log('Setting remote description (offer) for callee');
            // Set remote description (offer)
            await pc.setRemoteDescription(new RTCSessionDescription({
              type: 'offer',
              sdp: data.offer
            }));

            // Create answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Store answer in Firestore
            await setDoc(callRef, {
              answer: answer.sdp,
              status: 'answered',
              timestamp: serverTimestamp()
            }, { merge: true });

            // Get remote stream
            pc.ontrack = (event) => {
              console.log('Callee received remote track');
              onRemoteTrack(event.streams[0]);
            };
          } else {
            console.log('Skipping remote description set - already set or wrong state:', {
              hasRemoteDesc: pc.remoteDescription !== null,
              signalingState: pc.signalingState
            });
          }
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      }
      
      // Handle incoming ICE candidates
      if (data.iceCandidate && data.iceCandidate.candidate) {
        try {
          // Only add ICE candidates if we have a remote description
          if (pc.remoteDescription) {
            const iceCandidate = new RTCIceCandidate({
              candidate: data.iceCandidate.candidate,
              sdpMLineIndex: data.iceCandidate.sdpMLineIndex,
              sdpMid: data.iceCandidate.sdpMid
            });
            await pc.addIceCandidate(iceCandidate);
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
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
    console.error('Failed to answer call:', error);
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
    console.log('Call ended and cleaned up');
  } catch (error) {
    console.error('Error ending call:', error);
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
  
  return onSnapshot(callRef, (doc) => {
    if (!doc.exists()) return;
    
    const data = doc.data();
    if (data.calleeUid === userId && data.status === 'ringing') {
      onIncomingCall({ callType: data.callType });
    }
    
    // Handle call cancellation
    if (data.status === 'cancelled' && onCallCancelled) {
      console.log('Incoming call cancelled');
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
  
  return onSnapshot(callRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      onStatusChange(data);
      
      // If call status is 'ended', trigger cleanup callback
      if (data.status === 'ended' && onCallEnded) {
        console.log('Call ended detected, triggering cleanup');
        onCallEnded();
      }
    } else {
      onStatusChange(null);
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
    console.log('Missed call logged');
  } catch (error) {
    console.error('Error logging missed call:', error);
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
    console.log('Declined call logged');
  } catch (error) {
    console.error('Error logging declined call:', error);
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
    console.log('Call cancelled and cleaned up');
  } catch (error) {
    console.error('Error cancelling call:', error);
  }
};


