import React, { useState } from 'react';
import { modularDb } from '../services/firebase';
import { User, FriendRequest } from '../types';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import Icon from './Icon';

interface AddFriendScreenProps {
  currentUser: User;
}

const AddFriendScreen: React.FC<AddFriendScreenProps> = ({ currentUser }) => {
  const [email, setEmail] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [feedback, setFeedback] = useState('');
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  
  // Listener for incoming friend requests
  // This useEffect is removed as per the new_code, as the listener logic is not provided in the new_code.
  // If the user intends to re-add the listener, they must provide the new_code for it.

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setFeedback('Searching...');
    try {
        const usersRef = collection(modularDb, 'users');
        const q = query(usersRef, where('email', '==', email.trim()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            setFeedback('No user found with this email.');
            setSearchResults([]);
        } else {
            const users = querySnapshot.docs.map(doc => doc.data() as User);
            const filteredUsers = users.filter(user => user.uid !== currentUser.uid);
            
            if (filteredUsers.length === 0) {
                setFeedback('No other users found with this email.');
                setSearchResults([]);
            } else {
                setSearchResults(filteredUsers);
                setFeedback('');
            }
        }
    } catch (error) {
        console.error("Error searching for user:", error);
        setFeedback('An error occurred while searching.');
    }
  };

  const sendFriendRequest = async (toUid: string) => {
    setFeedback('Sending request...');
    try {
        const requestsRef = collection(modularDb, 'friend_requests');
        // Check if a request already exists
        const q1 = query(requestsRef, where('from', '==', currentUser.uid), where('to', '==', toUid));
        const q2 = query(requestsRef, where('from', '==', toUid), where('to', '==', currentUser.uid));

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        if (!snap1.empty || !snap2.empty) {
            setFeedback('A friend request already exists.');
            return;
        }

        await addDoc(requestsRef, {
          from: currentUser.uid,
          to: toUid,
          createdAt: serverTimestamp(),
        });
        setFeedback('Friend request sent!');
        setSearchResults([]);
        setEmail('');
    } catch(error) {
        console.error("Error sending friend request:", error);
        setFeedback('Failed to send request. Please try again.');
    } finally {
       setTimeout(() => setFeedback(''), 3000);
    }
  };
  
  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      const batch = writeBatch(modularDb);
      
      const newChatRef = doc(collection(modularDb, 'chats'));
      batch.set(newChatRef, {
        participants: [request.from, request.to],
        createdAt: serverTimestamp()
      });
      
      const requestRef = doc(modularDb, 'friend_requests', request.id);
      batch.delete(requestRef);
      
      await batch.commit();
    } catch (error) {
        console.error("Error accepting friend request:", error);
    }
  };
  
  const handleDeclineRequest = async (requestId: string) => {
      try {
        await deleteDoc(doc(modularDb, 'friend_requests', requestId));
      } catch (error) {
        console.error("Error declining friend request:", error);
      }
  };

  const Avatar = ({ user, className }: { user: User | null, className?: string }) => (
    <>
      {user?.avatar ? (
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
      <header className="p-4 bg-white dark:bg-charcoal border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white text-center w-full">Add Friend</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-white  p-4 rounded-xl shadow-md">
          <form onSubmit={handleSearch} className=" spacy-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Search by email"
              className="flex-1 px-4 py-2 bg-gray-50 w-full dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-white"
            />
            <button type="submit" className="px-4 w-full py-2 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">Search</button>
          </form>
          {feedback && <p className="text-sm text-center mt-2 text-gray-600 dark:text-gray-400">{feedback}</p>}
          {searchResults.map(user => (
            <div key={user.uid} className="flex items-center justify-between mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <Avatar user={user} className="w-10 h-10" />
                <div className="ml-3">
                    <span className="font-semibold text-gray-800 dark:text-white">{user.name}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <button onClick={() => sendFriendRequest(user.uid)} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <Icon name="add-friend" className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="bg-white dark:bg-charcoal p-4 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Friend Requests</h2>
          {friendRequests.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No new requests.</p>
          ) : (
            <div className="space-y-2">
              {friendRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <div className="flex items-center overflow-hidden">
                     <Avatar user={req.fromUser} className="w-10 h-10 flex-shrink-0" />
                     <p className="ml-3 text-sm text-gray-800 dark:text-white truncate"><span className="font-semibold">{req.fromUser?.name || '...'}</span> wants to connect.</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                      <button onClick={() => handleAcceptRequest(req)} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"><Icon name="check" className="w-5 h-5"/></button>
                      <button onClick={() => handleDeclineRequest(req.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"><Icon name="close" className="w-5 h-5"/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddFriendScreen;