import { auth as firebaseAuth } from "../firebase";
import {
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { db } from "../firebase";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import React from "react";
import Cropper from "react-easy-crop";
// @ts-ignore
import getCroppedImg from "../lib/cropUtils";
import { Dialog, DialogContent, DialogOverlay } from "../components/ui/dialog";
import "react-easy-crop/react-easy-crop.css";
import { sendContactEmail } from "../lib/emailjs";
import MentalHealthNotifications from "../components/MentalHealthNotifications";
import { mentalHealthScheduler } from "../utils/mentalHealthScheduler";

interface AccountState {
  isDarkMode: boolean;
  profile: {
    name: string;
    email: string;
    joinedDate: string;
    avatar: string;
  };
  settings: {
    notifications: boolean;
    darkMode: boolean;
    privacy: boolean;
  };
}

const AnimatedBackground = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <>
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-radial from-brand-purple to-transparent rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute top-40 right-32 w-80 h-80 bg-gradient-radial from-brand-blue to-transparent rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-32 left-1/3 w-72 h-72 bg-gradient-radial from-brand-pink to-transparent rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />
    </div>
  </>
);

const Header = ({
  isDarkMode,
  onToggleDarkMode,
  onBackToChat,
}: {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onBackToChat: () => void;
}) => (
  <header
    className="border-b backdrop-blur-sm sticky top-0 z-50"
    style={{
      backgroundColor: isDarkMode
        ? "rgba(30, 41, 59, 0.8)"
        : "rgba(255, 255, 255, 0.8)",
      borderColor: isDarkMode
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
    }}
  >
    <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
      <button
        onClick={onBackToChat}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-opacity-80 transition-all duration-300"
        style={{
          backgroundColor: isDarkMode
            ? "rgba(172, 127, 244, 0.1)"
            : "rgba(172, 127, 244, 0.05)",
        }}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
        >
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        <span
          className="font-medium"
          style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
        >
          Back to Chat
        </span>
      </button>

      <div className="flex items-center gap-4">
        <h1
          className="text-xl font-semibold"
          style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
        >
          Account
        </h1>
      </div>

      <button
        onClick={onToggleDarkMode}
        className="p-2 rounded-xl border-2 transition-all duration-300 hover:scale-105"
        style={{
          backgroundColor: isDarkMode
            ? "rgba(172, 127, 244, 0.1)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDarkMode ? "#AC7FF4" : "rgba(172, 127, 244, 0.3)",
          color: isDarkMode ? "#f1f5f9" : "#1e293b",
        }}
      >
        {!isDarkMode ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" />
          </svg>
        )}
      </button>
    </div>
  </header>
);

const ProfileCard = ({
  profile,
  isDarkMode,
  onEdit,
}: {
  profile: AccountState["profile"];
  isDarkMode: boolean;
  onEdit: () => void;
}) => (
  <div
    className="rounded-3xl p-8 shadow-2xl backdrop-blur-sm border transition-all duration-500"
    style={{
      backgroundColor: isDarkMode
        ? "rgba(30, 41, 59, 0.6)"
        : "rgba(255, 255, 255, 0.8)",
      borderColor: isDarkMode
        ? "rgba(172, 127, 244, 0.3)"
        : "rgba(172, 127, 244, 0.2)",
    }}
  >
    <div className="flex items-center justify-between mb-6">
      <h2
        className="text-2xl font-bold"
        style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
      >
        Profile
      </h2>
      <button
        onClick={onEdit}
        className="px-4 py-2 rounded-xl border-2 hover:bg-brand-purple hover:text-white transition-all duration-300"
        style={{
          borderColor: "#AC7FF4",
          color: isDarkMode ? "#f1f5f9" : "#1e293b",
        }}
      >
        Edit
      </button>
    </div>
    <div className="flex items-start gap-6">
      <div className="w-20 h-20 bg-gradient-to-br from-brand-purple to-brand-blue rounded-full flex items-center justify-center shadow-lg">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt="avatar"
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <svg
            className="w-10 h-10 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
        >
          {profile.name || "Anonymous User"}
        </h3>
        <p
          className="mb-2"
          style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
        >
          {profile.email}
        </p>
        <p
          className="text-sm"
          style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
        >
          Member since {profile.joinedDate}
        </p>
      </div>
    </div>
  </div>
);

