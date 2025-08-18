# WebRTC vs Agora - Switching Guide

This project now supports both WebRTC and Agora for real-time communication. You can easily switch between them based on your needs.

## 🔄 Current Status

- **Active**: WebRTC (default)
- **Available**: Agora (kept in project for future use)

## 📁 File Structure

```
services/
├── webrtcService.ts          # Active WebRTC implementation
├── agoraService.ts           # Available Agora implementation
└── agoraCallNotification.ts  # Agora notification system

config/
└── agora.ts                  # Agora configuration

components/
└── ChatScreen.tsx           # Updated to work with both systems
```

## 🔧 How to Switch

### Option 1: Quick Import Change (Recommended)

In `components/ChatScreen.tsx`, change the import:

**For WebRTC (current):**

```typescript
import {
  listenForIncomingCall,
  startCall,
  answerCall,
  onCallStatusChange,
  endCall,
  logMissedCall,
  logDeclinedCall,
} from "../services/webrtcService";
```

**For Agora:**

```typescript
import {
  startCall,
  answerCall,
  endCall,
  logMissedCall,
  logDeclinedCall,
} from "../services/agoraService";
import {
  listenForIncomingCalls,
  updateCallNotificationStatus,
} from "../services/agoraCallNotification";
```

### Option 2: Environment Variable Switch

Create a `.env.local` file:

```bash
# .env.local
REACT_APP_CALL_SYSTEM=webrtc  # or 'agora'
```

Then update the import dynamically in `ChatScreen.tsx`:

```typescript
const callSystem = process.env.REACT_APP_CALL_SYSTEM || "webrtc";

const { startCall, answerCall, endCall, logMissedCall, logDeclinedCall } =
  callSystem === "agora"
    ? require("../services/agoraService")
    : require("../services/webrtcService");
```

## 🎯 Feature Comparison

| Feature              | WebRTC  | Agora       |
| -------------------- | ------- | ----------- |
| **Reliability**      | Good    | Excellent   |
| **Setup Complexity** | Simple  | Medium      |
| **Cost**             | Free    | Pay-per-use |
| **Network Handling** | Manual  | Automatic   |
| **Reconnection**     | Manual  | Automatic   |
| **Cross-platform**   | Good    | Excellent   |
| **Scalability**      | Limited | High        |

## 🚀 When to Use Each

### Use WebRTC When:

- ✅ Building a simple, free solution
- ✅ Learning or prototyping
- ✅ Small user base
- ✅ Want full control over the implementation
- ✅ Budget constraints

### Use Agora When:

- ✅ Building a production app
- ✅ Need high reliability
- ✅ Large user base
- ✅ Want automatic network handling
- ✅ Need cross-platform support
- ✅ Budget allows for paid service

## 🔧 Configuration

### WebRTC Configuration

WebRTC uses standard browser APIs and doesn't require external configuration.

### Agora Configuration

If switching to Agora, update `config/agora.ts`:

```typescript
export const AGORA_CONFIG = {
  APP_ID: "your-actual-agora-app-id-here",
  // ... other settings
};
```

## 📱 Testing Both Systems

### Test WebRTC:

1. Start development server: `npm run dev`
2. Open in two browsers/tabs
3. Login with different users
4. Start a chat and test calls

### Test Agora:

1. Update imports to use Agora
2. Configure your Agora App ID
3. Test the same call functionality

## 🔄 Switching Process

### From WebRTC to Agora:

1. Update imports in `ChatScreen.tsx`
2. Configure Agora App ID
3. Deploy updated Firebase rules
4. Test incoming call notifications

### From Agora to WebRTC:

1. Update imports in `ChatScreen.tsx`
2. Remove Agora-specific notification code
3. Test WebRTC functionality

## 🐛 Troubleshooting

### WebRTC Issues:

- Check browser console for errors
- Verify camera/microphone permissions
- Ensure HTTPS or localhost
- Check Firebase rules for call documents

### Agora Issues:

- Verify Agora App ID configuration
- Check browser console for Agora errors
- Ensure Firebase rules for incoming calls
- Verify network connectivity

## 📚 Additional Resources

- **WebRTC**: [MDN WebRTC Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- **Agora**: [Agora Web SDK Documentation](https://docs.agora.io/en/Video/API%20Reference/web/index.html)

## 💡 Pro Tips

1. **Keep Both**: Having both implementations allows easy A/B testing
2. **Feature Flags**: Use environment variables to switch dynamically
3. **Gradual Migration**: Test Agora with a subset of users first
4. **Fallback**: Consider implementing fallback from Agora to WebRTC

---

**Note**: Both systems maintain the same user interface, so users won't notice the difference when switching between them.
