import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  ILocalAudioTrack,
  UID,
  ClientConfig,
  VideoEncoderConfiguration
} from 'agora-rtc-sdk-ng';
import { getAgoraConfig } from '../config/agora';
import { sendIncomingCallNotification, updateCallNotificationStatus } from './agoraCallNotification';

// Get Agora configuration
const config = getAgoraConfig();
const AGORA_APP_ID = config.APP_ID;
const AGORA_TOKEN = config.TOKEN;
const VIDEO_ENCODER_CONFIG: VideoEncoderConfiguration = config.VIDEO_ENCODER;
const CLIENT_CONFIG: ClientConfig = config.CLIENT;

export interface AgoraCallResult {
  localAudioTrack: ILocalAudioTrack;
  localVideoTrack?: ILocalVideoTrack;
  client: IAgoraRTCClient;
  cleanup: () => Promise<void>;
  stop: () => Promise<void>;
}

export interface AgoraCallStatus {
  status: 'idle' | 'ringing' | 'active' | 'ended';
  callType: 'audio' | 'video';
  callerUid: string;
  calleeUid: string;
  startTime?: number;
  endTime?: number;
}

class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: ILocalAudioTrack | null = null;
  private localVideoTrack: ILocalVideoTrack | null = null;
  private remoteUsers: Map<UID, IAgoraRTCRemoteUser> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeAgora();
  }

  private async initializeAgora() {
    try {
      // Set log level for debugging
      AgoraRTC.setLogLevel(1); // 1 = Info, 2 = Warning, 3 = Error, 4 = None
      
      // Create client
      this.client = AgoraRTC.createClient(CLIENT_CONFIG);
      
      // Set client role
      await this.client.setClientRole('host');
      
      // Enable dual stream for better performance
      await this.client.enableDualStream();
      
      this.isInitialized = true;
      console.log('Agora client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Agora client:', error);
      throw error;
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized || !this.client) {
      await this.initializeAgora();
    }
  }

  // Start a call
  async startCall(
    chatId: string,
    callerUid: string,
    calleeUid: string,
    onRemoteTrack: (remoteStream: MediaStream) => void,
    callType: 'audio' | 'video' = 'audio'
  ): Promise<AgoraCallResult> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('Agora client not initialized');
    }

    try {
      console.log(`Starting ${callType} call with Agora...`);
      
      // Create local tracks
      if (callType === 'video') {
        this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        this.localVideoTrack.setEncoderConfiguration(VIDEO_ENCODER_CONFIG);
      }
      
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      
      // Join the channel (using chatId as channel name)
      const uid = await this.client.join(AGORA_APP_ID, chatId, AGORA_TOKEN, callerUid);
      console.log('Joined Agora channel:', chatId, 'with UID:', uid);
      
      // Send incoming call notification to the callee
      try {
        await sendIncomingCallNotification(chatId, callerUid, calleeUid, callType);
      } catch (error) {
        console.warn('Failed to send incoming call notification:', error);
      }
      
      // Publish local tracks
      if (this.localVideoTrack) {
        await this.client.publish(this.localVideoTrack);
      }
      await this.client.publish(this.localAudioTrack);
      
      // Set up event handlers
      this.setupEventHandlers(onRemoteTrack);
      
      // Create cleanup function
      const cleanup = async () => {
        await this.cleanup();
      };
      
      // Create stop function
      const stop = async () => {
        await this.stopCall();
      };
      
      return {
        localAudioTrack: this.localAudioTrack,
        localVideoTrack: this.localVideoTrack || undefined,
        client: this.client,
        cleanup,
        stop
      };
      
    } catch (error) {
      console.error('Failed to start Agora call:', error);
      await this.cleanup();
      throw error;
    }
  }

  // Answer an incoming call
  async answerCall(
    chatId: string,
    calleeUid: string,
    onRemoteTrack: (remoteStream: MediaStream) => void
  ): Promise<AgoraCallResult> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('Agora client not initialized');
    }

    try {
      console.log('Answering Agora call...');
      
      // Join the channel
      const uid = await this.client.join(AGORA_APP_ID, chatId, AGORA_TOKEN, calleeUid);
      console.log('Joined Agora channel:', chatId, 'with UID:', uid);
      
      // Create local tracks (we'll determine call type from the channel)
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      
      // Publish local audio track
      await this.client.publish(this.localAudioTrack);
      
      // Set up event handlers
      this.setupEventHandlers(onRemoteTrack);
      
      // Create cleanup function
      const cleanup = async () => {
        await this.cleanup();
      };
      
      // Create stop function
      const stop = async () => {
        await this.stopCall();
      };
      
      return {
        localAudioTrack: this.localAudioTrack,
        localVideoTrack: this.localVideoTrack || undefined,
        client: this.client,
        cleanup,
        stop
      };
      
    } catch (error) {
      console.error('Failed to answer Agora call:', error);
      await this.cleanup();
      throw error;
    }
  }

  // Set up event handlers for remote users
  private setupEventHandlers(onRemoteTrack: (remoteStream: MediaStream) => void) {
    if (!this.client) return;

    // User published event
    this.client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      console.log('User published:', user.uid, mediaType);
      
      try {
        // Subscribe to the remote user
        await this.client!.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          // Create a MediaStream from the remote video track
          const remoteVideoTrack = user.videoTrack;
          if (remoteVideoTrack) {
            const stream = new MediaStream([remoteVideoTrack.getMediaStreamTrack()]);
            onRemoteTrack(stream);
          }
        } else if (mediaType === 'audio') {
          // Create a MediaStream from the remote audio track
          const remoteAudioTrack = user.audioTrack;
          if (remoteAudioTrack) {
            const stream = new MediaStream([remoteAudioTrack.getMediaStreamTrack()]);
            onRemoteTrack(stream);
          }
        }
        
        this.remoteUsers.set(user.uid, user);
      } catch (error) {
        console.error('Failed to subscribe to remote user:', error);
      }
    });

    // User unpublished event
    this.client.on('user-unpublished', (user: IAgoraRTCRemoteUser) => {
      console.log('User unpublished:', user.uid);
      this.remoteUsers.delete(user.uid);
    });

    // User left event
    this.client.on('user-left', (user: IAgoraRTCRemoteUser) => {
      console.log('User left:', user.uid);
      this.remoteUsers.delete(user.uid);
    });

    // Connection state change
    this.client.on('connection-state-change', (curState, prevState, reason) => {
      console.log('Connection state changed:', prevState, '->', curState, 'Reason:', reason);
    });

    // Network quality
    this.client.on('network-quality', (uid, quality) => {
      console.log('Network quality for UID:', uid, 'Quality:', quality);
    });
  }

  // Stop the current call
  async stopCall(): Promise<void> {
    try {
      if (this.client) {
        await this.client.leave();
      }
      
      if (this.localAudioTrack) {
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      
      if (this.localVideoTrack) {
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }
      
      this.remoteUsers.clear();
      console.log('Agora call stopped');
    } catch (error) {
      console.error('Error stopping Agora call:', error);
    }
  }

  // Cleanup all resources
  async cleanup(): Promise<void> {
    await this.stopCall();
    
    if (this.client) {
      this.client.removeAllListeners();
      this.client = null;
    }
    
    this.isInitialized = false;
    console.log('Agora service cleaned up');
  }

  // Get network quality
  getNetworkQuality(): 'excellent' | 'good' | 'poor' | 'unknown' {
    if (!this.client) return 'unknown';
    
    // This would need to be implemented based on Agora's network quality events
    // For now, returning unknown
    return 'unknown';
  }

  // Mute/unmute audio
  async toggleMute(): Promise<boolean> {
    if (!this.localAudioTrack) return false;
    
    const isMuted = !this.localAudioTrack.enabled;
    this.localAudioTrack.setEnabled(!isMuted);
    return !isMuted;
  }

  // Enable/disable video
  async toggleVideo(): Promise<boolean> {
    if (!this.localVideoTrack) return false;
    
    const isEnabled = this.localVideoTrack.enabled;
    this.localVideoTrack.setEnabled(!isEnabled);
    return !isEnabled;
  }

  // Get local audio track
  getLocalAudioTrack(): ILocalAudioTrack | null {
    return this.localAudioTrack;
  }

  // Get local video track
  getLocalVideoTrack(): ILocalVideoTrack | null {
    return this.localVideoTrack;
  }

  // Get remote users
  getRemoteUsers(): IAgoraRTCRemoteUser[] {
    return Array.from(this.remoteUsers.values());
  }
}

