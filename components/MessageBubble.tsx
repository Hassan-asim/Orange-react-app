import React, { useState, useEffect } from 'react';
import { Message } from '../types';
import Icon from './Icon';

interface MessageBubbleProps {
  message: Message;
  isSender: boolean;
  recipientLanguage: string;
  currentUserUid: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSender, recipientLanguage, currentUserUid }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const bubbleAlignment = isSender ? 'justify-end' : 'justify-start';
  const bubbleColor = isSender ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  
  const defaultDisplayedText = message.isTranslated && isSender ? message.originalText : message.text;
  const displayedText = showOriginal && message.originalText ? message.originalText : defaultDisplayedText;

  const handleToggleOriginal = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowOriginal(prev => !prev);
  }

  const handlePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel(); // Stop any other speech
      const utterance = new SpeechSynthesisUtterance(displayedText);
      utterance.lang = recipientLanguage; // Set language for TTS
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };
  
  // Cleanup speech on component unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);


  return (
    <div className={`flex ${bubbleAlignment} mb-3`}>
      <div className={`rounded-xl px-4 py-2 max-w-xs md:max-w-md ${bubbleColor}`}>
        {message.error ? (
          <p className="text-red-300 italic">{message.error}</p>
        ) : (
          <div className="flex items-center gap-2">
            {message.type === 'voice' && (
              <button onClick={handlePlayback} className="focus:outline-none flex-shrink-0">
                <Icon name={isPlaying ? 'pause' : 'play'} className={`w-5 h-5 ${isSender ? 'text-orange-200' : 'text-gray-600 dark:text-gray-400'}`} />
              </button>
            )}
            <p className="break-words">{displayedText}</p>
          </div>
        )}
        <div className="flex items-center justify-end mt-1 space-x-2">
            {message.isTranslated && message.originalText && (
                <button onClick={handleToggleOriginal} className="focus:outline-none" aria-label="Show original message">
                    <Icon name="translate" className={`w-4 h-4 ${isSender ? 'text-orange-200' : 'text-gray-500 dark:text-gray-400'} hover:text-opacity-100`} />
                </button>
            )}
            <p className={`text-xs ${isSender ? 'text-orange-200' : 'text-gray-500 dark:text-gray-400'} opacity-80`}>
                {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
