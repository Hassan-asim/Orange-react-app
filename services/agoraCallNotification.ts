import { modularDb } from './firebase';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

export interface IncomingCallNotification {
  id: string;
  chatId: string;
  callerUid: string;
  calleeUid: string;
  callType: 'audio' | 'video';
  timestamp: any;
  status: 'pending' | 'answered' | 'declined' | 'missed';
}

// Send an incoming call notification
export const sendIncomingCallNotification = async (
  chatId: string,
  callerUid: string,
  calleeUid: string,
  callType: 'audio' | 'video'
): Promise<void> => {
  try {
    const notificationRef = doc(modularDb, 'incoming_calls', `${chatId}_${Date.now()}`);
    const notification: Omit<IncomingCallNotification, 'id'> = {
      chatId,
      callerUid,
      calleeUid,
      callType,
      timestamp: serverTimestamp(),
      status: 'pending'
    };
    
    await setDoc(notificationRef, notification);
    console.log('Incoming call notification sent');
  } catch (error) {
    console.error('Failed to send incoming call notification:', error);
    throw error;
  }
};

// Listen for incoming call notifications for a specific user
export const listenForIncomingCalls = (
  userId: string,
  onIncomingCall: (notification: IncomingCallNotification) => void
): (() => void) => {
  // Listen to all incoming call notifications where the user is the callee
  const unsubscribe = onSnapshot(
    collection(modularDb, 'incoming_calls'),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = { id: change.doc.id, ...change.doc.data() } as IncomingCallNotification;
          if (notification.calleeUid === userId && notification.status === 'pending') {
            onIncomingCall(notification);
          }
        }
      });
    },
    (error) => {
      console.error('Error listening for incoming calls:', error);
    }
  );
  
  return unsubscribe;
};

// Update call notification status
export const updateCallNotificationStatus = async (
  notificationId: string,
  status: 'answered' | 'declined' | 'missed'
): Promise<void> => {
  try {
    const notificationRef = doc(modularDb, 'incoming_calls', notificationId);
    await updateDoc(notificationRef, { status });
    console.log('Call notification status updated to:', status);
  } catch (error) {
    console.error('Failed to update call notification status:', error);
    throw error;
  }
};

// Clean up old notifications
export const cleanupOldNotifications = async (): Promise<void> => {
  try {
    // Delete notifications older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const q = query(
      collection(modularDb, 'incoming_calls'),
      where('timestamp', '<', oneHourAgo)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(modularDb);
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('Cleaned up old call notifications');
  } catch (error) {
    console.error('Failed to cleanup old notifications:', error);
  }
};