// Create singleton instance
const agoraService = new AgoraService();

// Export functions that match the WebRTC service interface
export const startCall = async (
  chatId: string,
  callerUid: string,
  calleeUid: string,
  onRemoteTrack: (remoteStream: MediaStream) => void,
  callType: 'audio' | 'video' = 'audio'
): Promise<AgoraCallResult> => {
  return agoraService.startCall(chatId, callerUid, calleeUid, onRemoteTrack, callType);
};

export const answerCall = async (
  chatId: string,
  calleeUid: string,
  onRemoteTrack: (remoteStream: MediaStream) => void
): Promise<AgoraCallResult> => {
  return agoraService.answerCall(chatId, calleeUid, onRemoteTrack);
};

export const endCall = async (chatId: string): Promise<void> => {
  await agoraService.stopCall();
};

export const logMissedCall = async (
  chatId: string,
  callerUid: string,
  calleeUid: string,
  callType: 'audio' | 'video'
): Promise<void> => {
  // Implementation for logging missed calls
  console.log('Missed call logged:', { chatId, callerUid, calleeUid, callType });
};

export const logDeclinedCall = async (
  chatId: string,
  callerUid: string,
  calleeUid: string,
  callType: 'audio' | 'video'
): Promise<void> => {
  // Implementation for logging declined calls
  console.log('Declined call logged:', { chatId, callerUid, calleeUid, callType });
};

// Export the service instance for direct access if needed
export { agoraService };
