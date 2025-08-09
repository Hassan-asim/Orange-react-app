import React, { useState, useRef, useEffect } from 'react';
import { User, Message, Chat } from '../types';
import { translateText } from '../services/geminiService';
import MessageBubble from './MessageBubble';
import Icon from './Icon';
import { LANGUAGES } from '../constants';
import { firestore, serverTimestamp } from '../services/firebase';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUser = chat.participantDetails.find(p => p.uid !== currentUser.uid);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(scrollToBottom, [messages]);
  
  // Listen for new messages
  useEffect(() => {
    if (!chat) return;
    const messagesCollectionRef = firestore.collection('chats').doc(chat.id).collection('messages');
    const q = messagesCollectionRef.orderBy('timestamp', 'asc');

    const unsubscribe = q.onSnapshot((querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
    });
    
    return () => unsubscribe();
  }, [chat]);

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
    if (!trimmedMessage || isSending) return;

    setIsSending(true);

    const userMessage: Omit<Message, 'id' | 'timestamp'> & { timestamp: any } = {
      senderUid: currentUser.uid,
      text: trimmedMessage,
      timestamp: serverTimestamp(),
      isTranslated: false,
      type: type,
    };
    
    const needsTranslation = currentUser.language !== otherUser.language;
    if (needsTranslation) {
        const targetLanguageDetails = LANGUAGES.find(l => l.code === otherUser.language);
        if(targetLanguageDetails) {
            try {
                const translatedText = await translateText(trimmedMessage, targetLanguageDetails);
                userMessage.text = translatedText; // Recipient sees translated text
                userMessage.originalText = trimmedMessage; // Store original
                userMessage.isTranslated = true;
            } catch(e) {
                console.error("Translation failed", e);
                userMessage.error = "Translation failed.";
            }
        }
    }
    
    try {
        const messagesCollectionRef = firestore.collection('chats').doc(chat.id).collection('messages');
        const chatRef = firestore.collection('chats').doc(chat.id);

        await messagesCollectionRef.add(userMessage);
        
        await chatRef.update({
            lastMessage: {
                text: trimmedMessage, // Show original in chat list preview
                timestamp: serverTimestamp()
            }
        });
    } catch (error) {
        console.error("Error sending message:", error);
        // Optionally, show an error to the user
    } finally {
        setNewMessage('');
        setIsSending(false);
    }
  };
  
  const handleSendText = () => handleSend(newMessage, 'text');
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendText();
  };

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
    recognition.onerror = (event: any) => { console.error('Speech recognition error:', event.error); setIsRecording(false); };
    recognition.onend = () => setIsRecording(false);
    return () => { if (recognition) recognition.abort(); }
  }, [currentUser.language, otherUser?.language, chat.id]);
  
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
        <div className="w-10"></div>
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

      <footer className="p-3 bg-white dark:bg-charcoal border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? "Recording..." : "Type a message..."}
            className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 dark:text-white"
            disabled={isSending || isRecording}
          />
          <div className="ml-3">
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
        { (isSending || isRecording) && <p className="text-xs text-center text-gray-500 mt-2">{isRecording ? 'Recording...' : 'Sending...'}</p> }
        {!recognition && <p className="text-xs text-center text-red-500 mt-2">Voice recognition is not supported by your browser.</p>}
      </footer>
    </div>
  );
};

export default ChatScreen;