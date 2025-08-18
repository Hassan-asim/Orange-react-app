import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  serverTimestamp as fsServerTimestamp,
  Timestamp
} from 'firebase/firestore';
import { modularDb } from './firebase';

export interface CallHistoryEntry {
  id?: string;
  chatId: string;
  callerUid: string;
  calleeUid: string;
  callType: 'audio' | 'video';
  status: 'completed' | 'missed' | 'declined' | 'failed';
  duration?: number; // in seconds
  startTime: Timestamp;
  endTime?: Timestamp;
  createdAt: any;
}

const getDb = () => modularDb;

// Add a call to history
export const addCallToHistory = async (callEntry: Omit<CallHistoryEntry, 'id' | 'createdAt'>) => {
  const callHistoryRef = collection(getDb(), 'callHistory');
  
  const entry: Omit<CallHistoryEntry, 'id'> = {
    ...callEntry,
    createdAt: fsServerTimestamp()
  };
  
  try {
    const docRef = await addDoc(callHistoryRef, entry);
    return docRef.id;
  } catch (error) {
    console.error('Error adding call to history:', error);
    throw error;
  }
};

// Get call history for a user
export const getUserCallHistory = (
  userUid: string,
  limitCount: number = 50,
  onUpdate: (calls: CallHistoryEntry[]) => void
) => {
  const callHistoryRef = collection(getDb(), 'callHistory');
  const q = query(
    callHistoryRef,
    where('callerUid', '==', userUid),
    orderBy('startTime', 'desc'),
    limit(limitCount)
  );
  
  const q2 = query(
    callHistoryRef,
    where('calleeUid', '==', userUid),
    orderBy('startTime', 'desc'),
    limit(limitCount)
  );
  
  // Listen to both queries (calls made and calls received)
  const unsubscribe1 = onSnapshot(q, (snapshot) => {
    const calls = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CallHistoryEntry));
    onUpdate(calls);
  });
  
  const unsubscribe2 = onSnapshot(q2, (snapshot) => {
    const calls = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CallHistoryEntry));
    onUpdate(calls);
  });
  
  return () => {
    unsubscribe1();
    unsubscribe2();
  };
};

// Get call history for a specific chat
export const getChatCallHistory = (
  chatId: string,
  limitCount: number = 20,
  onUpdate: (calls: CallHistoryEntry[]) => void
) => {
  const callHistoryRef = collection(getDb(), 'callHistory');
  const q = query(
    callHistoryRef,
    where('chatId', '==', chatId),
    orderBy('startTime', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const calls = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CallHistoryEntry));
    onUpdate(calls);
  });
};

// Get missed calls count for a user
export const getMissedCallsCount = (
  userUid: string,
  onUpdate: (count: number) => void
) => {
  const callHistoryRef = collection(getDb(), 'callHistory');
  const q = query(
    callHistoryRef,
    where('calleeUid', '==', userUid),
    where('status', '==', 'missed'),
    orderBy('startTime', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.length);
  });
};

// Mark missed calls as seen for a specific chat
export const markMissedCallsAsSeen = async (chatId: string, userUid: string) => {
  // This would typically update a "seen" field in the call history
  // For now, we'll implement this as a simple flag
  // In a production app, you might want to add a "seenBy" array field
};
