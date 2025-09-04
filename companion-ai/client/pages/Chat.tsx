import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { db, auth as firebaseAuth } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { createPortal } from "react-dom";
import { apiChat, apiChatWithImage } from "../utils/api";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  imageUrl?: string; // Add imageUrl for image messages
}

interface ChatState {
  messages: Message[];
  inputValue: string;
  isTyping: boolean;
  pendingImage?: {
    file: File;
    preview: string;
  };
}

const HEADER_HEIGHT = 64; // px, adjust if needed
const MESSAGE_BAR_HEIGHT = 72; // px, adjust if needed (mobile may be less)

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
  onAccountClick,
  onHomeClick,
  userPFP,
}: {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onAccountClick: () => void;
  onHomeClick: () => void;
  userPFP?: string;
}) => (
  <header
    className="border-b backdrop-blur-sm sticky top-0 z-50 w-full"
    style={{
      backgroundColor: isDarkMode
        ? "rgba(30, 41, 59, 0.8)"
        : "rgba(255, 255, 255, 0.8)",
      borderColor: isDarkMode
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
    }}
  >
    <div className="flex items-center justify-between p-4 w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={onHomeClick}
          className="flex items-center gap-3 hover:scale-105 transition-all duration-300"
          type="button"
        >
          <div className="w-30 h-8 rounded-lg flex items-center justify-center">
            <img
              src={
                typeof window !== "undefined" && window.innerWidth <= 640
                  ? "/Browser-tab.svg"
                  : "/default-monochrome.svg"
              }
              alt="Companion AI Logo"
              className="w-30 h-8"
            />
          </div>
        </button>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
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
        <button
          onClick={onAccountClick}
          className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-lg flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300"
        >
          {userPFP ? (
            <img
              src={userPFP}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  </header>
);

const MessageBubble = ({
  message,
  isDarkMode,
  userPFP,
}: {
  message: Message;
  isDarkMode: boolean;
  userPFP?: string;
}) => (
  <div
    className={`flex ${
      message.sender === "user" ? "justify-end" : "justify-start"
    } mb-6 max-sm:mb-3`}
  >
    <div
      className={`flex items-start gap-3 max-w-[70%] ${
        message.sender === "user" ? "flex-row-reverse" : ""
      } max-sm:gap-2`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          message.sender === "user"
            ? "bg-gradient-to-br from-brand-purple to-brand-blue"
            : "bg-gradient-to-br from-brand-pink to-pink-400"
        } max-sm:w-6 max-sm:h-6`}
      >
        {message.sender === "user" && userPFP ? (
          <img
            src={userPFP}
            alt="avatar"
            className="w-7 h-7 rounded-full object-cover max-sm:w-5 max-sm:h-5"
          />
        ) : message.sender === "user" ? (
          <svg
            className="w-4 h-4 text-white max-sm:w-3 max-sm:h-3"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-white max-sm:w-3 max-sm:h-3"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        )}
      </div>
      <div
        className={`rounded-2xl px-4 py-3 shadow-lg ${
          message.sender === "user"
            ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white"
            : ""
        } max-sm:px-2 max-sm:py-2`}
        style={
          message.sender === "ai"
            ? {
                backgroundColor: isDarkMode
                  ? "rgba(30, 41, 59, 0.6)"
                  : "rgba(255, 255, 255, 0.8)",
                color: isDarkMode ? "#f1f5f9" : "#1e293b",
                border: `1px solid ${
                  isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)"
                }`,
                fontSize: window.innerWidth <= 640 ? "0.85rem" : undefined,
                lineHeight: window.innerWidth <= 640 ? "1.2" : undefined,
                padding: window.innerWidth <= 640 ? undefined : undefined,
              }
            : window.innerWidth <= 640
              ? {
                  fontSize: "0.85rem",
                  lineHeight: "1.2",
                  padding: undefined,
                }
              : {}
        }
      >
        {message.imageUrl ? (
          <img
            src={message.imageUrl}
            alt="uploaded"
            className="rounded-xl max-w-xs max-h-60 mb-2 object-contain border max-sm:max-w-[120px] max-sm:max-h-28"
            style={{ background: isDarkMode ? "#1e293b" : "#f1f5f9" }}
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap max-sm:text-xs max-sm:leading-snug">
            {message.content}
          </p>
        )}
        <p
          className={`text-xs mt-2 opacity-70 ${
            message.sender === "user" ? "text-white" : ""
          } max-sm:text-[10px] max-sm:mt-1`}
          style={
            message.sender === "ai"
              ? { color: isDarkMode ? "#94a3b8" : "#64748b" }
              : {}
          }
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  </div>
);

const TypingIndicator = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div className="flex justify-start mb-6">
    <div className="flex items-start gap-3 max-w-[70%]">
      <div
        className="rounded-2xl px-4 py-3 shadow-lg"
        style={{
          backgroundColor: isDarkMode
            ? "rgba(30, 41, 59, 0.6)"
            : "rgba(255, 255, 255, 0.8)",
          border: `1px solid ${
            isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
          }`,
        }}
      >
        <div className="flex space-x-1">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: isDarkMode ? "#94a3b8" : "#64748b" }}
          />
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: isDarkMode ? "#94a3b8" : "#64748b",
              animationDelay: "0.2s",
            }}
          />
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: isDarkMode ? "#94a3b8" : "#64748b",
              animationDelay: "0.4s",
            }}
          />
        </div>
      </div>
    </div>
  </div>
);

export default function Chat() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [user, setUser] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: "welcome",
        content:
          "Hello! I'm your AI companion. Please note that the first response may take 30+ seconds as the backend initializes. Subsequent responses will be much faster. How can I help you today?",
        sender: "ai",
        timestamp: new Date(),
      },
    ],
    inputValue: "",
    isTyping: false,
    pendingImage: undefined,
  });
  const [showImageDropdown, setShowImageDropdown] = useState(false);

  // Load user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          // Try Firestore avatar first
          try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              if (data.avatar) {
                setUserAvatar(data.avatar);
                return;
              }
            }
            // Fallback to photoURL
            setUserAvatar(firebaseUser.photoURL || "");
          } catch (error) {
            console.error("Error loading user avatar:", error);
            setUserAvatar(firebaseUser.photoURL || "");
          }
        } else {
          setUserAvatar("");
        }
      },
    );
    return () => unsubscribe();
  }, []);

  // Load chat history from Firestore (last 60 days)
  useEffect(() => {
    if (!user) {
      console.log("No user authenticated, setting loading to false");
      setLoading(false);
      return;
    }
    const loadMessages = async () => {
      try {
        setLoading(true);
        console.log("Loading messages for user:", user.uid);
        const chatDoc = doc(db, "chats", user.uid);
        const chatSnap = await getDoc(chatDoc);
        let messages: Message[] = [];
        if (chatSnap.exists()) {
          const data = chatSnap.data();
          console.log("Chat data exists:", data);
          if (Array.isArray(data.messages)) {
            // Only keep messages from last 60 days
            const now = Date.now();
            const sixtyDays = 60 * 24 * 60 * 60 * 1000;
            messages = data.messages
              .map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }))
              .filter(
                (msg: Message) =>
                  now - new Date(msg.timestamp).getTime() < sixtyDays,
              );
          }
        } else {
          console.log("No existing chat data for user");
        }
        console.log("Loaded messages:", messages.length);
        setState((prev) => ({ ...prev, messages }));
      } catch (error) {
        console.error("Error loading messages:", error);
        setState((prev) => ({ ...prev, messages: [] }));
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [user]);

  // Save chat to Firestore (messages already limited to 100 in state management)
  const saveMessages = async (messages: Message[]) => {
    if (!user) {
      console.log("No user found, cannot save messages");
      return;
    }
    try {
      console.log(
        "Saving messages:",
        messages.length,
        "messages for user:",
        user.uid,
      );

      const chatDoc = doc(db, "chats", user.uid);
      await setDoc(chatDoc, {
        messages: messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
        updatedAt: serverTimestamp(),
      });
      console.log("Messages saved successfully");
    } catch (error) {
      console.error("Error saving messages:", error);
    }
  };

  // Store image for later sending with message
  async function handleImageUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setState((prev) => ({
        ...prev,
        pendingImage: { file, preview },
      }));
    };
    reader.readAsDataURL(file);
  }

  // Remove pending image
  const removePendingImage = () => {
    setState((prev) => ({
      ...prev,
      pendingImage: undefined,
    }));
  };

  const handleSendMessage = async () => {
    if (!state.inputValue.trim() && !state.pendingImage) {
      console.log("No input or image, not sending");
      return;
    }
    if (!user) {
      console.log("No user authenticated, not sending");
      return;
    }

    console.log(
      "Sending message:",
      state.inputValue,
      "with image:",
      !!state.pendingImage,
    );

    // Store image file before clearing state
    const imageFile = state.pendingImage?.file;

    // Create user message (with image if available)
    const userMessage: Message = {
      id: Date.now().toString(),
      content: state.inputValue,
      sender: "user",
      timestamp: new Date(),
      ...(state.pendingImage?.preview && {
        imageUrl: state.pendingImage.preview,
      }), // Only add imageUrl if it exists
    };

    // Update state with user message and clear input/image
    setState((prev) => {
      const updatedMessages = [...prev.messages, userMessage];
      // Keep only the last 100 messages to prevent memory issues
      const limitedMessages = updatedMessages.slice(-100);

      return {
        ...prev,
        messages: limitedMessages,
        inputValue: "",
        pendingImage: undefined,
        isTyping: true,
      };
    });
    inputRef.current?.focus();

    // Save user message
    try {
      // Get current messages after state update
      const currentMessages = [...state.messages, userMessage].slice(-100);
      await saveMessages(currentMessages);
      console.log("User message saved");
    } catch (error) {
      console.error("Error saving user message:", error);
    }

    // Get AI response from unified backend
    try {
      // Choose the appropriate API function based on whether we have an image
      const res = imageFile
        ? await apiChatWithImage(
            userMessage.content || "How are you?",
            imageFile,
          )
        : await apiChat(userMessage.content || "How are you?");

      let aiResponseContent;

      if (res.success) {
        aiResponseContent = res.response;
        console.log("AI response received:", aiResponseContent);
      } else {
        aiResponseContent = res.response; // Fallback response from API
        console.warn("Fallback response used:", res.response);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        sender: "ai",
        timestamp: new Date(),
      };

      console.log("Generated AI response:", aiMessage.content);

      setState((prev) => {
        const updatedMessages = [...prev.messages, aiMessage];
        // Keep only the last 100 messages to prevent memory issues
        const limitedMessages = updatedMessages.slice(-100);

        return {
          ...prev,
          messages: limitedMessages,
          isTyping: false,
        };
      });

      // Save both messages
      const currentMessages = [...state.messages, userMessage, aiMessage].slice(
        -100,
      );
      await saveMessages(currentMessages);
      console.log("AI message saved");
    } catch (error) {
      console.error("Error generating/saving AI response:", error);

      // Fallback response if backend fails
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'm having some technical difficulties right now. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isTyping: false,
      }));

      await saveMessages([...state.messages, userMessage, aiMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Always scroll to bottom when messages change
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus(); // Focus input after every message change
    }, 50);
    return () => clearTimeout(timeout);
  }, [state.messages, state.isTyping]);

  // Dropdown portal root
  const dropdownPortalRoot =
    typeof window !== "undefined" ? document.body : null;

  return (
    <div
      className="w-full font-poppins bg-transparent z-50 flex flex-col min-h-screen max-sm:min-h-0 max-sm:h-auto"
      style={{
        background: isDarkMode
          ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        boxShadow:
          "0 0 80px 10px rgba(172,127,244,0.15), 0 0 120px 30px rgba(100,116,139,0.10)",
        overflow: "hidden",
        height: "100vh",
      }}
    >
      {/* Debug info - remove this in production */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "8px",
            fontSize: "12px",
            zIndex: 9999,
          }}
        >
          User: {user?.uid ? "Yes" : "No"} | Avatar: {userAvatar ? "Yes" : "No"} |
          Messages: {state.messages.length}
        </div>
      )}
      {/* Fixed translucent header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          zIndex: 100,
          height: HEADER_HEIGHT,
          pointerEvents: "auto",
        }}
      >
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => toggleDarkMode()}
          onAccountClick={() => navigate("/account")}
          onHomeClick={() => navigate("/")}
          userPFP={userAvatar}
        />
      </div>
      {/* Chat Messages */}
      <main
        className="flex-1 w-full flex flex-col min-h-0 max-sm:pt-2"
        style={{ overflow: "hidden", height: "0" }}
      >
        {" "}
        {/* height: 0 + flex-1 = fill remaining */}
        <div
          className="flex-1 w-full px-2 sm:px-3 pt-8 pb-2 chat-scroll max-sm:px-0.5 max-sm:pt-3 max-sm:pb-1 overflow-y-auto overflow-x-hidden"
          style={{
            minHeight: 0,
            borderRadius: "14px",
            background: isDarkMode
              ? "rgba(30, 41, 59, 0.35)"
              : "rgba(255, 255, 255, 0.7)",
            boxShadow: isDarkMode
              ? "0 2px 16px 0 rgba(0,0,0,0.25)"
              : "0 2px 16px 0 rgba(172,127,244,0.08)",
            transition: "background 0.3s, box-shadow 0.3s",
            pointerEvents: "auto",
            overflowX: "hidden",
            overflowY: "auto",
            maxWidth: "100vw",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingTop: window.innerWidth > 640 ? 88 : 56, // header height
            paddingBottom: window.innerWidth > 640 ? 88 : 56, // message bar height
            height: "100%",
          }}
          tabIndex={0}
        >
          <style>{`
            .chat-scroll { scrollbar-width: none !important; -ms-overflow-style: none !important; overflow-x: hidden !important; }
            .chat-scroll::-webkit-scrollbar { display: none !important; width: 0 !important; background: transparent !important; }
            textarea::-webkit-scrollbar, .chat-scroll *::-webkit-scrollbar { display: none !important; width: 0 !important; background: transparent !important; }
            textarea { scrollbar-width: none !important; -ms-overflow-style: none !important; }
          `}</style>
          {/* Mobile logo at top for chat */}
          <div className="w-full flex justify-center items-center mb-2 sm:hidden">
            <img src="/Browser-tab.svg" alt="Logo" className="w-8 h-8" />
          </div>
          {loading ? (
            <div className="w-full flex justify-center items-center pt-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
            </div>
          ) : !user ? (
            <div className="w-full flex flex-col items-center justify-center pt-12 opacity-60 select-none">
              <img
                src="/Browser-tab.svg"
                alt="Not logged in"
                className="w-16 h-16 mb-4"
              />
              <p className="text-lg max-sm:text-base text-slate-500 dark:text-slate-400 mb-4">
                Please log in to start chatting
              </p>
              <button
                onClick={() => navigate("/account")}
                className="px-6 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/80 transition-colors"
              >
                Go to Account
              </button>
            </div>
          ) : state.messages.length > 0 ? (
            state.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isDarkMode={isDarkMode}
                userPFP={userAvatar}
              />
            ))
          ) : (
            <div className="w-full flex flex-col items-center justify-center pt-12 opacity-60 select-none">
              <img
                src="/Browser-tab.svg"
                alt="No messages"
                className="w-16 h-16 mb-4"
              />
              <div className="text-center space-y-3">
                <p className="text-lg max-sm:text-base text-slate-600 dark:text-slate-300 font-medium">
                  No messages yet. Start the conversation!
                </p>
                <div className="text-sm max-sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-4 py-3 max-w-md mx-auto border border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">
                    First Response Notice
                  </p>
                  <p className="leading-relaxed">
                    Initial response may take 30+ seconds as the backend initializes. 
                    Subsequent responses will be much faster.
                  </p>
                </div>
              </div>
            </div>
          )}
          {state.isTyping && <TypingIndicator isDarkMode={isDarkMode} />}
          <div ref={messagesEndRef} />
        </div>
      </main>
      {/* Input Area at the bottom, now fixed and translucent, overlays chat */}
      <div
        className="border-t backdrop-blur-sm w-full max-sm:px-1"
        style={{
          backgroundColor: isDarkMode
            ? "rgba(24, 16, 48, 0.85)"
            : "rgba(255, 255, 255, 0.85)",
          borderColor: isDarkMode ? "#2d1a4d" : "rgba(0, 0, 0, 0.1)",
          position: "fixed",
          bottom: 0,
          left: 0,
          zIndex: 50,
          width: "100vw",
          maxWidth: "100vw",
          overflowX: "hidden",
          boxShadow: "0 -2px 16px 0 rgba(172,127,244,0.08)",
          paddingBottom: window.innerWidth <= 640 ? 6 : undefined, // Add 6px bottom padding for mobile
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Pending Image Preview */}
        {state.pendingImage && (
          <div className="w-full max-w-5xl mx-auto p-2 mb-2">
            <div
              className="relative inline-block rounded-lg overflow-hidden border-2 border-brand-purple/30 bg-white/10 backdrop-blur-sm"
              style={{ maxWidth: "200px" }}
            >
              <img
                src={state.pendingImage.preview}
                alt="Pending upload"
                className="w-full h-auto max-h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <button
                onClick={removePendingImage}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                ×
              </button>
              <div className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-2 py-1 rounded">
                Image ready to send
              </div>
            </div>
          </div>
        )}

        <div
          className="w-full max-w-5xl mx-auto p-2 flex gap-2 items-center max-sm:p-1 max-sm:gap-1"
          style={{ overflowX: "hidden" }}
        >
          <div className="flex-1 flex items-center max-sm:mr-1">
            <textarea
              ref={inputRef}
              value={state.inputValue}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  inputValue: e.target.value,
                }))
              }
              onKeyPress={handleKeyPress}
              placeholder={
                user
                  ? "Share your thoughts and feelings..."
                  : "Please log in to chat"
              }
              className="w-full resize-none rounded-2xl border-2 px-4 py-3 text-sm transition-all duration-300 focus:outline-none focus:border-brand-blue focus:scale-[1.02] min-h-[40px] max-h-16 max-sm:px-2 max-sm:py-2 max-sm:text-xs max-sm:min-h-[32px] max-sm:max-h-12"
              style={{
                backgroundColor: isDarkMode
                  ? "#1a1333"
                  : "rgba(255, 255, 255, 0.9)",
                borderColor: isDarkMode
                  ? "#AC7FF4"
                  : "rgba(172, 127, 244, 0.3)",
                color: isDarkMode ? "#f1f5f9" : "#1e293b",
              }}
              rows={1}
              disabled={state.isTyping || !user}
            />
          </div>
          {/* Spacer between message box and upload image button: more on laptop, less on mobile */}
          <div className="hidden sm:block" style={{ width: 16 }} />
          <div className="hidden max-sm:block" style={{ width: 6 }} />
          {/* Image upload/send dropdown - now rendered in a portal */}
          <div
            className="relative flex flex-row items-center max-sm:gap-0"
            style={{ gap: "0.5rem" }}
          >
            <button
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-pink to-brand-blue text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer max-sm:w-7 max-sm:h-7"
              onClick={() => setShowImageDropdown((prev) => !prev)}
              type="button"
              aria-label="Send Image Options"
              style={{ marginLeft: 0, marginRight: 0 }}
            >
              <svg
                className="w-6 h-6 max-sm:w-4 max-sm:h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10l4.553 4.553a1.5 1.5 0 01-2.121 2.121L13 12.121M21 21H3a2 2 0 01-2-2V5a2 2 0 012-2h18a2 2 0 012 2v14a2 2 0 01-2 2z"
                />
              </svg>
            </button>
            {showImageDropdown &&
              dropdownPortalRoot &&
              createPortal(
                <div
                  className="absolute bottom-14 left-0 sm:left-1/2 sm:-translate-x-1/2 bg-white dark:bg-slate-800 border rounded-2xl shadow-2xl flex flex-col min-w-[180px] animate-fade-in max-sm:min-w-[100px]"
                  style={{
                    boxShadow: "0 8px 32px 0 rgba(60,60,120,0.18)",
                    padding: "8px 0",
                    zIndex: 99999999999999,
                    position: "fixed",
                    left: "50%",
                    bottom: window.innerWidth <= 640 ? 80 : 100, // just above message bar
                    transform: "translateX(-50%)",
                  }}
                >
                  <label
                    htmlFor="chat-image-upload"
                    className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 max-sm:px-2 max-sm:py-2 max-sm:text-xs"
                  >
                    <svg
                      className="w-5 h-5 max-sm:w-4 max-sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10l4.553 4.553a1.5 1.5 0 01-2.121 2.121L13 12.121M21 21H3a2 2 0 01-2-2V5a2 2 0 012-2h18a2 2 0 012 2v14a2 2 0 01-2 2z"
                      />
                    </svg>
                    Upload Image
                  </label>
                  <button
                    className="flex items-center gap-2 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer rounded-xl transition-all duration-200 max-sm:px-2 max-sm:py-2 max-sm:text-xs"
                    onClick={async () => {
                      setShowImageDropdown(false);
                      if (
                        navigator.mediaDevices &&
                        navigator.mediaDevices.getUserMedia
                      ) {
                        try {
                          let useFront = true;
                          let stream: MediaStream | null = null;
                          const getStream = async () => {
                            if (stream) {
                              stream
                                .getTracks()
                                .forEach((track) => track.stop());
                            }
                            stream = await navigator.mediaDevices.getUserMedia({
                              video: {
                                facingMode: useFront ? "user" : "environment",
                              },
                            });
                            video.srcObject = stream;
                            video.play();
                          };
                          const video = document.createElement("video");
                          video.style.width =
                            window.innerWidth <= 640 ? "90vw" : "480px";
                          video.style.height =
                            window.innerWidth <= 640 ? "auto" : "320px";
                          video.style.borderRadius =
                            window.innerWidth <= 640 ? "12px" : "16px";
                          video.style.objectFit = "cover";
                          await getStream();
                          // Create a modal for camera capture
                          const modal = document.createElement("div");
                          modal.style.position = "fixed";
                          modal.style.top = "0";
                          modal.style.left = "0";
                          modal.style.width = "100vw";
                          modal.style.height = "100vh";
                          modal.style.background = "rgba(0,0,0,0.7)";
                          modal.style.display = "flex";
                          modal.style.alignItems = "center";
                          modal.style.justifyContent = "center";
                          modal.style.zIndex = "9999";
                          const container = document.createElement("div");
                          container.style.background =
                            window.innerWidth <= 640 ? "#181e2a" : "#fff";
                          container.style.padding =
                            window.innerWidth <= 640 ? "8px" : "24px";
                          container.style.borderRadius =
                            window.innerWidth <= 640 ? "14px" : "16px";
                          container.style.display = "flex";
                          container.style.flexDirection = "column";
                          container.style.alignItems = "center";
                          container.appendChild(video);
                          const controls = document.createElement("div");
                          controls.style.display = "flex";
                          controls.style.gap =
                            window.innerWidth <= 640 ? "4px" : "8px";
                          controls.style.marginTop =
                            window.innerWidth <= 640 ? "8px" : "16px";
                          const captureBtn = document.createElement("button");
                          captureBtn.innerText = "Capture";
                          captureBtn.style.padding =
                            window.innerWidth <= 640 ? "6px 16px" : "8px 24px";
                          captureBtn.style.borderRadius =
                            window.innerWidth <= 640 ? "8px" : "8px";
                          captureBtn.style.background = "#7c3aed";
                          captureBtn.style.color = "#fff";
                          captureBtn.style.border = "none";
                          captureBtn.style.fontWeight = "bold";
                          captureBtn.style.fontSize =
                            window.innerWidth <= 640 ? "1rem" : "1.1rem";
                          captureBtn.style.cursor = "pointer";
                          if (window.innerWidth <= 1024) {
                            // Hide switch camera on laptop/desktop
                            const toggleBtn = document.createElement("button");
                            toggleBtn.innerText = "Switch Camera";
                            toggleBtn.style.padding =
                              window.innerWidth <= 640
                                ? "6px 16px"
                                : "8px 24px";
                            toggleBtn.style.borderRadius =
                              window.innerWidth <= 640 ? "8px" : "8px";
                            toggleBtn.style.background = "#64748b";
                            toggleBtn.style.color = "#fff";
                            toggleBtn.style.border = "none";
                            toggleBtn.style.fontWeight = "bold";
                            toggleBtn.style.fontSize =
                              window.innerWidth <= 640 ? "1rem" : "1.1rem";
                            toggleBtn.style.cursor = "pointer";
                            controls.appendChild(toggleBtn);
                            toggleBtn.onclick = async () => {
                              useFront = !useFront;
                              await getStream();
                            };
                          }
                          controls.appendChild(captureBtn);
                          container.appendChild(controls);
                          modal.appendChild(container);
                          document.body.appendChild(modal);
                          captureBtn.onclick = () => {
                            const canvas = document.createElement("canvas");
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            canvas.getContext("2d")?.drawImage(video, 0, 0);
                            canvas.toBlob(async (blob) => {
                              if (blob) {
                                // Convert blob to file and handle as image upload
                                const file = new File(
                                  [blob],
                                  "camera-capture.jpg",
                                  {
                                    type: "image/jpeg",
                                    lastModified: Date.now(),
                                  },
                                );
                                await handleImageUpload(file);
                              }
                              if (stream)
                                stream
                                  .getTracks()
                                  .forEach((track) => track.stop());
                              document.body.removeChild(modal);
                            }, "image/jpeg");
                          };
                          modal.onclick = (e) => {
                            if (e.target === modal) {
                              if (stream)
                                stream
                                  .getTracks()
                                  .forEach((track) => track.stop());
                              document.body.removeChild(modal);
                            }
                          };
                        } catch (err) {
                          alert("Camera error: " + err);
                        }
                      } else {
                        alert("Camera not supported on this device.");
                      }
                    }}
                    type="button"
                  >
                    <svg
                      className="w-5 h-5 max-sm:w-4 max-sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7h2l.4 2M7 7h10l1 2h2M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Take Photo
                  </button>
                </div>,
                dropdownPortalRoot,
              )}
            <input
              type="file"
              accept="image/*"
              id="chat-image-upload"
              style={{ display: "none" }}
              onChange={async (e) => {
                setShowImageDropdown(false);
                const file = e.target.files?.[0];
                if (!file) return;
                await handleImageUpload(file);
                e.target.value = "";
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!state.inputValue.trim() || state.isTyping || !user}
            className="w-10 h-10 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed max-sm:w-7 max-sm:h-7"
            style={{ marginLeft: "0.5rem" }}
          >
            <svg
              className="w-5 h-5 max-sm:w-4 max-sm:h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
