# Orange Chat - PWA Chat Application

This is a Progressive Web App (PWA) chat application with real-time translation capabilities and AI integration.

## Features

- 📱 **Progressive Web App (PWA)** - Installable on mobile and desktop
- 🌍 **Real-time Translation** - Support for 200+ languages
- 🤖 **AI Integration** - Powered by Google Gemini
- 🔄 **Offline Support** - Works without internet connection
- 📲 **Native App Experience** - Install on any device
- 🎨 **Responsive Design** - Optimized for all screen sizes

## PWA Features

- **Installable**: Users can install the app on their devices from the browser
- **Offline Functionality**: Core features work without internet connection
- **Service Worker**: Automatic updates and caching for better performance
- **Native Feel**: Standalone display mode for app-like experience
- **Push Notifications**: Ready for future push notification implementation

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview the PWA build:
   ```bash
   npm run preview
   ```

## PWA Installation

1. Open the app in a supported browser (Chrome, Edge, Safari, Firefox)
2. Look for the "Install App" button on the landing page
3. Or use the browser's install prompt (usually appears in the address bar)
4. The app will be installed and can be launched like a native app

## PWA Testing

To test PWA features locally:

1. Build the app: `npm run build`
2. Serve with HTTPS: `npm run serve:https`
3. Open in browser and test installation and offline functionality

## Technologies Used

- React 19
- TypeScript
- Vite
- Vite PWA Plugin
- Workbox (Service Worker)
- Tailwind CSS
- Firebase
- Google Gemini API
