# Deploy Firestore Rules

To fix the "Missing or insufficient permissions" error, you need to deploy the updated Firestore security rules to your Firebase project.

## Option 1: Using Firebase CLI (Recommended)

1. Install Firebase CLI if you haven't already:

   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):

   ```bash
   firebase init firestore
   ```

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `orange-5fa42`
3. Go to Firestore Database → Rules
4. Copy the contents of `firestore.rules` and paste them in the rules editor
5. Click "Publish"

## Option 3: Check Current Rules

You can also verify your current rules by running:

```bash
firebase firestore:rules:get
```

## Verify Rules Deployment

After deploying, the rules should take effect within a few minutes. You can test them by:

1. Opening your app in the browser
2. Opening the browser console
3. Trying to start a call
4. Looking for the debug logs we added

The logs should show:

- Chat data and participants
- Whether the user has access
- Any permission errors

## Common Issues

1. **Rules not deployed**: Make sure you're deploying to the correct project
2. **Authentication issues**: Ensure the user is properly signed in
3. **Chat document missing**: The chat might not exist in Firestore
4. **Participants field mismatch**: The participants array might not contain the user's UID

## Testing

After deploying the rules, try starting a call again. The debug logs should help identify any remaining issues.
