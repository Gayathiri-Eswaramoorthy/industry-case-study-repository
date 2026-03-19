import axiosInstance from "./axiosInstance";
import { jwtDecode } from "jwt-decode";

export const loginUser = async (email, password) => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });

    const token =
      typeof response.data === "string" ? response.data : response.data?.token;

    let user =
      typeof response.data === "object" && response.data !== null
        ? response.data.user || null
        : null;

    if (token && (!user || !user.id)) {
      try {
        const decoded = jwtDecode(token);
        user = {
          id: decoded.id ?? decoded.userId ?? decoded.sub_id ?? null,
          email: decoded.sub ?? "",
          role: decoded.role ?? "STUDENT",
        };
        if (!user.id) {
          const allClaims = Object.keys(decoded);
          console.warn("JWT claims available:", allClaims, decoded);
        }
      } catch {
        user = null;
      }
    }

    return { token, user };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};
