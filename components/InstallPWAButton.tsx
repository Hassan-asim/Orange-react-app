import React from 'react';
import { usePWA } from '../hooks/usePWA';

interface InstallPWAButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const InstallPWAButton: React.FC<InstallPWAButtonProps> = ({ 
  className = "bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200", 
  children = "Install App" 
}) => {
  const { isInstallable, isInstalled, installApp } = usePWA();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      console.log('App installed successfully!');
    }
  };

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      className={className}
      aria-label="Install Orange Chat as a Progressive Web App"
    >
      <span className="flex items-center gap-2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-block"
        >
          <path
            d="M12 2L13.09 8.26L19 7L14.74 13.09L21 12L14.74 10.91L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 10.91L3 12L9.26 13.09L5 7L10.91 8.26L12 2Z"
            fill="currentColor"
          />
        </svg>
        {children}
      </span>
    </button>
  );
};

export default InstallPWAButton;
