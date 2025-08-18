# Testing Firebase Setup

After updating all components to use the modular Firebase version, let's test if the permission issues are resolved.

## Step 1: Deploy Updated Firestore Rules

First, make sure you've deployed the updated Firestore rules:

```bash
firebase deploy --only firestore:rules
```

Or manually update them in the Firebase Console.

## Step 2: Test Basic Firebase Operations

Open your app in the browser and check the console for any errors. The app should now:

1. **Load without permission errors** in the console
2. **Allow user authentication** (Google sign-in should work)
3. **Allow reading user data** from Firestore
4. **Allow reading chat data** from Firestore

## Step 3: Test Chat Creation

1. Go to the "Add Friend" tab
2. Search for a user by email
3. Send a friend request
4. Accept the friend request (this creates a chat)

## Step 4: Test Call Functionality

1. Open a chat with another user
2. Try to start a call (audio or video)
3. Check the console for the debug logs we added

## Expected Console Output

When starting a call, you should see:

```
Starting call with: { chatId: "...", callerUid: "...", calleeUid: "...", callType: "audio" }
Current user UID: ...
Chat document exists with data: { participants: [...], ... }
Chat participants field: [...]
Is participants an array: true
Current user ID: ...
User ID type: string
Is user participant: true
Attempting to write to call document: chats/.../call/active
Successfully wrote call document
```

## If You Still Get Permission Errors

1. **Check Firestore Rules**: Make sure they're deployed and correct
2. **Check Authentication**: Ensure the user is properly signed in
3. **Check Chat Data**: Verify the chat document exists and has correct participants
4. **Check User Permissions**: Make sure the user has the right UID

## Common Issues and Solutions

### Issue: "Missing or insufficient permissions"

- **Cause**: Firestore rules not deployed or incorrect
- **Solution**: Deploy updated rules and wait a few minutes

### Issue: "Chat not found"

- **Cause**: Chat document doesn't exist in Firestore
- **Solution**: Create a new chat by accepting a friend request

### Issue: "User is not a participant"

- **Cause**: User UID mismatch in chat participants
- **Solution**: Check if the user is properly authenticated

## Next Steps

If everything works correctly:

1. The permission errors should be gone
2. Calls should start successfully
3. WebRTC signaling should work through Firestore

If you still have issues, the debug logs will show exactly what's happening.
