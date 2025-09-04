import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { DarkModeProvider, useDarkMode } from "../contexts/DarkModeContext";

interface AuthState {
  showLogin: boolean;
  showSignup: boolean;
  isLoggedIn: boolean;
  showNewChat: boolean;
  appLoaded: boolean;
  signInClicked: boolean;
}

interface LoginForm {
  username: string;
  password: string;
}

interface SignupForm {
  signupEmail: string;
  signupPassword: string;
  signupConfirmPassword: string;
  signupName: string;
}

const AnimatedBackground = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <>
    {/* Background gradient orbs */}
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-radial from-brand-purple to-transparent rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute top-40 right-32 w-80 h-80 bg-gradient-radial from-brand-blue to-transparent rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-32 left-1/3 w-72 h-72 bg-gradient-radial from-brand-pink to-transparent rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-radial from-brand-lime to-transparent rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />
    </div>

    {/* Floating dots */}
    <div className="absolute inset-0">
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-brand-purple rounded-full opacity-60 animate-ping" />
      <div
        className="absolute top-1/3 right-1/3 w-1 h-1 bg-brand-blue rounded-full opacity-40 animate-ping"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute bottom-1/3 left-1/5 w-1.5 h-1.5 bg-brand-pink rounded-full opacity-50 animate-ping"
        style={{ animationDelay: "2.5s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-brand-lime rounded-full opacity-30 animate-ping"
        style={{ animationDelay: "3s" }}
      />
    </div>
  </>
);

const Header = ({
  isDarkMode,
  onSignIn,
  onNewChat,
  onLogout,
  onToggleDarkMode,
  onLogoClick,
  appLoaded,
  isLoggedIn,
  signInClicked,
}: {
  isDarkMode: boolean;
  onSignIn: () => void;
  onNewChat: () => void;
  onLogout: () => void;
  onToggleDarkMode: () => void;
  onLogoClick: () => void;
  appLoaded: boolean;
  isLoggedIn: boolean;
  signInClicked: boolean;
}) => (
  <header
    className="absolute top-0 left-0 right-0 flex justify-between items-center p-8 max-sm:p-3 z-20 transition-all duration-1000 ease-out"
    style={{
      opacity: appLoaded ? 1 : 0,
      transform: appLoaded ? "translateY(0)" : "translateY(-20px)",
      transitionDelay: "0.8s",
    }}
  >
    <div className="flex items-center gap-4">
      <button
        onClick={onLogoClick}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
        aria-label="Home"
      >
        <div className="w-30 h-12 bg-transparent rounded-xl flex items-center justify-center hover:opacity-80 transition max-sm:w-12 max-sm:h-12">
          {/* Responsive logo: favicon for mobile, main logo for desktop */}
          <img
            src={typeof window !== 'undefined' && window.innerWidth <= 640 ? "/Browser-tab.svg" : "/default-monochrome.svg"}
            alt="Logo"
            className="w-30 h-12 max-sm:w-12 max-sm:h-12 object-contain"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>
      </button>
    </div>
    <div className="flex items-center gap-4 max-sm:gap-2">
      <button
        onClick={onToggleDarkMode}
        className="p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 max-sm:p-2"
        style={{
          backgroundColor: isDarkMode
            ? "rgba(172, 127, 244, 0.1)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDarkMode ? "#AC7FF4" : "rgba(172, 127, 244, 0.3)",
          color: isDarkMode ? "#f1f5f9" : "#1e293b",
        }}
        aria-label="Toggle dark mode"
      >
        {!isDarkMode ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" />
          </svg>
        )}
      </button>
      {!isLoggedIn ? (
        <button
          onClick={onSignIn}
          className="px-6 py-3 bg-brand-purple text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 max-sm:px-3 max-sm:py-2 max-sm:text-sm"
          style={{
            transform: signInClicked
              ? "scale(0.95) translateY(2px)"
              : "translateY(-2px)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          Sign In
        </button>
      ) : (
        <div className="flex items-center gap-4 max-sm:gap-2">
          <button
            onClick={onNewChat}
            className="px-6 py-3 bg-brand-blue text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 max-sm:px-3 max-sm:py-2 max-sm:text-sm"
          >
            Chat
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-3 border-2 border-brand-purple rounded-xl hover:bg-brand-purple hover:text-white transition-all duration-300 max-sm:px-2 max-sm:py-2 max-sm:text-sm"
            style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  </header>
);

const LoginModal = ({
  show,
  isDarkMode,
  loginForm,
  onClose,
  onLogin,
  onOpenSignup,
  onInputChange,
  onGoogleLogin,
}: {
  show: boolean;
  isDarkMode: boolean;
  loginForm: LoginForm;
  onClose: () => void;
  onLogin: (e: React.FormEvent) => void;
  onOpenSignup: () => void;
  onInputChange: (field: keyof LoginForm, value: string) => void;
  onGoogleLogin: () => void;
}) => {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300"
      style={{
        backgroundColor: isDarkMode
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(0, 0, 0, 0.6)",
        opacity: show ? 1 : 0,
      }}
    >
      <div
        className="border rounded-3xl p-10 w-full max-w-lg relative shadow-2xl transition-all duration-500"
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
          borderColor: isDarkMode ? "#AC7FF4" : "rgba(172, 127, 244, 0.3)",
          transform: show
            ? "scale(1) translateY(0) rotateX(0deg)"
            : "scale(0.8) translateY(30px) rotateX(10deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 hover:scale-110 transition-all duration-200"
          style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <div className="text-center mb-10">
          <h3
            className="text-4xl font-bold mb-4 transition-colors duration-500"
            style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
          >
            Welcome Back
          </h3>
          <p
            className="text-lg transition-colors duration-500"
            style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
          >
            Sign in to continue your mental health journey
          </p>
        </div>

        <form onSubmit={onLogin} className="space-y-8">
          <div>
            <label
              className="block text-sm font-semibold mb-3 transition-colors duration-500"
              style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
            >
              Email
            </label>
            <input
              value={loginForm.username}
              onChange={(e) => onInputChange("username", e.target.value)}
              type="email"
              required
              className="w-full px-5 py-4 border-2 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:border-brand-blue focus:scale-105"
              style={{
                backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                borderColor: isDarkMode
                  ? "#AC7FF4"
                  : "rgba(172, 127, 244, 0.3)",
                color: isDarkMode ? "#f1f5f9" : "#1e293b",
              }}
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-3 transition-colors duration-500"
              style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
            >
              Password
            </label>
            <input
              value={loginForm.password}
              onChange={(e) => onInputChange("password", e.target.value)}
              type="password"
              required
              className="w-full px-5 py-4 border-2 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:border-brand-blue focus:scale-105"
              style={{
                backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                borderColor: isDarkMode
                  ? "#AC7FF4"
                  : "rgba(172, 127, 244, 0.3)",
                color: isDarkMode ? "#f1f5f9" : "#1e293b",
              }}
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
          >
            Sign In
          </button>
        </form>
        <button
          onClick={onGoogleLogin}
          className="w-full mt-4 py-3 bg-white text-slate-800 border border-gray-300 rounded-xl font-semibold shadow hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-6 h-6"
          />
          Sign in with Google
        </button>

        <div className="text-center mt-8">
          <p
            className="text-lg transition-colors duration-500"
            style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
          >
            <span>Don't have an account? </span>
            <button
              onClick={onOpenSignup}
              className="text-brand-blue hover:underline font-semibold transition-all duration-200 hover:scale-105"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const SignupModal = ({
  show,
  isDarkMode,
  signupForm,
  onClose,
  onSignup,
  onBackToLogin,
  onInputChange,
  onGoogleSignup,
  showTerms,
  setShowTerms,
  showPrivacy,
  setShowPrivacy,
}: {
  show: boolean;
  isDarkMode: boolean;
  signupForm: SignupForm;
  onClose: () => void;
  onSignup: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
  onInputChange: (field: keyof SignupForm, value: string) => void;
  onGoogleSignup: () => void;
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;
  showPrivacy: boolean;
  setShowPrivacy: (show: boolean) => void;
}) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300"
      style={{
        backgroundColor: isDarkMode
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(0, 0, 0, 0.6)",
        opacity: show ? 1 : 0,
      }}
    >
      <div
        className="border rounded-3xl p-10 w-full max-w-lg relative shadow-2xl max-h-[90vh] overflow-y-auto transition-all duration-500"
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
          borderColor: isDarkMode ? "#AC7FF4" : "rgba(172, 127, 244, 0.3)",
          transform: show
            ? "scale(1) translateY(0) rotateX(0deg)"
            : "scale(0.8) translateY(30px) rotateX(10deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 hover:scale-110 transition-all duration-200"
          style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <div className="text-center mb-10">
          <h3
            className="text-4xl font-bold mb-4 transition-colors duration-500"
            style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
          >
            Create Account
          </h3>
          <p
            className="text-lg transition-colors duration-500"
            style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
          >
            Join us and start your mental wellness journey
          </p>
        </div>

        <form onSubmit={onSignup} className="space-y-6">
          <div>
            <label
              className="block text-sm font-semibold mb-3 transition-colors duration-500"
              style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
            >
              Full Name
            </label>
            <input
              value={signupForm.signupName}
              onChange={(e) => onInputChange("signupName", e.target.value)}
              type="text"
              required
              className="w-full px-5 py-4 border-2 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:border-brand-blue focus:scale-105"
              style={{
                backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                borderColor: isDarkMode
                  ? "#AC7FF4"
                  : "rgba(172, 127, 244, 0.3)",
                color: isDarkMode ? "#f1f5f9" : "#1e293b",
              }}
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-3 transition-colors duration-500"
              style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
            >
              Email
            </label>
            <input
              value={signupForm.signupEmail}
              onChange={(e) => onInputChange("signupEmail", e.target.value)}
              type="email"
              required
              className="w-full px-5 py-4 border-2 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:border-brand-blue focus:scale-105"
              style={{
                backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                borderColor: isDarkMode
                  ? "#AC7FF4"
                  : "rgba(172, 127, 244, 0.3)",
                color: isDarkMode ? "#f1f5f9" : "#1e293b",
              }}
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-3 transition-colors duration-500"
              style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
            >
              Password
            </label>
            <input
              value={signupForm.signupPassword}
              onChange={(e) => onInputChange("signupPassword", e.target.value)}
              type="password"
              required
              className="w-full px-5 py-4 border-2 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:border-brand-blue focus:scale-105"
              style={{
                backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                borderColor: isDarkMode
                  ? "#AC7FF4"
                  : "rgba(172, 127, 244, 0.3)",
                color: isDarkMode ? "#f1f5f9" : "#1e293b",
              }}
              placeholder="Create a password"
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-3 transition-colors duration-500"
              style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
            >
              Confirm Password
            </label>
            <input
              value={signupForm.signupConfirmPassword}
              onChange={(e) =>
                onInputChange("signupConfirmPassword", e.target.value)
              }
              type="password"
              required
              className="w-full px-5 py-4 border-2 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:border-brand-blue focus:scale-105"
              style={{
                backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                borderColor: isDarkMode
                  ? "#AC7FF4"
                  : "rgba(172, 127, 244, 0.3)",
                color: isDarkMode ? "#f1f5f9" : "#1e293b",
              }}
              placeholder="Confirm your password"
            />
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              required
              className="mt-1 w-5 h-5 text-brand-purple border-2 border-brand-purple/30 rounded focus:ring-brand-blue"
            />
            <p
              className="text-sm transition-colors duration-500"
              style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
            >
              <span>I agree to the </span>
              <button
                type="button"
                className="text-brand-blue hover:underline"
                onClick={() => setShowTerms(true)}
              >
                Terms of Service
              </button>
              <span> and </span>
              <button
                type="button"
                className="text-brand-blue hover:underline"
                onClick={() => setShowPrivacy(true)}
              >
                Privacy Policy
              </button>
            </p>
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-brand-lime to-lime-400 text-slate-800 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
          >
            Create Account
          </button>
        </form>
        <button
          onClick={onGoogleSignup}
          className="w-full mt-4 py-3 bg-white text-slate-800 border border-gray-300 rounded-xl font-semibold shadow hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-6 h-6"
          />
          Sign up with Google
        </button>

        <div className="text-center mt-8">
          <p
            className="text-lg transition-colors duration-500"
            style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
          >
            <span>Already have an account? </span>
            <button
              onClick={onBackToLogin}
              className="text-brand-blue hover:underline font-semibold transition-all duration-200 hover:scale-105"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const NewChatModal = ({
  show,
  isDarkMode,
  onClose,
}: {
  show: boolean;
  isDarkMode: boolean;
  onClose: () => void;
}) => {
  if (!show) return null;

  const chatOptions = [
    {
      title: "Feeling Anxious",
      description: "Let's work through your anxiety together",
      color: "brand-purple",
    },
    {
      title: "Need Motivation",
      description: "Get inspired and find your drive",
      color: "brand-blue",
    },
    {
      title: "Feeling Sad",
      description: "Share what's on your mind",
      color: "brand-pink",
    },
    {
      title: "General Chat",
      description: "Open conversation",
      color: "brand-lime",
    },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300"
      style={{
        backgroundColor: isDarkMode
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(0, 0, 0, 0.6)",
        opacity: show ? 1 : 0,
      }}
    >
      <div
        className="border rounded-3xl p-8 w-full max-w-2xl relative shadow-2xl transition-all duration-500"
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
          borderColor: isDarkMode ? "#AC7FF4" : "rgba(172, 127, 244, 0.3)",
          transform: show
            ? "scale(1) translateY(0)"
            : "scale(0.9) translateY(20px)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 transition-colors"
          style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <h3
            className="text-3xl font-bold mb-3 transition-colors duration-500"
            style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
          >
            Start Chatting
          </h3>
          <p
            className="transition-colors duration-500"
            style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
          >
            How are you feeling today? Let's talk about it.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            {chatOptions.map((option, index) => (
              <button
                key={index}
                className="p-4 border-2 rounded-xl text-left hover:transform hover:scale-105 shadow-lg transition-all duration-300"
                style={{
                  backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                  borderColor: `rgba(${option.color === "brand-purple" ? "172, 127, 244" : option.color === "brand-blue" ? "24, 180, 244" : option.color === "brand-pink" ? "239, 178, 203" : "202, 248, 41"}, 0.3)`,
                }}
                onMouseEnter={(e) => {
                  const colors = {
                    "brand-purple": "#AC7FF4",
                    "brand-blue": "#18B4F4",
                    "brand-pink": "#EFB2CB",
                    "brand-lime": "#CAF829",
                  };
                  (e.target as HTMLElement).style.backgroundColor =
                    colors[option.color as keyof typeof colors];
                  (e.target as HTMLElement).style.color =
                    option.color === "brand-lime" ? "#1e293b" : "white";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = isDarkMode
                    ? "#0f172a"
                    : "#ffffff";
                  (e.target as HTMLElement).style.color = "";
                }}
              >
                <div
                  className="font-semibold transition-colors duration-500"
                  style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
                >
                  {option.title}
                </div>
                <div
                  className="text-sm transition-colors duration-500"
                  style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
                >
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Index() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode, setDarkMode } = useDarkMode();

  const [authState, setAuth] = useState<AuthState>({
    showLogin: false,
    showSignup: false,
    isLoggedIn: false,
    showNewChat: false,
    appLoaded: false,
    signInClicked: false,
  });

  const [loginForm, setLoginForm] = useState<LoginForm>({
    username: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState<SignupForm>({
    signupEmail: "",
    signupPassword: "",
    signupConfirmPassword: "",
    signupName: "",
  });

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    // Remove forced setDarkMode(false) and localStorage.clear from here
    // Only listen for auth state changes and set appLoaded
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuth((prev) => ({ ...prev, isLoggedIn: !!user }));
    });
    const timer = setTimeout(() => {
      setAuth((prev) => ({ ...prev, appLoaded: true }));
    }, 100);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const handleSignInClick = () => {
    setAuth((prev) => ({ ...prev, signInClicked: true }));
    setTimeout(() => {
      setAuth((prev) => ({ ...prev, showLogin: true, signInClicked: false }));
    }, 200);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(
        auth,
        loginForm.username,
        loginForm.password,
      );
      setAuth((prev) => ({ ...prev, isLoggedIn: true, showLogin: false }));
      setLoginForm({ username: "", password: "" });
    } catch (err) {
      alert("Login failed: " + (err as Error).message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      signupForm.signupEmail &&
      signupForm.signupPassword &&
      signupForm.signupConfirmPassword &&
      signupForm.signupName &&
      signupForm.signupPassword === signupForm.signupConfirmPassword
    ) {
      try {
        await createUserWithEmailAndPassword(
          auth,
          signupForm.signupEmail,
          signupForm.signupPassword,
        );
        setAuth((prev) => ({ ...prev, isLoggedIn: true, showSignup: false }));
        setSignupForm({
          signupEmail: "",
          signupPassword: "",
          signupConfirmPassword: "",
          signupName: "",
        });
      } catch (err) {
        alert("Signup failed: " + (err as Error).message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuth((prev) => ({ ...prev, isLoggedIn: false, showNewChat: false }));
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setAuth((prev) => ({ ...prev, isLoggedIn: true, showLogin: false }));
    } catch (err) {
      alert("Google sign-in failed: " + (err as Error).message);
    }
  };

  const handleNewChat = () => {
    if (authState.isLoggedIn) {
      setAuth((prev) => ({ ...prev, showNewChat: true }));
      navigate("/chat"); // Redirect to chat when starting new chat
    }
  };

  return (
    <div
      className="min-h-screen w-full font-poppins relative overflow-hidden transition-all duration-500"
      style={{
        background: isDarkMode
          ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
      }}
    >
      <AnimatedBackground isDarkMode={isDarkMode} />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          isDarkMode={isDarkMode}
          onSignIn={handleSignInClick}
          onNewChat={handleNewChat}
          onLogout={handleLogout}
          onToggleDarkMode={() => toggleDarkMode()}
          onLogoClick={() => navigate("/")}
          appLoaded={authState.appLoaded}
          isLoggedIn={authState.isLoggedIn}
          signInClicked={authState.signInClicked}
        />
        <main className="flex-1 flex items-center justify-center px-8 max-sm:px-2">
          <div className="text-center max-w-5xl mx-auto w-full">
            <div
              className="mb-16 transition-all duration-1200 ease-out"
              style={{
                opacity: authState.appLoaded ? 1 : 0,
                transform: authState.appLoaded
                  ? "translateY(0) scale(1)"
                  : "translateY(50px) scale(0.9)",
                transitionDelay: "0.3s",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div className="relative mb-12 max-sm:mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-purple via-brand-blue to-brand-pink rounded-3xl blur-2xl opacity-20 animate-pulse max-sm:rounded-xl" />
                <h2
                  className="relative text-9xl font-bold mb-8 leading-tight max-lg:text-7xl max-sm:text-4xl max-sm:mb-4 bg-gradient-to-r bg-clip-text transition-all duration-500"
                  style={{
                    color: isDarkMode ? "#f1f5f9" : "#1e293b",
                    wordBreak: 'break-word',
                  }}
                >
                  Companion AI
                </h2>
              </div>
              <div className="relative mb-12 max-sm:mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-purple to-brand-blue rounded-2xl blur-xl opacity-10 max-sm:rounded-lg" />
                <p
                  className="relative text-3xl max-w-4xl mx-auto max-lg:text-2xl max-sm:text-lg font-medium rounded-2xl p-8 max-sm:p-4 duration-500"
                  style={{
                    color: isDarkMode ? "#cbd5e1" : "#475569",
                  }}
                >
                  Your AI-powered mental health companion
                </p>
              </div>
            </div>
            <div
              className="transition-all duration-1000 ease-out"
              style={{
                opacity: authState.appLoaded ? 1 : 0,
                transform: authState.appLoaded
                  ? "translateY(0)"
                  : "translateY(20px)",
                transitionDelay: "1s",
              }}
            >
              {!authState.isLoggedIn ? (
                <button
                  onClick={handleSignInClick}
                  className="inline-flex items-center px-16 py-5 bg-gradient-to-r from-brand-purple to-brand-blue text-white text-2xl font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 max-sm:px-6 max-sm:py-3 max-sm:text-lg"
                  style={{
                    transform: authState.signInClicked
                      ? "scale(0.95)"
                      : "scale(1)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <span>Start Chatting </span>
                </button>
              ) : (
                <div className="text-center">
                  <button
                    onClick={handleNewChat}
                    className="inline-flex items-center px-16 py-5 bg-gradient-to-r from-brand-purple to-brand-blue text-white text-2xl font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 max-sm:px-6 max-sm:py-3 max-sm:text-lg hover:transform hover:scale-105"
                  >
                    <span>Start Chatting </span>
                    <svg
                      className="w-7 h-7 ml-4 max-sm:w-5 max-sm:h-5 max-sm:ml-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <LoginModal
        show={authState.showLogin}
        isDarkMode={isDarkMode}
        loginForm={loginForm}
        onClose={() => setAuth((prev) => ({ ...prev, showLogin: false }))}
        onLogin={handleLogin}
        onOpenSignup={() => {
          setAuth((prev) => ({ ...prev, showLogin: false }));
          setTimeout(() => {
            setAuth((prev) => ({ ...prev, showSignup: true }));
          }, 150);
        }}
        onInputChange={(field, value) =>
          setLoginForm((prev) => ({ ...prev, [field]: value }))
        }
        onGoogleLogin={handleGoogleLogin}
      />
      <SignupModal
        show={authState.showSignup}
        isDarkMode={isDarkMode}
        signupForm={signupForm}
        onClose={() => setAuth((prev) => ({ ...prev, showSignup: false }))}
        onSignup={handleSignup}
        onBackToLogin={() => {
          setAuth((prev) => ({ ...prev, showSignup: false }));
          setTimeout(() => {
            setAuth((prev) => ({ ...prev, showLogin: true }));
          }, 150);
        }}
        onInputChange={(field, value) =>
          setSignupForm((prev) => ({ ...prev, [field]: value }))
        }
        onGoogleSignup={handleGoogleLogin}
        showTerms={showTerms}
        setShowTerms={setShowTerms}
        showPrivacy={showPrivacy}
        setShowPrivacy={setShowPrivacy}
      />
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-auto relative max-sm:p-3 max-sm:max-w-xs">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white max-sm:top-2 max-sm:right-2"
              onClick={() => setShowTerms(false)}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center max-sm:text-lg">Terms of Service</h2>
            <div className="overflow-y-auto max-h-96 text-gray-700 dark:text-gray-200 max-sm:max-h-60 text-sm">
              <div className="space-y-4 text-left">
                <div>
                  <strong>TERMS OF SERVICE (TOS)</strong>
                  <br />
                  <span>Effective Date: July 5, 2025</span>
                  <br />
                  <span>App Name: Companion AI</span>
                  <br />
                  <span>Developer: Atishay Shukla</span>
                </div>
                <div>
                  <strong>1. Acceptance of Terms</strong>
                  <br />
                  By using Companion AI (the “App”), you agree to these Terms.
                  If you do not agree, please do not use the App.
                </div>
                <div>
                  <strong>2. Purpose of the App</strong>
                  <br />
                  Companion AI is an AI-powered tool to support emotional
                  well-being and mental health awareness. It is not a
                  professional medical or therapeutic service.
                </div>
                <div>
                  <strong>3. User Content</strong>
                  <br />
                  By using this app, you may submit:
                  <br />
                  <ul className="list-disc ml-6">
                    <li>Text messages</li>
                    <li>Images for emotion detection</li>
                  </ul>
                  You keep ownership of your content, but you allow me (the
                  developer) to:
                  <br />
                  <ul className="list-disc ml-6">
                    <li>
                      Store and process your data for better app functionality
                    </li>
                    <li>
                      Use anonymized data to train and improve the AI model
                    </li>
                  </ul>
                  <span className="text-yellow-700 dark:text-yellow-400 font-semibold">
                    Note:
                  </span>{" "}
                  This means your images and messages might be used to improve
                  the AI in the future — but they’ll never be linked to your
                  name or account.
                </div>
                <div>
                  <strong>4. User Responsibilities</strong>
                  <br />
                  Don’t upload harmful, violent, or illegal content.
                  <br />
                  Don’t use this app for crisis help — it’s not a substitute for
                  a therapist or counselor.
                </div>
                <div>
                  <strong>5. AI Limitations</strong>
                  <br />
                  The AI tries to help — but it’s not always right. It’s still
                  learning. If you’re going through something serious, please
                  talk to someone or reach out for real human support.
                </div>
                <div>
                  <strong>6. Account & Data</strong>
                  <br />
                  Firebase Authentication is used to secure your account.
                  <br />
                  Your messages and photos are stored securely using Firebase
                  Firestore and Storage.
                </div>
                <div>
                  <strong>7. Termination</strong>
                  <br />
                  If you break the rules or abuse the app, your access may be
                  removed.
                </div>
                <div>
                  <strong>8. Changes to Terms</strong>
                  <br />
                  These terms might be updated in the future. Any big changes
                  will be announced in-app.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-auto relative max-sm:p-3 max-sm:max-w-xs">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white max-sm:top-2 max-sm:right-2"
              onClick={() => setShowPrivacy(false)}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center max-sm:text-lg">Privacy Policy</h2>
            <div className="overflow-y-auto max-h-96 text-gray-700 dark:text-gray-200 max-sm:max-h-60 text-sm">
              <div className="space-y-4 text-left">
                <div>
                  <strong>PRIVACY POLICY</strong>
                  <br />
                  <span>Effective Date: July 5, 2025</span>
                  <br />
                  <span>App Name: Companion AI</span>
                  <br />
                  <span>Developer: Atishay Shukla</span>
                </div>
                <div>
                  <strong>1. Information We Collect</strong>
                  <br />
                  We collect information to provide better services to all our
                  users. The information we collect includes:
                  <br />
                  <ul className="list-disc ml-6">
                    <li>Personal information you provide when signing up</li>
                    <li>
                      Content you create or upload while using the app (e.g., text
                      messages, images)
                    </li>
                    <li>
                      Usage data, such as your interactions with the app and
                      device information
                    </li>
                  </ul>
                </div>
                <div>
                  <strong>2. How We Use Your Information</strong>
                  <br />
                  We use the information we collect for the following purposes:
                  <br />
                  <ul className="list-disc ml-6">
                    <li>To provide and maintain our service</li>
                    <li>
                      To improve, personalize, and expand our service and
                      features
                    </li>
                    <li>
                      To understand and analyze how you use our app
                    </li>
                    <li>
                      To communicate with you, including for customer service
                      and support
                    </li>
                    <li>
                      To process your transactions and manage your orders
                    </li>
                    <li>
                      To send you emails or notifications about your account or
                      other products, services, and events that we offer
                    </li>
                    <li>
                      To detect, prevent, and address technical issues or
                      fraudulent activities
                    </li>
                    <li>
                      To comply with legal obligations and protect our rights
                    </li>
                  </ul>
                </div>
                <div>
                  <strong>3. How We Share Your Information</strong>
                  <br />
                  We do not sell or rent your personal information to third
                  parties. We may share your information in the following
                  situations:
                  <br />
                  <ul className="list-disc ml-6">
                    <li>
                      With service providers, business partners, and other third
                      parties who perform services on our behalf or assist us in
                      operating our app, conducting our business, or servicing
                      you
                    </li>
                    <li>
                      With your consent or at your direction, such as when you
                      choose to share your content with others
                    </li>
                    <li>
                      To comply with legal obligations, respond to subpoenas,
                      court orders, or other legal processes, or to establish or
                      exercise our legal rights or defend against legal claims
                    </li>
                    <li>
                      In connection with a merger, sale of assets, financing, or
                      acquisition of all or a portion of our business by another
                      company
                    </li>
                    <li>
                      With affiliates, in which case we will require those
                      affiliates to honor this Privacy Policy
                    </li>
                  </ul>
                </div>
                <div>
                  <strong>4. Data Security</strong>
                  <br />
                  We take reasonable measures to help protect information about
                  you from loss, theft, and misuse, as well as unauthorized
                  access, disclosure, alteration, and destruction. However, no
                  internet or electronic storage method can be 100% secure, so
                  we cannot guarantee its absolute security.
                </div>
                <div>
                  <strong>5. Your Rights and Choices</strong>
                  <br />
                  You have certain rights and choices regarding your personal
                  information, including:
                  <br />
                  <ul className="list-disc ml-6">
                    <li>
                      The right to access, update, or delete the information we
                      have about you
                    </li>
                    <li>
                      The right to rectification, allowing you to request the
                      correction of inaccurate or incomplete personal data
                    </li>
                    <li>
                      The right to object to or restrict the processing of your
                      personal data
                    </li>
                    <li>
                      The right to data portability, allowing you to request a
                      copy of your personal data in a structured, commonly used,
                      and machine-readable format
                    </li>
                    <li>
                      The right to withdraw consent, where we rely on your
                      consent to process your personal data
                    </li>
                    <li>
                      The right to complain to a data protection authority about
                      our collection and use of your personal data
                    </li>
                  </ul>
                </div>
                <div>
                  <strong>6. Changes to This Privacy Policy</strong>
                  <br />
                  We may update our Privacy Policy from time to time. We will
                  notify you of any changes by posting the new Privacy Policy on
                  this page and updating the effective date at the top of this
                  policy. You are advised to review this Privacy Policy
                  periodically for any changes. Changes to this Privacy Policy
                  are effective when they are posted on this page.
                </div>
                <div>
                  <strong>7. Contact Us</strong>
                  <br />
                  If you have any questions or concerns about this Privacy Policy
                  or our data practices, please contact us at:
                  <br />
                  <span className="font-semibold">Your Name</span>
                  <br />
                  Email:{" "}
                  <a
                    href="mailto:contact@example.com"
                    className="text-brand-blue hover:underline"
                  >
                    atishayshukla2003@gmail.com
                  </a>
                  <br />
                  This privacy policy was created with the help of{" "}
                  <a
                    href="https://www.privacypolicygenerator.info/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue hover:underline"
                  >
                    Privacy Policy Generator
                  </a>
                  .
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
