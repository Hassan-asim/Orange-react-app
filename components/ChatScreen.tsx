import React, { useState, useRef, useEffect } from 'react';
import { User, Message, Chat } from '../types';
import { translateText } from '../services/geminiService';
import MessageBubble from './MessageBubble';
import Icon from './Icon';
import { LANGUAGES } from '../constants';
import { firestore, serverTimestamp } from '../services/firebase';
import EmojiPicker from 'emoji-picker-react';

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
    
    // Check if message contains only emojis/symbols (no alphabetic characters)
    const hasAlphabeticText = /[a-zA-Z\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0980-\u09FF\uAC00-\uD7AF]/.test(trimmedMessage);
    
    const needsTranslation = currentUser.language !== otherUser.language && hasAlphabeticText;
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
          const messagesCollectionRef = firestore.collection('chats').doc(chat.id).collection('messages');
          const chatRef = firestore.collection('chats').doc(chat.id);

          await messagesCollectionRef.add(imageMessage);
          
          await chatRef.update({
            lastMessage: {
              text: '📷 Image', // Show image indicator in chat list preview
              timestamp: serverTimestamp()
            }
          });
        } catch (error) {
          console.error("Error sending image:", error);
          alert('Failed to send image');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
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

      <footer className="p-3 bg-white dark:bg-charcoal border-t border-gray-200 dark:border-gray-700 relative">
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
      </footer>
    </div>
  );
};

export default ChatScreen;