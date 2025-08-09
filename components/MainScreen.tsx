import React, { useState, useEffect } from 'react';
import { firestore } from '../services/firebase';
import { User, Chat } from '../types';
import Icon from './Icon';
import PIC1 from '@/public/logg.png';

interface MainScreenProps {
  currentUser: User;
  onSelectChat: (chat: Chat) => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ currentUser, onSelectChat }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const chatsCollectionRef = firestore.collection('chats');
    const q = chatsCollectionRef.where('participants', 'array-contains', currentUser.uid);

    const unsubscribe = q.onSnapshot(async (querySnapshot) => {
      try {
        const chatsData: Chat[] = await Promise.all(
          querySnapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            const participantUids = chatData.participants as string[];
            
            const participantDetailsPromises = participantUids.map(async (uid) => {
              const userDocRef = firestore.collection('users').doc(uid);
              const userSnap = await userDocRef.get();
              return userSnap.exists ? userSnap.data() as User : null;
            });

            const participantDetails = (await Promise.all(participantDetailsPromises)).filter(p => p !== null) as User[];

            return {
              id: chatDoc.id,
              participants: participantUids,
              participantDetails: participantDetails,
              lastMessage: chatData.lastMessage || null,
            };
          })
        );
        
        const sortedChats = chatsData.sort((a, b) => {
          if (!a.lastMessage?.timestamp) return 1;
          if (!b.lastMessage?.timestamp) return -1;
          return b.lastMessage.timestamp.toDate().getTime() - a.lastMessage.timestamp.toDate().getTime();
        });

        setChats(sortedChats);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getOtherParticipant = (chat: Chat) => {
      return chat.participantDetails.find(p => p.uid !== currentUser.uid);
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

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center  p-4 bg-white dark:bg-charcoal border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <img src={PIC1} alt="" className="w-12 h-12 rounded-full" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-white"><span className="text-[#f97316]">Orange</span>Chats</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        {loading && <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading chats...</div>}
        {!loading && chats.length === 0 && (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            <p>No chats yet.</p>
            <p className="mt-2 text-sm">Use the 'Add Friend' tab to start a new conversation.</p>
          </div>
        )}
        <ul>
          {chats.map(chat => {
            const otherUser = getOtherParticipant(chat);
            if (!otherUser) return null;
            
            return (
              <li key={chat.id} onClick={() => onSelectChat(chat)} className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700">
                <Avatar user={otherUser} className="w-12 h-12" />
                <div className="flex-1 ml-4 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-white truncate">{otherUser.name}</h3>
                    {chat.lastMessage?.timestamp && (
                       <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                          {new Date(chat.lastMessage.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {chat.lastMessage ? chat.lastMessage.text : 'No messages yet'}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  );
};

export default MainScreen;