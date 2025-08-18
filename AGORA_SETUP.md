# Agora Integration Setup Guide

This guide will help you integrate Agora SDK to replace WebRTC in your chat application.

## 🚀 What is Agora?

Agora is a real-time communication platform that provides:

- **Better reliability** than WebRTC
- **Automatic reconnection** handling
- **Network quality monitoring**
- **Cross-platform support**
- **Built-in scalability**

## 📋 Prerequisites

1. **Agora Account**: Sign up at [Agora Console](https://console.agora.io/)
2. **Node.js**: Version 14 or higher
3. **Firebase Project**: For call notifications

## 🔧 Step 1: Get Agora Credentials

1. Go to [Agora Console](https://console.agora.io/)
2. Create a new project or select existing one
3. Go to **Project Management** → **Project List**
4. Copy your **App ID**

## 🔧 Step 2: Update Configuration

1. Open `config/agora.ts`
2. Replace `YOUR_AGORA_APP_ID` with your actual Agora App ID:

```typescript
export const AGORA_CONFIG = {
  APP_ID: "your-actual-agora-app-id-here",
  // ... other config
};
```

## 🔧 Step 3: Environment Variables (Optional)

For production, you can set environment variables:

```bash
# .env.local
AGORA_TOKEN=your_agora_token_here
```

## 🔧 Step 4: Firebase Rules Update

Add these rules to your `firestore.rules`:

```firestore
// Incoming call notifications
match /incoming_calls/{notificationId} {
  allow read, write: if isSignedIn() &&
    (resource.data.callerUid == request.auth.uid ||
     resource.data.calleeUid == request.auth.uid);
}
```

## 🔧 Step 5: Test the Integration

1. **Start your development server**:

   ```bash
   npm run dev
   ```

2. **Test audio call**:

   - Open the app in two different browsers/tabs
   - Login with different users
   - Start a chat between them
   - Click the phone icon to start an audio call

3. **Test video call**:
   - Click the video icon to start a video call
   - Allow camera and microphone permissions

## 🔧 Step 6: Production Deployment

### Token Generation (Recommended for Production)

For production, generate tokens on your server:

```typescript
// Server-side token generation (Node.js example)
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const appID = "your-agora-app-id";
const appCertificate = "your-app-certificate";
const channelName = "test-channel";
const uid = 0; // 0 for dynamic UID assignment
const role = RtcRole.PUBLISHER;
const expirationTimeInSeconds = 3600; // 1 hour

const token = RtcTokenBuilder.buildTokenWithUid(
  appID,
  appCertificate,
  channelName,
  uid,
  role,
  expirationTimeInSeconds
);
```

### Update Configuration for Production

```typescript
// config/agora.ts
export const getAgoraConfig = () => {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "production":
      return {
        ...AGORA_CONFIG,
        LOG_LEVEL: 3, // Only errors in production
        TOKEN: process.env.AGORA_TOKEN || null,
      };
    // ... other cases
  }
};
```

## 🎯 Key Features

### ✅ What's Working

1. **Audio/Video Calls**: Full support for both call types
2. **Incoming Call Detection**: Firebase-based notification system
3. **Call Controls**: Mute, video toggle, hang up
4. **Responsive UI**: Mobile-friendly call interface
5. **Permission Handling**: Automatic camera/microphone permission requests

### 🔄 What Changed from WebRTC

1. **Service Layer**: Replaced `webrtcService.ts` with `agoraService.ts`
2. **Call Interface**: Updated to use Agora's track-based system
3. **Notification System**: Added Firebase-based incoming call detection
4. **Error Handling**: Improved error handling with Agora's built-in features

## 🐛 Troubleshooting

### Common Issues

1. **"Agora client not initialized"**

   - Check your Agora App ID in `config/agora.ts`
   - Ensure you're using HTTPS or localhost

2. **"Permission denied"**

   - Allow camera/microphone access in browser
   - Check browser console for permission errors

3. **"Failed to join channel"**

   - Verify your Agora App ID
   - Check network connectivity
   - Ensure channel name is valid

4. **Video not showing**
   - Check camera permissions
   - Verify video constraints in configuration
   - Check browser console for errors

### Debug Mode

Enable debug logging by setting log level to 1:

```typescript
// config/agora.ts
LOG_LEVEL: 1, // Info level for debugging
```

## 📱 Browser Support

- **Chrome**: 66+ ✅
- **Firefox**: 60+ ✅
- **Safari**: 12+ ✅
- **Edge**: 79+ ✅

## 🔒 Security Considerations

1. **App ID Exposure**: Agora App ID is safe to expose in client code
2. **Token Generation**: Generate tokens on your server for production
3. **Channel Names**: Use unique, non-guessable channel names
4. **User Authentication**: Ensure users are authenticated before joining calls

## 📚 Additional Resources

- [Agora Web SDK Documentation](https://docs.agora.io/en/Video/API%20Reference/web/index.html)
- [Agora Console](https://console.agora.io/)
- [Agora Community](https://community.agora.io/)

## 🆘 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Agora App ID configuration
3. Check Firebase rules for incoming call notifications
4. Review the troubleshooting section above

---

**Note**: This integration replaces the WebRTC implementation with Agora's more reliable real-time communication system. The user interface remains the same, but the underlying technology provides better performance and reliability.
