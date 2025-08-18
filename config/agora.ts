// Agora configuration
export const AGORA_CONFIG = {
  // Replace with your Agora App ID from the Agora Console
  APP_ID: '756cdedb04bf4161930c1ca56f87a381',
  
  // For testing, use null. In production, generate tokens on your server
  TOKEN: null,
  
  // Video encoder configuration
  VIDEO_ENCODER: {
    width: 640,
    height: 480,
    bitrateMin: 600,
    bitrateMax: 2000,
    frameRate: 30,
    orientationMode: 0,
    degradationPreference: 0
  },
  
  // Client configuration
  CLIENT: {
    mode: 'rtc' as const,
    codec: 'vp8' as const
  },
  
  // ICE servers (fallback for WebRTC if needed)
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  
  // Log level: 1 = Info, 2 = Warning, 3 = Error, 4 = None
  LOG_LEVEL: 1,
  
  // Enable dual stream for better performance
  ENABLE_DUAL_STREAM: true,
  
  // Client role: 'host' for caller, 'audience' for callee
  DEFAULT_CLIENT_ROLE: 'host' as const,
  
  // Channel prefix for organizing calls
  CHANNEL_PREFIX: 'chat_',
  
  // Timeout for operations (in milliseconds)
  TIMEOUT: {
    JOIN_CHANNEL: 10000,
    PUBLISH_TRACK: 5000,
    SUBSCRIBE_USER: 5000
  }
};

// Environment-specific configurations
export const getAgoraConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        ...AGORA_CONFIG,
        LOG_LEVEL: 3, // Only errors in production
        TOKEN: process.env.AGORA_TOKEN || null
      };
    
    case 'development':
      return {
        ...AGORA_CONFIG,
        LOG_LEVEL: 1, // Info level for development
        TOKEN: null // No token for development
      };
    
    default:
      return AGORA_CONFIG;
  }
};
