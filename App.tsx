import React, { useState, useEffect } from 'react';
import { auth, firestore } from './services/firebase';
import { User, Screen, Language, Theme, Chat } from './types';
import { useTheme } from './hooks/useTheme';

import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import MainScreen from './components/MainScreen';
import ChatScreen from './components/ChatScreen';
import SettingsScreen from './components/SettingsScreen';
import AddFriendScreen from './components/AddFriendScreen';
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.SPLASH);
  const [mainScreen, setMainScreen] = useState<'MAIN' | 'ADD_FRIEND' | 'SETTINGS'>('MAIN');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const { setTheme } = useTheme();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = firestore.collection('users').doc(firebaseUser.uid);
        try {
          const userSnap = await userRef.get();

          if (userSnap.exists) {
            const userData = userSnap.data() as User;
            setCurrentUser(userData);
            setTheme(userData.theme || 'light');
          } else {
            // New user, create a profile
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              avatar: firebaseUser.photoURL,
              language: Language.EN,
              theme: 'light',
            };
            await userRef.set(newUser);
            setCurrentUser(newUser);
            setTheme('light');
          }
        } catch (error) {
            console.error("Error fetching user data:", error);
            // Handle error appropriately, maybe sign out user
            await auth.signOut();
        }
        
        setScreen(Screen.MAIN);
      } else {
        setCurrentUser(null);
        setScreen(Screen.LOGIN);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setTheme]);

  const handleSignOut = async () => {
    try {
        await auth.signOut();
    } catch(error) {
        console.error("Error signing out:", error);
    }
  };

  const handleLanguageChange = async (language: Language) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, language };
      setCurrentUser(updatedUser);
      const userRef = firestore.collection('users').doc(currentUser.uid);
      try {
        await userRef.update({ language });
      } catch (error) {
        console.error("Failed to update language:", error);
        // Optionally revert state
        setCurrentUser(currentUser); 
      }
    }
  };
  
  const handleThemeChange = async (theme: Theme) => {
      if(currentUser){
          const updatedUser = { ...currentUser, theme };
          setCurrentUser(updatedUser);
          const userRef = firestore.collection('users').doc(currentUser.uid);
          try {
            await userRef.update({ theme });
          } catch(error) {
            console.error("Failed to update theme:", error);
            // Optionally revert state
            setCurrentUser(currentUser);
          }
      }
  }

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setScreen(Screen.CHAT);
  };
  
  const handleBackToMain = () => {
    setActiveChat(null);
    setScreen(Screen.MAIN);
    setMainScreen('MAIN');
  };
  
  const handleNavigation = (navScreen: 'MAIN' | 'ADD_FRIEND' | 'SETTINGS') => {
      setMainScreen(navScreen);
  }

  const renderMainContent = () => {
      if (!currentUser) return null;
      
      switch(mainScreen) {
          case 'ADD_FRIEND':
              return <AddFriendScreen currentUser={currentUser} />;
          case 'SETTINGS':
              return <SettingsScreen currentUser={currentUser} onLanguageChange={handleLanguageChange} onThemeChange={handleThemeChange} onSignOut={handleSignOut} />;
          case 'MAIN':
          default:
              return <MainScreen currentUser={currentUser} onSelectChat={handleSelectChat} />;
      }
  }

  const renderScreen = () => {
    if (loading || screen === Screen.SPLASH) {
      return <SplashScreen />;
    }

    switch (screen) {
      case Screen.LOGIN:
        return <LoginScreen onLoginSuccess={() => setLoading(true)} onLoginFailure={(e) => console.error(e)} />;
      case Screen.MAIN:
        return currentUser && (
          <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto">{renderMainContent()}</div>
            <BottomNav activeScreen={mainScreen} onNavigate={handleNavigation} />
          </div>
        );
      case Screen.CHAT:
        return currentUser && activeChat && (
          <ChatScreen currentUser={currentUser} chat={activeChat} onBack={handleBackToMain} />
        );
      default:
        return <LoginScreen onLoginSuccess={() => {}} onLoginFailure={() => {}} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 dark:bg-gray-900 p-0 sm:p-4">
      <div className="w-full h-full sm:max-w-sm sm:h-[85vh] sm:max-h-[900px] bg-white dark:bg-charcoal sm:rounded-3xl shadow-2xl overflow-hidden sm:border-8 border-black relative">
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-xl z-20"></div>
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;