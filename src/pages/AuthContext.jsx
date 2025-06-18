import React, { createContext, useState, useEffect } from "react";

// AuthContext.tsx
export const AuthContext = createContext({ role: "", setRole: () => {} });

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role) {
          setRole(parsedUser.role);
        }
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};
