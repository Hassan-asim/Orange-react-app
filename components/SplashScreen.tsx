import React from 'react';
import PIC1 from '@/public/logg.png'

import Icon from './Icon';

const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white">
      {/* <Icon name="chat" className="w-24 h-24 text-orange-500" /> */}
      <img src={PIC1} alt="Logo" className="w-24 h-24 mx-auto mb-4" />
      <h1 className="text-4xl font-bold text-[#FF7B00] mt-4">Orange Chat</h1>
      <div className="mt-8">
        <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
