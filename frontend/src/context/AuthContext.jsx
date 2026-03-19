import { createContext, useState } from "react";

export const AuthContext = createContext();

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem("token"),
    user: getStoredUser(),
  }));

  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setAuth({ token, user });
    if (!user?.id) {
      console.warn("User object missing id - CO/PO attainment will not load", user);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token: null, user: null });
  };

  const token = auth.token;
  const user = auth.user;
  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ auth, token, user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
