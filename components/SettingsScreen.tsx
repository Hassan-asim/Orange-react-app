import React from 'react';
import { User, Language, LanguageDetails, Theme } from '../types';
import { LANGUAGES } from '../constants';
import Icon from './Icon';
import { useTheme } from '../hooks/useTheme';

interface SettingsScreenProps {
  currentUser: User;
  onLanguageChange: (language: Language) => void;
  onThemeChange: (theme: Theme) => void;
  onSignOut: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentUser, onLanguageChange, onThemeChange, onSignOut }) => {
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    onThemeChange(newTheme);
  };
  
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
      <header className="flex items-center justify-center p-4 bg-white dark:bg-charcoal border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h1>
      </header>

      <main className="flex-grow p-4 md:p-6 space-y-6">
        <div className="flex flex-col items-center p-6 bg-white dark:bg-charcoal rounded-xl shadow-md">
          <Avatar user={currentUser} className="w-24 h-24 border-4 border-orange-400 shadow-lg" />
          <h2 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-white">{currentUser.name}</h2>
           <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
        </div>

        <div className="bg-white dark:bg-charcoal p-4 rounded-xl shadow-md space-y-4">
          <div>
            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Translation Language
            </label>
            <select
              id="language-select"
              value={currentUser.language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {LANGUAGES.map((lang: LanguageDetails) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Received messages will be translated into this language.</p>
          </div>
          <hr className="dark:border-gray-600" />
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Dark Mode
            </label>
            <button onClick={handleThemeToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${theme === 'dark' ? 'bg-orange-500' : 'bg-gray-200'}`}>
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        
        <div className="pt-4">
             <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-200"
            >
                <Icon name="logout" className="w-5 h-5 mr-2" />
              Sign Out
            </button>
        </div>
      </main>
    </div>
  );
};

export default SettingsScreen;