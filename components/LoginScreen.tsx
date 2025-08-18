import React, { useState } from "react";
import { auth, googleProvider, modularDb } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // 👈 Import icons
import PIC1 from "/logg.png";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onLoginFailure: (error: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onLoginFailure }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 NEW

  const createUserDocIfNew = async (user: any) => {
    if (!user?.uid || !user.email) {
      console.error("Missing UID or Email for user creation.");
      return;
    }

    const userRef = doc(modularDb, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const emailLocalPart = user.email.split("@")[0];
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || emailLocalPart,
        username: emailLocalPart,
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserDocIfNew(result.user);
      onLoginSuccess();
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      onLoginFailure(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      console.error("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const emailLocalPart = email.split("@")[0];
      await updateProfile(userCredential.user, {
        displayName: emailLocalPart,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(emailLocalPart)}`
      });
      await createUserDocIfNew(userCredential.user);
      onLoginSuccess();
    } catch (error) {
      console.error("Email Sign-Up Error:", error);
      onLoginFailure(error);
    } finally { 
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      console.error("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (error) {
      console.error("Email Login Error:", error);
      onLoginFailure(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-charcoal p-4">
      <div className="text-center mb-5">
        <img src={PIC1} alt="Logo" className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-[#FF7B00] mt-4">Orange Chat</h1>
        <p className="text-gray-800 mt-2">Connect and translate instantly.</p>
      </div>

      {/* Email & Password Form */}
      <div className="w-full max-w-sm mb-6">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-3 border rounded-lg mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password field with Eye icon toggle */}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"} // 👈 Toggle
            placeholder="Password"
            className="w-full px-4 py-3 border rounded-lg pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-4 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {!isRegistering ? (
          <>
            <button
              onClick={handleEmailLogin}
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg mb-2 hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Login"}
            </button>
            <p className="text-sm text-center">
              New here?{" "}
              <span
                onClick={() => setIsRegistering(true)}
                className="text-orange-500 cursor-pointer"
              >
                Create an account
              </span>
            </p>
          </>
        ) : (
          <>
            <button
              onClick={handleEmailSignUp}
              disabled={loading}
              className="w-full bg-green-500 text-white py-3 rounded-lg mb-2 hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Sign Up"}
            </button>
            <p className="text-sm text-center">
              Already have an account?{" "}
              <span
                onClick={() => setIsRegistering(false)}
                className="text-orange-500 cursor-pointer"
              >
                Login here
              </span>
            </p>
          </>
        )}
      </div>

      {/* OR Divider */}
      <div className="flex items-center w-full max-w-sm mb-4">
        <hr className="flex-grow border-gray-300" />
        <span className="px-2 text-gray-500">OR</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      {/* Google Sign-In Button */}
      <div className="w-full max-w-sm">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          {loading ? (
            "Loading..."
          ) : (
            <>
              <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h13.01c-.59 2.97-2.27 5.48-4.78 7.18l7.73 6.02C45.33 39.73 48 32.74 48 24c0-.68-.06-1.35-.17-2.01z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6.02c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span className="font-semibold text-gray-700 dark:text-white">Sign in with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
