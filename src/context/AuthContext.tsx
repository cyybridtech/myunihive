import { createContext, useState, useEffect, ReactNode, useContext } from "react";
import { registerUser, loginUser } from "../api/api.js";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  gender?: 'male' | 'female';
  avatar?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  login: (email: string, password: string) => Promise<User>;

  register: (firstName: string, lastName: string, fullName: string, email: string, phone: string, universityId: string, password: string, gender: string, otp: string) => Promise<void>;

  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser || !parsedUser.token || !parsedUser.id) {
          throw new Error('Invalid stored auth state');
        }

        setUser(parsedUser);
      } catch (error) {
        console.warn('Clearing invalid stored auth state', error);
        localStorage.removeItem("user");
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      console.log('AuthContext login response', data);

      if (data.status === "success" && data.token) {
        const userData = { ...data.user, token: data.token };
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        return userData;
      }

      throw new Error(data.message || "Login failed: missing auth token");
    } finally {
      setLoading(false);
    }
  };


  const register = async (
    firstName: string,
    lastName: string,
    fullName: string,
    email: string,
    phone: string,
    universityId: string,
    password: string,
    gender: string,
    otp: string
  ) => {
    setLoading(true);
    try {
      const data = await registerUser({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email,
        phone,
        university_id: universityId,
        password,
        gender,
        otp,
      });

      if (data.status === "success") {
        await login(email, password);
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isManager: user?.role === "manager" || user?.role === "hostel_manager",
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

