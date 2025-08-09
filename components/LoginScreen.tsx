import React from 'react';
import { auth, googleProvider } from '../services/firebase';
import Icon from './Icon';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onLoginFailure: (error: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onLoginFailure }) => {
  const handleGoogleSignIn = async () => {
    try {
      await auth.signInWithPopup(googleProvider);
      // The onAuthStateChanged listener in App.tsx will handle the rest.
      // onLoginSuccess is implicitly handled by the auth state listener
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      onLoginFailure(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-charcoal p-4">
      <div className="text-center mb-10">
        <Icon name="chat" className="w-20 h-20 text-orange-500 mx-auto" />
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mt-4">Orange Chat</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Connect and translate instantly.</p>
      </div>
      <div className="w-full max-w-sm">
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-200"
        >
          <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h13.01c-.59 2.97-2.27 5.48-4.78 7.18l7.73 6.02C45.33 39.73 48 32.74 48 24c0-.68-.06-1.35-.17-2.01z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6.02c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          <span className="font-semibold text-gray-700 dark:text-white">Sign in with Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;