const SettingsCard = ({
  settings,
  isDarkMode,
  onSettingChange,
}: {
  settings: AccountState["settings"];
  isDarkMode: boolean;
  onSettingChange: (
    key: keyof AccountState["settings"],
    value: boolean,
  ) => void;
}) => (
  <div
    className="rounded-3xl p-8 shadow-2xl backdrop-blur-sm border transition-all duration-500"
    style={{
      backgroundColor: isDarkMode
        ? "rgba(30, 41, 59, 0.6)"
        : "rgba(255, 255, 255, 0.8)",
      borderColor: isDarkMode
        ? "rgba(172, 127, 244, 0.3)"
        : "rgba(172, 127, 244, 0.2)",
    }}
  >
    <h2
      className="text-2xl font-bold mb-6"
      style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
    >
      Settings
    </h2>

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="font-semibold"
            style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
          >
            Notifications
          </h3>
          <p
            className="text-sm"
            style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
          >
            Receive mental health advice every 3 days and wellness tips
          </p>
        </div>
        <button
          onClick={() =>
            onSettingChange("notifications", !settings.notifications)
          }
          className={`w-12 h-6 rounded-full transition-all duration-300 ${
            settings.notifications ? "bg-brand-purple" : "bg-gray-300"
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
              settings.notifications ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3
            className="font-semibold"
            style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
          >
            Dark Mode
          </h3>
          <p
            className="text-sm"
            style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
          >
            Switch between light and dark themes
          </p>
        </div>
        <button
          onClick={() => onSettingChange("darkMode", !isDarkMode)}
          className={`w-12 h-6 rounded-full transition-all duration-300 ${
            isDarkMode ? "bg-brand-purple" : "bg-gray-300"
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
              isDarkMode ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3
            className="font-semibold"
            style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
          >
            Privacy Mode
          </h3>
          <p
            className="text-sm"
            style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
          >
            Enhanced privacy for sensitive conversations
          </p>
        </div>
        <button
          onClick={() => onSettingChange("privacy", !settings.privacy)}
          className={`w-12 h-6 rounded-full transition-all duration-300 ${
            settings.privacy ? "bg-brand-purple" : "bg-gray-300"
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
              settings.privacy ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  </div>
);

const ActionsCard = ({
  isDarkMode,
  onLogout,
  onClearConversations,
}: {
  isDarkMode: boolean;
  onLogout: () => void;
  onClearConversations: () => void;
}) => (
  <div
    className="rounded-3xl p-8 shadow-2xl backdrop-blur-sm border transition-all duration-500"
    style={{
      backgroundColor: isDarkMode
        ? "rgba(30, 41, 59, 0.6)"
        : "rgba(255, 255, 255, 0.8)",
      borderColor: isDarkMode
        ? "rgba(172, 127, 244, 0.3)"
        : "rgba(172, 127, 244, 0.2)",
    }}
  >
    <h2
      className="text-2xl font-bold mb-6"
      style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
    >
      Actions
    </h2>
    <div className="space-y-4">
      <button
        onClick={onClearConversations}
        className="w-full p-4 rounded-xl border-2 border-brand-pink text-brand-pink hover:bg-brand-pink hover:text-white transition-all duration-300 font-medium"
        style={{ fontSize: "1rem" }}
      >
        Clear All Conversations
      </button>
      <button
        onClick={onLogout}
        className="w-full p-4 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 font-medium"
        style={{ fontSize: "1rem" }}
      >
        Sign Out
      </button>
    </div>
  </div>
);

const ContactUsCard = ({
  isDarkMode,
  userProfile,
}: {
  isDarkMode: boolean;
  userProfile: { name: string; email: string };
}) => {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setError("");
    setSent(false);
    if (!message.trim()) {
      setError("Please enter your enquiry message.");
      return;
    }

    setSending(true);
    try {
      await sendContactEmail({
        user_name: userProfile.name || "Anonymous User",
        user_email: userProfile.email || "no-email@example.com",
        message: message.trim(),
      });
      setSent(true);
      setMessage(""); // Clear the message after successful send
    } catch (err) {
      console.error("Failed to send email:", err);
      setError("Failed to send enquiry. Please try again later.");
    } finally {
      setSending(false);
    }
  };
  return (
    <div
      className="rounded-3xl p-8 shadow-2xl backdrop-blur-sm border transition-all duration-500"
      style={{
        backgroundColor: isDarkMode
          ? "rgba(30, 41, 59, 0.6)"
          : "rgba(255, 255, 255, 0.8)",
        borderColor: isDarkMode
          ? "rgba(172, 127, 244, 0.3)"
          : "rgba(172, 127, 244, 0.2)",
      }}
    >
      <h2
        className="text-2xl font-bold mb-6"
        style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
      >
        Contact Us
      </h2>
      <p
        className="mb-4 text-sm"
        style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
      >
        For any enquiry, send us a message below. We'll send it directly to{" "}
        <span className="font-semibold">hello.companion@gmail.com</span>.
      </p>
      <textarea
        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-purple bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white mb-4"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your enquiry here..."
        disabled={sending}
      />
      {error && (
        <div className="mb-2 p-2 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {sent && (
        <div className="mb-2 p-2 bg-green-100 text-green-700 rounded-lg">
          Enquiry sent successfully!
        </div>
      )}
      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="px-4 py-2 rounded-xl border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? "Sending..." : "Send Enquiry"}
      </button>
    </div>
  );
};

export default function Account() {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AccountState>({
    isDarkMode: isDarkMode,
    profile: {
      name: "",
      email: "",
      joinedDate: "",
      avatar: "",
    },
    settings: {
      notifications: true,
      darkMode: isDarkMode,
      privacy: false,
    },
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  // Add state for cropping
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lastProgressTs, setLastProgressTs] = useState<number | null>(null);

  useEffect(() => {
    // Load user info from Firebase Auth
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in
          let avatarUrl = "";

          // Check Firestore first for avatar (since we store uploaded avatars there)
          try {
            const userDoc = doc(db, "users", firebaseUser.uid);
            const userSnap = await getDoc(userDoc);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              avatarUrl = userData.avatar || "";
            }
          } catch (e) {
            console.warn("Failed to load user data from Firestore:", e);
          }

          // Fallback to Firebase Auth photoURL if no Firestore avatar
          if (!avatarUrl) {
            avatarUrl = firebaseUser.photoURL || "";
          }

          const profileData = {
            name:
              firebaseUser.displayName ||
              firebaseUser.email ||
              "Anonymous User",
            email: firebaseUser.email || "",
            joinedDate: firebaseUser.metadata?.creationTime
              ? new Date(
                  firebaseUser.metadata.creationTime,
                ).toLocaleDateString()
              : "",
            avatar: avatarUrl,
          };

          setState((prev) => ({
            ...prev,
            profile: profileData,
          }));

          // Save user info to mental health scheduler for email notifications
          mentalHealthScheduler.setUserInfo(
            profileData.email,
            profileData.name,
          );

          setEditName(
            firebaseUser.displayName || firebaseUser.email || "Anonymous User",
          );
          setEditEmail(firebaseUser.email || "");
        } else {
          // User is signed out, redirect to login
          navigate("/");
        }
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Sync settings with actual dark mode state
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        darkMode: isDarkMode,
      },
    }));
  }, [isDarkMode]);

  useEffect(() => {
    // Sync mental health notifications with general notifications setting and scheduler state
    const isSchedulerEnabled = mentalHealthScheduler.isEnabled();
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, notifications: isSchedulerEnabled },
    }));
  }, []);

  useEffect(() => {
    // Listen for real-time avatar updates from Firestore
    const user = firebaseAuth.currentUser;
    if (!user) return;

    const userDoc = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDoc, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        if (userData.avatar) {
          setState((prev) => ({
            ...prev,
            profile: { ...prev.profile, avatar: userData.avatar },
          }));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setEditName(state.profile.name);
    setEditEmail(state.profile.email);
  }, [state.profile.name, state.profile.email]);

  useEffect(() => {
    // Show reset password if user signed up with email/password
    const user = firebaseAuth.currentUser;
    if (user && user.providerData.some((p) => p.providerId === "password")) {
      setShowResetPassword(true);
    } else {
      setShowResetPassword(false);
    }
  }, [state.profile.email]);

  const handleSettingChange = (
    key: keyof AccountState["settings"],
    value: boolean,
  ) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }));

    if (key === "darkMode") {
      toggleDarkMode();
      // Save dark mode preference to Firestore
      const user = firebaseAuth.currentUser;
      if (user) {
        const userDoc = doc(db, "users", user.uid);
        setDoc(userDoc, { darkMode: value }, { merge: true });
      }
      // Also persist to localStorage for instant reload
      window.localStorage.setItem("darkMode", value ? "true" : "false");
    } else if (key === "notifications") {
      // Enable/disable mental health scheduler based on notifications setting
      mentalHealthScheduler.setEnabled(value);
      console.log(
        `Mental health notifications ${value ? "enabled" : "disabled"}`,
      );
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth); // Actually sign out from Firebase
      await logout(); // Any additional app logic
      navigate("/");
    } catch (err) {
      alert(
        "Failed to sign out: " + ((err as Error).message || "Unknown error"),
      );
    }
  };

  const handleEdit = () => {
    setEditName(state.profile.name);
    setEditEmail(state.profile.email);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setSaveError("");
    setSaveSuccess("");
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("No user is logged in");
      // Update display name if changed
      if (editName && editName !== user.displayName) {
        await updateProfile(user, { displayName: editName });
      }
      // Update email if changed
      if (editEmail && editEmail !== user.email) {
        try {
          await updateEmail(user, editEmail);
        } catch (e: any) {
          if (e.code === "auth/requires-recent-login") {
            setSaveError(
              "Please sign out and sign back in, then retry changing your email.",
            );
            return;
          }
          throw e;
        }
      }
      // Firestore (ignore if permission denied)
      try {
        const userDoc = doc(db, "users", user.uid);
        await setDoc(
          userDoc,
          { name: editName, email: editEmail },
          { merge: true },
        );
      } catch (e: any) {
        if (e.code !== "permission-denied")
          console.warn("Firestore update failed", e);
      }
      setState((prev) => ({
        ...prev,
        profile: { ...prev.profile, name: editName, email: editEmail },
      }));
      setSaveSuccess("Profile updated successfully!");
      setEditOpen(false);
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "permission-denied") {
        setSaveError("Missing or insufficient permissions.");
      } else {
        setSaveError(err.message || "Failed to update profile");
      }
    }
  };

  const handleResetPassword = async () => {
    setSaveError("");
    setSaveSuccess("");
    const user = firebaseAuth.currentUser;
    if (!user) return;
    const email = user.email;
    if (!email) return;
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setSaveSuccess("Password reset email sent!");
    } catch (err) {
      setSaveError(
        (err as Error).message || "Failed to send password reset email",
      );
    }
  };

  const handleClearConversations = async () => {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("No user is logged in");
      if (
        !window.confirm(
          "Are you sure you want to clear all your chats? This cannot be undone.",
        )
      )
        return;
      const { doc, setDoc } = await import("firebase/firestore");
      const chatDocRef = doc(db, "chats", user.uid);
      await setDoc(chatDocRef, { messages: [] }, { merge: true });
      alert("All chats cleared!");
    } catch (err) {
      alert(
        "Failed to clear chats: " + ((err as Error).message || "Unknown error"),
      );
    }
  };

  return (
    <div
      className="min-h-screen w-full font-poppins relative account-page"
      style={{
        background: isDarkMode
          ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <style>{`
        .account-page, .account-page *, html, body { 
          scrollbar-width: none !important; 
          -ms-overflow-style: none !important; 
        }
        .account-page::-webkit-scrollbar, 
        .account-page *::-webkit-scrollbar,
        html::-webkit-scrollbar,
        body::-webkit-scrollbar { 
          display: none !important; 
          width: 0 !important; 
          background: transparent !important; 
        }
        textarea::-webkit-scrollbar { 
          display: none !important; 
          width: 0 !important; 
          background: transparent !important; 
        }
        textarea { 
          scrollbar-width: none !important; 
          -ms-overflow-style: none !important; 
        }
      `}</style>
      <AnimatedBackground isDarkMode={isDarkMode} />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onBackToChat={() => navigate("/chat")}
        />
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div
              className="text-lg"
              style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
            >
              Loading...
            </div>
          </div>
        ) : (
          <main className="flex-1 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
              <div
                className="text-center mb-12"
                style={{
                  opacity: 1,
                  transform: "translateY(0)",
                  transition: "all 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <h1
                  className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r bg-clip-text"
                  style={{ color: isDarkMode ? "#f1f5f9" : "#1e293b" }}
                >
                  Your Account
                </h1>
                <p
                  className="text-lg sm:text-xl"
                  style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                >
                  Manage your profile and preferences
                </p>
              </div>
              <div className="grid gap-6 sm:gap-8 max-w-2xl mx-auto">
                <ProfileCard
                  profile={state.profile}
                  isDarkMode={isDarkMode}
                  onEdit={handleEdit}
                />
                <SettingsCard
                  settings={state.settings}
                  isDarkMode={isDarkMode}
                  onSettingChange={handleSettingChange}
                />
                <ActionsCard
                  isDarkMode={isDarkMode}
                  onLogout={handleLogout}
                  onClearConversations={handleClearConversations}
                />
                <ContactUsCard
                  isDarkMode={isDarkMode}
                  userProfile={state.profile}
                />
                <MentalHealthNotifications className="w-full" />
              </div>
            </div>
          </main>
        )}
        {/* Edit Profile Modal */}
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              aria-hidden="true"
              onClick={() => setEditOpen(false)}
            />
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto z-50 relative">
              <div className="text-2xl font-bold mb-4 text-center">
                Edit Profile
              </div>
              {saveError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                  {saveSuccess}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEdit();
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-purple bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-purple bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                {/* Improved Profile Picture Upload UI and logic in Edit Profile Modal */}
                <div>
                  <label className="block font-medium mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4 mb-2">
                    {state.profile.avatar ? (
                      <img
                        src={state.profile.avatar}
                        alt="avatar"
                        className="w-16 h-16 rounded-full object-cover border-2 border-brand-purple shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center border-2 border-brand-purple shadow-lg">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      id="avatar-upload"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAvatarFile(file);
                        setCropping(true);
                        setSaveError("");
                        setSaveSuccess("");
                      }}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="px-4 py-2 rounded-xl border-2 border-brand-purple text-brand-purple bg-white dark:bg-slate-700 hover:bg-brand-purple hover:text-white font-semibold cursor-pointer transition-all duration-300"
                    >
                      Change
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    JPG, PNG, or GIF. Max 2MB.
                  </p>
                </div>
                <div className="flex gap-4 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white font-semibold"
                  >
                    Save
                  </button>
                </div>
              </form>
              {showResetPassword && (
                <button
                  onClick={handleResetPassword}
                  className="mt-6 w-full p-3 rounded-xl border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white font-semibold"
                >
                  Reset Password
                </button>
              )}
              {/* Cropper Modal using Radix Dialog */}
              <Dialog open={cropping} onOpenChange={setCropping}>
                <DialogOverlay className="fixed inset-0 bg-black/70 z-[90]" />
                <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl z-[100] flex flex-col items-center gap-4">
                  <div className="text-xl font-bold mb-4 text-center">
                    Crop Profile Picture
                  </div>
                  <div className="w-full h-96 relative mb-2 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                    {avatarFile ? (
                      <Cropper
                        image={URL.createObjectURL(avatarFile)}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_, area) => setCroppedAreaPixels(area)}
                        cropShape="round"
                        showGrid={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                        No image selected
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl border-2 border-brand-purple text-brand-purple bg-white dark:bg-slate-700 hover:bg-brand-purple hover:text-white font-semibold cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={uploadingAvatar || !avatarFile}
                      onClick={async () => {
                        if (!avatarFile || !croppedAreaPixels) return;

                        try {
                          console.log("[Avatar] Starting upload process");
                          setUploadingAvatar(true);
                          setUploadProgress(0);
                          setSaveError("");
                          setSaveSuccess("");

                          const user = firebaseAuth.currentUser;
                          if (!user) throw new Error("No authenticated user");

                          // Get cropped image
                          const objectUrl = URL.createObjectURL(avatarFile);
                          console.log("[Avatar] Getting cropped image...");
                          const croppedImageBlob = await getCroppedImg(
                            objectUrl,
                            croppedAreaPixels as any,
                          );

                          setUploadProgress(25);

                          // Convert to base64
                          console.log("[Avatar] Converting to base64...");
                          const canvas = document.createElement("canvas");
                          const ctx = canvas.getContext("2d");
                          const img = new Image();

                          await new Promise((resolve, reject) => {
                            img.onload = () => {
                              // Resize to smaller size (100x100) to reduce data size
                              canvas.width = 100;
                              canvas.height = 100;
                              ctx?.drawImage(img, 0, 0, 100, 100);
                              resolve(null);
                            };
                            img.onerror = reject;
                            img.src = croppedImageBlob;
                          });

                          setUploadProgress(50);

                          // Convert canvas to base64 with lower quality
                          const base64Image = canvas.toDataURL(
                            "image/jpeg",
                            0.6,
                          );
                          console.log(
                            "[Avatar] Base64 image size:",
                            base64Image.length,
                            "characters",
                          );

                          setUploadProgress(75);

                          // Save to Firestore only (Firebase Auth photoURL has size limits)
                          console.log("[Avatar] Saving to Firestore...");
                          const userDoc = doc(db, "users", user.uid);
                          await setDoc(
                            userDoc,
                            { avatar: base64Image },
                            { merge: true },
                          );

                          setUploadProgress(95);

                          // Update local state
                          setState((prev) => ({
                            ...prev,
                            profile: { ...prev.profile, avatar: base64Image },
                          }));

                          setUploadProgress(100);
                          setCropping(false);
                          setAvatarFile(null);
                          setSaveSuccess(
                            "Profile picture updated successfully!",
                          );

                          // Clean up URL
                          URL.revokeObjectURL(objectUrl);
                          console.log(
                            "[Avatar] Upload process completed successfully",
                          );
                        } catch (error: any) {
                          console.error("[Avatar] Upload failed:", error);
                          setSaveError(
                            `Failed to update profile picture: ${error.message || "Unknown error"}`,
                          );
                        } finally {
                          setUploadingAvatar(false);
                          setUploadProgress(null);
                        }
                      }}
                    >
                      {uploadingAvatar
                        ? uploadProgress !== null
                          ? `Uploading ${uploadProgress.toFixed(0)}%...`
                          : "Uploading..."
                        : "Save & Upload"}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700"
                      onClick={() => {
                        setCropping(false);
                        setAvatarFile(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
