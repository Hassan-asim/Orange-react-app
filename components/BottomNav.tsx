import React from 'react';
import Icon from './Icon';

interface BottomNavProps {
  activeScreen: 'MAIN' | 'ADD_FRIEND' | 'SETTINGS';
  onNavigate: (screen: 'MAIN' | 'ADD_FRIEND' | 'SETTINGS') => void;
}

const NavItem: React.FC<{
  iconName: 'chat' | 'add-friend' | 'settings';
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ iconName, label, isActive, onClick }) => {
  const activeClass = isActive ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400';
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 focus:outline-none ${activeClass} hover:text-orange-500 dark:hover:text-orange-400`}>
      <Icon name={iconName} className="w-6 h-6 mb-1" />
      <span className="text-xs">{label}</span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onNavigate }) => {
  return (
    <footer className="flex justify-around bg-white dark:bg-charcoal border-t border-gray-200 dark:border-gray-700">
      <NavItem
        iconName="chat"
        label="Chats"
        isActive={activeScreen === 'MAIN'}
        onClick={() => onNavigate('MAIN')}
      />
      <NavItem
        iconName="add-friend"
        label="Add Friend"
        isActive={activeScreen === 'ADD_FRIEND'}
        onClick={() => onNavigate('ADD_FRIEND')}
      />
      <NavItem
        iconName="settings"
        label="Settings"
        isActive={activeScreen === 'SETTINGS'}
        onClick={() => onNavigate('SETTINGS')}
      />
    </footer>
  );
};

export default BottomNav;
