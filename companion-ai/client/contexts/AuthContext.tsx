import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthState {
  isLoggedIn: boolean;
  isNewUser: boolean;
  isDarkMode: boolean;
}

interface AuthContextType {
  auth: AuthState;
  login: (isNewUser?: boolean) => void;
  logout: () => void;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    isNewUser: false,
    isDarkMode: false,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("companion-auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAuth(parsed);
      } catch (error) {
        console.error("Failed to parse auth state:", error);
      }
    }
  }, []);

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("companion-auth", JSON.stringify(auth));
  }, [auth]);

  const login = (isNewUser = false) => {
    setAuth((prev) => ({
      ...prev,
      isLoggedIn: true,
      isNewUser,
    }));
  };

  const logout = () => {
    setAuth((prev) => ({
      ...prev,
      isLoggedIn: false,
      isNewUser: false,
    }));
  };

  const toggleDarkMode = () => {
    setAuth((prev) => ({
      ...prev,
      isDarkMode: !prev.isDarkMode,
    }));
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};
